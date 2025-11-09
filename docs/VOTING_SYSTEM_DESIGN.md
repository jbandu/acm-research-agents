# Comprehensive Response Voting & RAG Improvement System

## Executive Summary

A multi-tiered voting system that captures user feedback on LLM responses and uses this data to:
1. Improve future response quality through RAG
2. Weight consensus calculations
3. Select best examples for few-shot learning
4. Track provider performance over time
5. Enable intelligent response ranking

---

## 1. Database Schema Design

### 1.1 Core Voting Table

```sql
-- Migration: 011_response_voting_system.sql

-- Track individual votes on responses
CREATE TABLE response_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES llm_responses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous voting
  session_id VARCHAR(255), -- Track anonymous users by session

  -- Vote data
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')), -- or INTEGER: 1/-1
  vote_value INTEGER NOT NULL CHECK (vote_value IN (1, -1)), -- Numeric for calculations

  -- Optional feedback
  vote_reason VARCHAR(50), -- helpful, accurate, comprehensive, clear, well_sourced, inaccurate, incomplete, unclear
  feedback_text TEXT, -- Optional detailed feedback

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  ip_address INET, -- For spam prevention
  user_agent TEXT,

  -- Constraints
  UNIQUE(response_id, user_id), -- One vote per user per response
  UNIQUE(response_id, session_id) -- One vote per session per response (for anonymous)
);

CREATE INDEX idx_response_votes_response ON response_votes(response_id);
CREATE INDEX idx_response_votes_user ON response_votes(user_id);
CREATE INDEX idx_response_votes_created ON response_votes(created_at DESC);
CREATE INDEX idx_response_votes_reason ON response_votes(vote_reason);
```

### 1.2 Aggregate Quality Metrics

```sql
-- Pre-computed aggregate table for performance
CREATE TABLE response_quality_metrics (
  response_id UUID PRIMARY KEY REFERENCES llm_responses(id) ON DELETE CASCADE,

  -- Vote counts
  total_upvotes INTEGER DEFAULT 0,
  total_downvotes INTEGER DEFAULT 0,
  net_score INTEGER DEFAULT 0, -- upvotes - downvotes
  total_votes INTEGER DEFAULT 0,

  -- Quality scores (0-100)
  quality_score DECIMAL(5,2) DEFAULT 0, -- Calculated: (upvotes / total_votes) * 100
  wilson_score DECIMAL(5,2) DEFAULT 0, -- More robust scoring for low vote counts

  -- Feedback categories count
  helpful_count INTEGER DEFAULT 0,
  accurate_count INTEGER DEFAULT 0,
  comprehensive_count INTEGER DEFAULT 0,
  clear_count INTEGER DEFAULT 0,
  inaccurate_count INTEGER DEFAULT 0,
  incomplete_count INTEGER DEFAULT 0,

  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),

  -- Computed columns
  approval_rating DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_votes > 0
    THEN (total_upvotes::DECIMAL / total_votes) * 100
    ELSE 0 END
  ) STORED
);

CREATE INDEX idx_quality_net_score ON response_quality_metrics(net_score DESC);
CREATE INDEX idx_quality_wilson_score ON response_quality_metrics(wilson_score DESC);
CREATE INDEX idx_quality_total_votes ON response_quality_metrics(total_votes DESC);
```

### 1.3 Provider Performance Analytics

```sql
-- Track provider performance over time
CREATE TABLE provider_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(50) NOT NULL,

  -- Time period
  period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, all_time
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,

  -- Query categorization (optional)
  query_category VARCHAR(100), -- medical, technical, general, etc.
  workflow_id UUID REFERENCES workflows(id),

  -- Performance metrics
  total_responses INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  total_upvotes INTEGER DEFAULT 0,
  total_downvotes INTEGER DEFAULT 0,
  avg_quality_score DECIMAL(5,2) DEFAULT 0,
  avg_net_score DECIMAL(5,2) DEFAULT 0,

  -- Rankings
  rank_by_quality INTEGER, -- 1 = best
  rank_by_votes INTEGER,

  -- Response time metrics
  avg_response_time_ms INTEGER,
  avg_tokens_used INTEGER,

  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(provider_name, period_type, period_start, query_category)
);

CREATE INDEX idx_provider_perf_provider ON provider_performance(provider_name);
CREATE INDEX idx_provider_perf_period ON provider_performance(period_type, period_start DESC);
CREATE INDEX idx_provider_perf_quality ON provider_performance(avg_quality_score DESC);
```

### 1.4 High-Quality Response Cache for RAG

```sql
-- Store top-rated responses for use as few-shot examples
CREATE TABLE rag_quality_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to original response
  response_id UUID NOT NULL REFERENCES llm_responses(id) ON DELETE CASCADE,
  query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,

  -- Query and response content (denormalized for performance)
  query_text TEXT NOT NULL,
  query_embedding VECTOR(1536), -- For similarity search (if using pgvector)
  response_text TEXT NOT NULL,

  -- Quality indicators
  quality_score DECIMAL(5,2) NOT NULL,
  total_votes INTEGER NOT NULL,
  net_score INTEGER NOT NULL,

  -- Categorization
  query_category VARCHAR(100),
  workflow_id UUID REFERENCES workflows(id),
  tags TEXT[], -- Searchable tags

  -- Usage tracking
  times_used_as_example INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE, -- Can be disabled if outdated

  -- Only include high-quality responses
  CONSTRAINT quality_threshold CHECK (quality_score >= 70 AND total_votes >= 3)
);

CREATE INDEX idx_rag_quality_score ON rag_quality_examples(quality_score DESC);
CREATE INDEX idx_rag_category ON rag_quality_examples(query_category);
CREATE INDEX idx_rag_provider ON rag_quality_examples(provider);
CREATE INDEX idx_rag_tags ON rag_quality_examples USING GIN(tags);
-- If using pgvector for semantic search:
-- CREATE INDEX idx_rag_embedding ON rag_quality_examples USING ivfflat(query_embedding vector_cosine_ops);
```

---

## 2. UI/UX Design

### 2.1 Vote Button Component

**Location:** Each LLM response card

**Design:**
```
┌─────────────────────────────────────────────────────┐
│ [C] Claude                     claude-3-5-sonnet    │
│                                                      │
│ Response text here...                                │
│                                                      │
├─────────────────────────────────────────────────────┤
│ Confidence: 85%    Tokens: 1,234    Time: 2.3s     │
│                                                      │
│ ┌──────────────────────────┬────────────────────┐  │
│ │  👍 42  |  👎 3           │  📋 Copy Response  │  │
│ │  [Helpful]               │                    │  │
│ └──────────────────────────┴────────────────────┘  │
└─────────────────────────────────────────────────────┘

States:
- Not voted: Gray icons, clickable
- Upvoted: Green thumb up, blue outline, "You found this helpful"
- Downvoted: Red thumb down, red outline, "Not helpful?"
- Hover: Show tooltip "Mark as helpful" / "Mark as not helpful"
```

**Feedback Modal (optional, appears on downvote):**
```
┌─────────────────────────────────────────────────────┐
│  Why wasn't this helpful?                      [✕]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ☐ Inaccurate information                          │
│  ☐ Incomplete answer                               │
│  ☐ Unclear or confusing                            │
│  ☐ Not relevant to my question                     │
│  ☐ Lacks supporting evidence                       │
│                                                      │
│  Additional feedback (optional):                    │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│         [Skip]              [Submit Feedback]       │
└─────────────────────────────────────────────────────┘
```

### 2.2 Quality Indicators

**Badge on High-Quality Responses:**
```
┌─────────────────────────────────────────┐
│ ⭐ Community Favorite                   │
│ 95% of users found this helpful (42/44) │
└─────────────────────────────────────────┘
```

**Response Ranking:**
```
🥇 Highest Rated Response
🥈 Second Highest
🥉 Third Highest
```

### 2.3 Analytics Dashboard (Admin)

**Location:** `/admin/analytics` or `/analytics`

**Sections:**

1. **Overview KPIs**
   - Total votes cast
   - Average quality score across all responses
   - Most helpful provider
   - Voting participation rate

2. **Provider Performance**
   - Table/chart showing each provider's avg quality score
   - Trend lines over time
   - Category breakdown

3. **Query Categories**
   - Which types of queries get best responses
   - Category-specific provider rankings

4. **Recent Feedback**
   - Latest votes and feedback text
   - Flagged low-quality responses

---

## 3. RAG Integration Strategy

### 3.1 Few-Shot Example Selection

**Goal:** Use high-quality responses as examples in prompts

**Implementation:**

```typescript
// lib/rag-quality-selector.ts

export async function getHighQualityExamples(
  queryText: string,
  category?: string,
  limit: number = 3
): Promise<QualityExample[]> {

  // Strategy 1: Exact category match
  let examples = await query(`
    SELECT
      query_text,
      response_text,
      provider,
      quality_score,
      total_votes
    FROM rag_quality_examples
    WHERE is_active = TRUE
      AND query_category = $1
      AND quality_score >= 80
    ORDER BY quality_score DESC, total_votes DESC
    LIMIT $2
  `, [category, limit]);

  // Strategy 2: Semantic similarity (if using embeddings)
  if (examples.length < limit) {
    // Find similar queries using vector similarity
    const queryEmbedding = await getEmbedding(queryText);
    const similarExamples = await findSimilarQueries(queryEmbedding, limit);
    examples = [...examples, ...similarExamples];
  }

  // Update usage tracking
  for (const example of examples) {
    await incrementExampleUsage(example.id);
  }

  return examples;
}

// Enhanced system prompt with quality examples
export function buildEnhancedPrompt(
  userQuery: string,
  examples: QualityExample[]
): string {
  const examplesText = examples.map((ex, i) => `
Example ${i + 1} (Quality Score: ${ex.quality_score}%):
Query: "${ex.query_text}"
Response: "${ex.response_text.substring(0, 500)}..."
  `).join('\n\n');

  return `You are analyzing a research query. Below are examples of high-quality responses (rated by users):

${examplesText}

Please provide a response of similar quality: comprehensive, accurate, and well-sourced.

User Query: ${userQuery}`;
}
```

### 3.2 Consensus Weighting

**Goal:** Weight consensus calculation by historical provider performance

```typescript
// lib/consensus-with-quality.ts

interface ResponseWithQuality extends LLMResponse {
  qualityMetrics?: {
    providerAvgScore: number; // Historical average
    responseNetScore?: number; // This specific response
  };
}

export function calculateQualityWeightedConsensus(
  responses: ResponseWithQuality[]
): ConsensusResult {

  // Filter successful responses
  const valid = responses.filter(r => !r.error && r.responseText);

  if (valid.length < 2) {
    return { hasConsensus: false, consensusLevel: 'low', conflictingProviders: [] };
  }

  // Calculate weighted scores
  const weightedScores = valid.map(r => {
    const baseConfidence = r.confidenceScore || 50;
    const providerWeight = (r.qualityMetrics?.providerAvgScore || 50) / 100;
    const responseWeight = r.qualityMetrics?.responseNetScore
      ? Math.min(1, (r.qualityMetrics.responseNetScore + 10) / 20)
      : 1;

    return {
      provider: r.provider,
      weightedScore: baseConfidence * providerWeight * responseWeight
    };
  });

  // Analyze variance in weighted scores
  const avgScore = weightedScores.reduce((sum, s) => sum + s.weightedScore, 0) / weightedScores.length;
  const variance = weightedScores.reduce((sum, s) =>
    sum + Math.pow(s.weightedScore - avgScore, 2), 0) / weightedScores.length;

  // Lower variance = higher consensus
  if (variance < 100) return { hasConsensus: true, consensusLevel: 'high', conflictingProviders: [] };
  if (variance < 300) return { hasConsensus: true, consensusLevel: 'medium', conflictingProviders: [] };

  // Identify outliers
  const conflicting = weightedScores
    .filter(s => Math.abs(s.weightedScore - avgScore) > Math.sqrt(variance) * 1.5)
    .map(s => s.provider);

  return {
    hasConsensus: false,
    consensusLevel: 'low',
    conflictingProviders: conflicting
  };
}
```

### 3.3 Response Ranking & Reordering

**Goal:** Show best responses first based on votes + quality

```typescript
// Enhance response display with quality ranking
export function rankResponsesByQuality(
  responses: LLMResponse[],
  qualityMetrics: Map<string, QualityMetrics>
): RankedResponse[] {

  return responses
    .map(response => {
      const metrics = qualityMetrics.get(response.id);

      // Combined score: confidence + historical quality + current votes
      const confidenceScore = response.confidenceScore || 50;
      const providerScore = metrics?.providerAvgQuality || 50;
      const responseVotes = metrics?.netScore || 0;

      // Weighted formula
      const combinedScore =
        (confidenceScore * 0.4) +
        (providerScore * 0.3) +
        (Math.min(100, 50 + responseVotes * 5) * 0.3);

      return {
        ...response,
        combinedQualityScore: combinedScore,
        qualityRank: 0, // Set in next step
        badge: getBadge(combinedScore, metrics)
      };
    })
    .sort((a, b) => b.combinedQualityScore - a.combinedQualityScore)
    .map((response, index) => ({
      ...response,
      qualityRank: index + 1
    }));
}

function getBadge(score: number, metrics?: QualityMetrics): string | null {
  if (!metrics) return null;
  if (metrics.totalVotes >= 10 && metrics.approvalRating >= 90) return 'community_favorite';
  if (score >= 85) return 'high_quality';
  if (metrics.totalVotes >= 5 && metrics.approvalRating >= 80) return 'well_rated';
  return null;
}
```

### 3.4 Query Similarity & Historical Insights

**Goal:** Show "Similar queries found this helpful"

```typescript
// When displaying responses, show historical data
export async function getHistoricalInsights(
  queryText: string,
  currentResponseId: string
): Promise<HistoricalInsight | null> {

  // Find similar past queries
  const similarQueries = await query(`
    SELECT
      q.query_text,
      r.provider,
      r.response_text,
      m.quality_score,
      m.total_votes
    FROM queries q
    JOIN llm_responses r ON r.query_id = q.id
    JOIN response_quality_metrics m ON m.response_id = r.id
    WHERE q.query_text ILIKE $1
      AND m.quality_score >= 70
      AND m.total_votes >= 3
      AND r.id != $2
    ORDER BY m.quality_score DESC
    LIMIT 3
  `, [`%${queryText.substring(0, 50)}%`, currentResponseId]);

  if (similarQueries.rows.length === 0) return null;

  return {
    message: `Similar queries found these responses helpful:`,
    topProviders: [...new Set(similarQueries.rows.map(r => r.provider))],
    avgQuality: similarQueries.rows.reduce((sum, r) => sum + r.quality_score, 0) / similarQueries.rows.length
  };
}
```

---

## 4. API Endpoints

### 4.1 Vote Management

```typescript
// app/api/responses/[id]/vote/route.ts

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { vote_type, vote_reason, feedback_text } = await request.json();
  const responseId = params.id;

  // Get user/session
  const userId = await getUserId(request); // or null for anonymous
  const sessionId = userId ? null : await getSessionId(request);

  // Validate vote
  if (!['up', 'down'].includes(vote_type)) {
    return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
  }

  // Upsert vote (update if exists, insert if new)
  const voteValue = vote_type === 'up' ? 1 : -1;

  const result = await query(`
    INSERT INTO response_votes
      (response_id, user_id, session_id, vote_type, vote_value, vote_reason, feedback_text)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (response_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET
      vote_type = $4,
      vote_value = $5,
      vote_reason = $6,
      feedback_text = $7,
      updated_at = NOW()
    RETURNING *
  `, [responseId, userId, sessionId, vote_type, voteValue, vote_reason, feedback_text]);

  // Update aggregate metrics
  await updateQualityMetrics(responseId);

  return NextResponse.json({ success: true, vote: result.rows[0] });
}

// GET vote status
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const responseId = params.id;
  const userId = await getUserId(request);
  const sessionId = userId ? null : await getSessionId(request);

  // Get user's vote if exists
  const userVote = await query(`
    SELECT vote_type, vote_value
    FROM response_votes
    WHERE response_id = $1
      AND (user_id = $2 OR session_id = $3)
  `, [responseId, userId, sessionId]);

  // Get aggregate metrics
  const metrics = await query(`
    SELECT * FROM response_quality_metrics WHERE response_id = $1
  `, [responseId]);

  return NextResponse.json({
    userVote: userVote.rows[0] || null,
    metrics: metrics.rows[0] || { total_upvotes: 0, total_downvotes: 0, net_score: 0 }
  });
}
```

### 4.2 Analytics Endpoints

```typescript
// app/api/analytics/provider-performance/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'all_time';
  const category = searchParams.get('category');

  const performance = await query(`
    SELECT
      provider_name,
      avg_quality_score,
      total_responses,
      total_votes,
      total_upvotes,
      total_downvotes,
      rank_by_quality
    FROM provider_performance
    WHERE period_type = $1
      AND ($2::text IS NULL OR query_category = $2)
    ORDER BY rank_by_quality
  `, [period, category]);

  return NextResponse.json(performance.rows);
}

// app/api/analytics/quality-trends/route.ts

export async function GET() {
  // Get quality trends over time
  const trends = await query(`
    SELECT
      DATE(rv.created_at) as date,
      COUNT(*) as total_votes,
      SUM(CASE WHEN rv.vote_value = 1 THEN 1 ELSE 0 END) as upvotes,
      SUM(CASE WHEN rv.vote_value = -1 THEN 1 ELSE 0 END) as downvotes,
      AVG(rqm.quality_score) as avg_quality
    FROM response_votes rv
    JOIN response_quality_metrics rqm ON rqm.response_id = rv.response_id
    WHERE rv.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(rv.created_at)
    ORDER BY date DESC
  `);

  return NextResponse.json(trends.rows);
}
```

---

## 5. Background Jobs

### 5.1 Update Aggregate Metrics

```typescript
// lib/jobs/update-quality-metrics.ts

export async function updateQualityMetrics(responseId: string) {
  await query(`
    INSERT INTO response_quality_metrics (
      response_id,
      total_upvotes,
      total_downvotes,
      net_score,
      total_votes,
      quality_score,
      helpful_count,
      accurate_count,
      inaccurate_count,
      incomplete_count
    )
    SELECT
      $1,
      SUM(CASE WHEN vote_value = 1 THEN 1 ELSE 0 END),
      SUM(CASE WHEN vote_value = -1 THEN 1 ELSE 0 END),
      SUM(vote_value),
      COUNT(*),
      (SUM(CASE WHEN vote_value = 1 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100,
      SUM(CASE WHEN vote_reason = 'helpful' THEN 1 ELSE 0 END),
      SUM(CASE WHEN vote_reason = 'accurate' THEN 1 ELSE 0 END),
      SUM(CASE WHEN vote_reason = 'inaccurate' THEN 1 ELSE 0 END),
      SUM(CASE WHEN vote_reason = 'incomplete' THEN 1 ELSE 0 END)
    FROM response_votes
    WHERE response_id = $1
    ON CONFLICT (response_id) DO UPDATE SET
      total_upvotes = EXCLUDED.total_upvotes,
      total_downvotes = EXCLUDED.total_downvotes,
      net_score = EXCLUDED.net_score,
      total_votes = EXCLUDED.total_votes,
      quality_score = EXCLUDED.quality_score,
      helpful_count = EXCLUDED.helpful_count,
      accurate_count = EXCLUDED.accurate_count,
      inaccurate_count = EXCLUDED.inaccurate_count,
      incomplete_count = EXCLUDED.incomplete_count,
      last_updated = NOW()
  `, [responseId]);
}
```

### 5.2 Cache High-Quality Examples

```typescript
// Run daily to update RAG examples cache

export async function cacheHighQualityExamples() {
  // Find responses with high quality and sufficient votes
  const candidates = await query(`
    SELECT
      r.id as response_id,
      r.query_id,
      r.llm_provider as provider,
      r.response_text,
      q.query_text,
      q.workflow_id,
      m.quality_score,
      m.total_votes,
      m.net_score
    FROM llm_responses r
    JOIN queries q ON q.id = r.query_id
    JOIN response_quality_metrics m ON m.response_id = r.id
    WHERE m.quality_score >= 70
      AND m.total_votes >= 3
      AND m.net_score >= 2
      AND r.error IS NULL
      AND LENGTH(r.response_text) >= 100
    ORDER BY m.quality_score DESC, m.total_votes DESC
  `);

  for (const candidate of candidates.rows) {
    await query(`
      INSERT INTO rag_quality_examples (
        response_id, query_id, provider, query_text, response_text,
        quality_score, total_votes, net_score, workflow_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (response_id) DO UPDATE SET
        quality_score = EXCLUDED.quality_score,
        total_votes = EXCLUDED.total_votes,
        net_score = EXCLUDED.net_score
    `, [
      candidate.response_id,
      candidate.query_id,
      candidate.provider,
      candidate.query_text,
      candidate.response_text,
      candidate.quality_score,
      candidate.total_votes,
      candidate.net_score,
      candidate.workflow_id
    ]);
  }
}
```

### 5.3 Calculate Provider Performance

```typescript
// Run daily/weekly/monthly

export async function calculateProviderPerformance(
  periodType: 'daily' | 'weekly' | 'monthly',
  periodStart: Date,
  periodEnd: Date
) {
  const performance = await query(`
    SELECT
      r.llm_provider as provider_name,
      w.name as workflow_name,
      w.id as workflow_id,
      COUNT(DISTINCT r.id) as total_responses,
      COUNT(DISTINCT v.id) as total_votes,
      SUM(CASE WHEN v.vote_value = 1 THEN 1 ELSE 0 END) as total_upvotes,
      SUM(CASE WHEN v.vote_value = -1 THEN 1 ELSE 0 END) as total_downvotes,
      AVG(m.quality_score) as avg_quality_score,
      AVG(m.net_score) as avg_net_score,
      AVG(r.response_time_ms) as avg_response_time_ms,
      AVG(r.tokens_used) as avg_tokens_used
    FROM llm_responses r
    LEFT JOIN queries q ON q.id = r.query_id
    LEFT JOIN workflows w ON w.id = q.workflow_id
    LEFT JOIN response_votes v ON v.response_id = r.id
    LEFT JOIN response_quality_metrics m ON m.response_id = r.id
    WHERE r.created_at BETWEEN $1 AND $2
    GROUP BY r.llm_provider, w.name, w.id
  `, [periodStart, periodEnd]);

  // Calculate rankings
  const ranked = performance.rows
    .sort((a, b) => b.avg_quality_score - a.avg_quality_score)
    .map((row, index) => ({
      ...row,
      rank_by_quality: index + 1
    }));

  // Insert into provider_performance table
  for (const perf of ranked) {
    await query(`
      INSERT INTO provider_performance (
        provider_name, period_type, period_start, period_end, workflow_id,
        total_responses, total_votes, total_upvotes, total_downvotes,
        avg_quality_score, avg_net_score, rank_by_quality,
        avg_response_time_ms, avg_tokens_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (provider_name, period_type, period_start, query_category)
      DO UPDATE SET
        total_responses = EXCLUDED.total_responses,
        total_votes = EXCLUDED.total_votes,
        total_upvotes = EXCLUDED.total_upvotes,
        total_downvotes = EXCLUDED.total_downvotes,
        avg_quality_score = EXCLUDED.avg_quality_score,
        avg_net_score = EXCLUDED.avg_net_score,
        rank_by_quality = EXCLUDED.rank_by_quality,
        calculated_at = NOW()
    `, [
      perf.provider_name, periodType, periodStart, periodEnd, perf.workflow_id,
      perf.total_responses, perf.total_votes, perf.total_upvotes, perf.total_downvotes,
      perf.avg_quality_score, perf.avg_net_score, perf.rank_by_quality,
      perf.avg_response_time_ms, perf.avg_tokens_used
    ]);
  }
}
```

---

## 6. Implementation Phases

### Phase 1: MVP - Basic Voting (Week 1-2)
**Goal:** Get voting infrastructure in place

- [ ] Create database tables (response_votes, response_quality_metrics)
- [ ] Build vote API endpoints (POST/GET /api/responses/[id]/vote)
- [ ] Create VoteButtons component
- [ ] Add vote buttons to LLM response cards
- [ ] Display vote counts
- [ ] Allow vote changes
- [ ] Basic spam prevention (session tracking)

**Deliverables:**
- Users can upvote/downvote responses
- Vote counts visible on each response
- Data stored in database

### Phase 2: Feedback & Analytics (Week 3-4)
**Goal:** Capture why users vote and analyze data

- [ ] Add vote reasons (helpful, accurate, etc.)
- [ ] Create feedback modal for downvotes
- [ ] Build response_quality_metrics aggregate table
- [ ] Create provider_performance analytics table
- [ ] Build analytics dashboard component
- [ ] Add background job to update metrics
- [ ] Display quality indicators on responses

**Deliverables:**
- Users can explain their votes
- Admin dashboard showing provider performance
- Quality badges on high-rated responses

### Phase 3: RAG Integration (Week 5-6)
**Goal:** Use voting data to improve responses

- [ ] Create rag_quality_examples table
- [ ] Build quality example selector
- [ ] Integrate examples into LLM prompts
- [ ] Implement quality-weighted consensus
- [ ] Add response ranking by quality
- [ ] Build similar query matching
- [ ] Track example usage

**Deliverables:**
- High-quality past responses used as examples
- Consensus weighted by provider performance
- Responses ranked by quality
- "Similar queries found this helpful" feature

### Phase 4: Advanced Features (Week 7-8)
**Goal:** ML and optimization

- [ ] Implement Wilson score for better ranking
- [ ] Add query embeddings for semantic search
- [ ] Build A/B testing framework
- [ ] Create personalized provider recommendations
- [ ] Add quality prediction ML model
- [ ] Build automated response improvement suggestions
- [ ] Advanced analytics (cohort analysis, trends)

**Deliverables:**
- ML-enhanced quality scoring
- Personalized provider selection
- Automated quality improvements
- Advanced analytics dashboard

---

## 7. Success Metrics

### Short-term (1-3 months)
- **Participation Rate:** >30% of users vote on at least one response
- **Vote Volume:** Average 2+ votes per response
- **Quality Improvement:** 15% increase in avg quality score
- **User Satisfaction:** Positive feedback on voting feature

### Medium-term (3-6 months)
- **Response Quality:** 20% increase in responses rated 80+
- **Provider Performance:** Clear differentiation in provider scores
- **RAG Effectiveness:** 25% improvement in consensus rate when using quality examples
- **User Retention:** Users who vote have 30% higher retention

### Long-term (6-12 months)
- **Automated Quality:** ML model predicts quality with 85%+ accuracy
- **Personalization:** Personalized provider selection improves satisfaction by 40%
- **Community:** Active user base providing regular feedback
- **Knowledge Base:** 500+ high-quality examples for RAG

---

## 8. Privacy & Security Considerations

### Data Protection
- Allow anonymous voting (session-based)
- GDPR compliance: users can delete their votes
- No PII in vote data unless user opts in
- Rate limiting on vote endpoints (prevent spam)
- IP tracking for abuse detection only

### Abuse Prevention
- One vote per user/session per response
- Flag suspicious voting patterns (same IP, rapid votes)
- Cooldown period for changing votes (e.g., 5 minutes)
- Admin tools to remove fraudulent votes
- Shadow ban repeat offenders

### Transparency
- Show vote counts publicly
- Display quality methodology to users
- Allow users to export their voting history
- Public provider performance dashboard

---

## 9. Future Enhancements

### Advanced Voting
- Star ratings (1-5) instead of binary up/down
- Aspect-based voting (accuracy, clarity, completeness separately)
- Comment threads on responses
- Social features (follow expert users)

### ML Enhancements
- Automatic quality prediction without votes
- Response improvement suggestions ("This could be better if...")
- Identify factual errors automatically
- Generate follow-up questions based on feedback

### Integration
- Export to external analytics tools
- API for third-party quality tracking
- Slack/email notifications for low-quality responses
- Integration with LLM provider feedback loops

---

## 10. Recommended Tech Stack

### Frontend
- **Vote Buttons:** React component with optimistic updates
- **Icons:** Heroicons (thumbs up/down)
- **Animations:** Framer Motion for smooth transitions
- **State:** React Query for caching vote status

### Backend
- **Database:** PostgreSQL with above schema
- **API:** Next.js API routes
- **Cron Jobs:** Vercel Cron or node-cron
- **Caching:** Redis for hot vote counts

### Analytics
- **Visualization:** Recharts or Chart.js
- **Dashboard:** Custom Next.js page
- **Export:** CSV/Excel generation

### Optional
- **Embeddings:** OpenAI embeddings + pgvector for semantic search
- **ML:** Python scikit-learn for quality prediction
- **Monitoring:** Sentry for error tracking

---

## Next Steps

1. **Review & Approve** this design document
2. **Create database migration** (011_response_voting_system.sql)
3. **Build VoteButtons component** (MVP)
4. **Implement vote API endpoints**
5. **Test with small user group**
6. **Iterate based on feedback**
7. **Roll out phases 2-4**

Would you like me to start implementing Phase 1 (MVP) now?
