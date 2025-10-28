# ACM Context Management & Knowledge Graph System

## Overview

The ACM Research Agents platform now includes two powerful features:

1. **Context Loading with Prompt Caching** - Automatically provide ACM-specific context to LLMs with 90%+ cost reduction through prompt caching
2. **Knowledge Graph** - Interactive visualization of ACM Biolabs' research entities, relationships, and competitive landscape

---

## 🎯 Part 1: Context Loading with Prompt Caching

### What is Context Loading?

Context loading automatically provides LLMs with background information about ACM Biolabs, including:
- Company overview and technology platforms
- Leadership team and expertise
- Clinical trial results
- Research challenges
- Competitive landscape
- AI/ML adoption in biotech

### Three Context Levels

#### ⚡ **Minimal** (0 tokens)
- No additional context
- Just your query
- **Use for:** Simple questions that don't require company-specific knowledge
- **Cost:** Lowest
- **Speed:** Fastest

#### 🎯 **Standard** (Recommended, ~10K tokens, cached)
- Company overview
- Research challenges
- Leadership information
- **Use for:** Most queries (90% of use cases)
- **Cost:** ~90% cheaper after first query (thanks to prompt caching)
- **Speed:** Fast

#### 🧠 **Deep** (~200K tokens, cached)
- Everything in Standard, plus:
- Clinical trial details
- Competitive intelligence (TLR9 landscape)
- AI/ML adoption by competitors
- **Use for:** Critical research requiring comprehensive context
- **Cost:** Higher initial cost, but 90%+ savings on subsequent queries
- **Speed:** Moderate

### How Context Levels Work with Prompt Caching

**First Query (Cache Miss):**
```
Standard Context: ~10,000 tokens × $3/M tokens = $0.03
```

**Subsequent Queries (Cache Hit):**
```
Standard Context: ~10,000 tokens × $0.30/M tokens = $0.003
→ 90% cost reduction!
```

**Cache Duration:** 5 minutes (Anthropic), then regenerated

---

## 📊 Knowledge Graph (Ontology)

### Accessing the Knowledge Graph

Navigate to **Knowledge Graph** in the main navigation menu to view an interactive visualization of ACM Biolabs' research ecosystem.

### Graph Structure

The knowledge graph consists of:

#### **Domains** (Color-coded categories)
- 👥 **Leadership** (Blue) - Executive team and key personnel
- 🔬 **Technology Platforms** (Purple) - Core R&D platforms
- 🧪 **Clinical Programs** (Green) - Active clinical trials
- ⚠️ **Research Challenges** (Amber) - Current technical obstacles
- 🎯 **Competitive Landscape** (Red) - Market competitors
- 🤝 **Strategic Partnerships** (Cyan) - Collaborations

#### **Node Types**
- `person` - Team members (e.g., Dr. Madhavan Nallani)
- `technology` - Platforms (e.g., BNP, ACM-CpG)
- `trial` - Clinical studies (e.g., ACM-CpG Phase 1/2)
- `challenge` - Technical problems (e.g., mRNA Stability)
- `competitor` - Other companies (e.g., Checkmate Pharma)
- `partnership` - Collaborations

#### **Relationship Types**
- `founded` - Created/pioneered
- `enables` - Technology dependencies
- `tested_in` - Clinical trial relationships
- `blocks_commercialization` - Barriers to market
- `competes_with` - Competitive relationships
- `addresses` - Problem-solving efforts

### Graph Features

**Interactive Navigation:**
- Click and drag to pan
- Scroll to zoom
- Click nodes to view detailed information

**Domain Filtering:**
- Filter by specific domains (Leadership, Technology, etc.)
- View statistics per domain

**Visual Encoding:**
- **Line thickness** = Relationship strength
- **Animated edges** = High-strength relationships (>70%)
- **Node colors** = Domain categories

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

The system includes a secure API endpoint to run migrations:

```bash
# Check migration status
curl http://localhost:3000/api/admin/migrate

# Run migration (requires ADMIN_SECRET)
curl -X POST http://localhost:3000/api/admin/migrate \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

**Set ADMIN_SECRET in your environment variables:**
```bash
ADMIN_SECRET=your-secure-secret-here
```

### Step 2: Verify Tables

After migration, verify tables exist:

```sql
-- Should show 6 new tables:
-- acm_knowledge_base
-- workflow_context_strategies
-- query_context_usage
-- acm_domains
-- acm_nodes
-- acm_relationships

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'acm_%';
```

### Step 3: Seed Data

The migration automatically seeds:
- ✅ 6 knowledge base entries (company info, challenges, leadership)
- ✅ 6 domains (Leadership, Technology, Clinical, Challenges, Competitive, Partnerships)
- ✅ 10+ nodes (Madhavan, BNP, ACM-CpG, trials, challenges, competitors)
- ✅ 10+ relationships (connections between entities)

---

## 💻 Usage Guide

### Using Context Levels in Workflows

**Option 1: Set Default Context Level for a Workflow**

When creating/editing a workflow template, you can specify a default context level:

```typescript
// Via API
POST /api/workflows
{
  "name": "Clinical Trial Analysis",
  "system_prompt": "Analyze clinical trial data...",
  "context_level": "deep"  // ← Set default here
}
```

**Option 2: Override Context Level per Query**

When executing a workflow, override the context level:

```typescript
// Via API
POST /api/workflows/{workflowId}/execute
{
  "query_text": "What are the latest ACM-CpG trial results?",
  "contextLevel": "deep"  // ← Override here
}
```

**Option 3: Use the UI Context Selector** (Coming Soon)

The `ContextLevelSelector` component can be integrated into the query form:

```tsx
import { ContextLevelSelector } from '@/components/ContextLevelSelector';

<ContextLevelSelector
  selectedLevel={contextLevel}
  onChange={setContextLevel}
  showPreview={true}
/>
```

### Managing Knowledge Base Entries

**Add New Entry:**
```bash
POST /api/knowledge-base
{
  "category": "research",
  "subcategory": "publications",
  "title": "Key BNP Stability Paper",
  "content": "Published in Nature Biotech...",
  "importance_score": 85,
  "metadata": {
    "pmid": "12345678",
    "year": 2024
  }
}
```

**Update Entry:**
```bash
PUT /api/knowledge-base
{
  "id": "uuid-here",
  "content": "Updated information...",
  "importance_score": 90
}
```

**Delete Entry:**
```bash
DELETE /api/knowledge-base?id=uuid-here
```

### Managing Knowledge Graph

**Add Node:**
```bash
POST /api/ontology/nodes
{
  "domain_id": "leadership-domain-id",
  "node_type": "person",
  "name": "Dr. Jane Smith",
  "description": "VP of Clinical Development",
  "metadata": {
    "title": "VP Clinical",
    "expertise": ["oncology", "immunotherapy"]
  },
  "position_x": 100,
  "position_y": 200
}
```

**Add Relationship:**
```bash
POST /api/ontology/relationships
{
  "source_node_id": "dr-smith-id",
  "target_node_id": "acm-cpg-id",
  "relationship_type": "leads_development",
  "strength": 95,
  "description": "Oversees clinical trials"
}
```

**Update Node Position** (after dragging in UI):
```bash
PUT /api/ontology/nodes
{
  "id": "node-id",
  "position_x": 350,
  "position_y": 450
}
```

---

## 📈 Analytics & Cost Tracking

### View Context Usage Statistics

```bash
GET /api/context/stats
```

**Response:**
```json
{
  "totalQueries": 1250,
  "cacheHitRate": 92.3,
  "tokensSaved": 11500000,
  "byProvider": {
    "anthropic": {
      "queries": 400,
      "cacheHits": 380,
      "cacheReadTokens": 3800000
    }
  },
  "byContextLevel": {
    "standard": {
      "queries": 1000,
      "cacheHits": 920
    },
    "deep": {
      "queries": 200,
      "cacheHits": 180
    }
  }
}
```

### Cost Savings Calculation

**Example Scenario: 1000 queries/day with Standard context**

**Without Caching:**
```
1000 queries × 10,000 tokens × $3/M = $30/day = $900/month
```

**With Caching (92% hit rate):**
```
First query:   80 queries × 10,000 tokens × $3/M = $2.40
Cached queries: 920 queries × 10,000 tokens × $0.30/M = $2.76
Total: $5.16/day = $155/month

Savings: $745/month (82% reduction!)
```

---

## 🎨 UI Components

### ContextLevelSelector

Display context level options with preview:

```tsx
import { ContextLevelSelector } from '@/components/ContextLevelSelector';

<ContextLevelSelector
  selectedLevel="standard"
  onChange={(level) => setContextLevel(level)}
  showPreview={true}
/>
```

### ContextLevelBadge

Display current context level in compact form:

```tsx
import { ContextLevelBadge } from '@/components/ContextLevelSelector';

<ContextLevelBadge level="deep" />
// Renders: 🧠 Deep Context
```

### ACMKnowledgeGraph

Full-screen knowledge graph visualization:

```tsx
import { ACMKnowledgeGraph } from '@/components/ACMKnowledgeGraph';

<ACMKnowledgeGraph />
```

---

## 🔧 Technical Details

### Database Schema

**Knowledge Base:**
- `acm_knowledge_base` - Content entries with categories and importance scores
- `workflow_context_strategies` - Default context levels per workflow
- `query_context_usage` - Usage tracking for analytics

**Ontology:**
- `acm_domains` - Top-level categories (Leadership, Technology, etc.)
- `acm_nodes` - Entities (people, technologies, trials, etc.)
- `acm_relationships` - Connections between entities

### API Endpoints

**Context Management:**
- `GET /api/knowledge-base` - List entries
- `POST /api/knowledge-base` - Create entry
- `PUT /api/knowledge-base` - Update entry
- `DELETE /api/knowledge-base?id=<uuid>` - Delete entry
- `GET /api/context/preview?level=<level>` - Preview context

**Ontology Management:**
- `GET /api/ontology` - Get full graph
- `POST /api/ontology/nodes` - Create node
- `PUT /api/ontology/nodes` - Update node
- `DELETE /api/ontology/nodes?id=<uuid>` - Delete node
- `POST /api/ontology/relationships` - Create relationship
- `PUT /api/ontology/relationships` - Update relationship
- `DELETE /api/ontology/relationships?id=<uuid>` - Delete relationship

**Admin:**
- `GET /api/admin/migrate` - Check migration status
- `POST /api/admin/migrate` - Run migration (requires auth)

---

## 🌟 Best Practices

### Context Loading

1. **Use Standard by default** - It covers 90% of use cases
2. **Use Deep for strategic queries** - Competitive analysis, clinical planning
3. **Use Minimal for simple questions** - "What does ACM stand for?"
4. **Set workflow defaults** - Configure once per workflow type
5. **Monitor cache hit rates** - Aim for >85% cache hits

### Knowledge Graph

1. **Keep descriptions concise** - 2-3 sentences max
2. **Use metadata for structured data** - Dates, IDs, URLs
3. **Set appropriate relationship strengths** - Critical connections = 80-100
4. **Update regularly** - Add new trials, partnerships, team members
5. **Use consistent node types** - Stick to predefined types

### Knowledge Base

1. **Prioritize by importance** - Score 90-100 for critical info
2. **Use clear categories** - company, research, people, competitive
3. **Update regularly** - Keep trial data current
4. **Include sources** - Add PMID, NCT numbers to metadata
5. **Test context impact** - Run sample queries to verify relevance

---

## 🐛 Troubleshooting

### Migration Issues

**Problem:** Migration fails with "table already exists"
```bash
# This is normal if tables exist
# Check status instead:
GET /api/admin/migrate
```

**Problem:** No data after migration
```bash
# Check seeded counts:
SELECT COUNT(*) FROM acm_knowledge_base;
SELECT COUNT(*) FROM acm_nodes;

# Should return 6+ and 10+ respectively
```

### Context Loading Issues

**Problem:** Context not appearing in LLM responses
```bash
# Check context strategy:
SELECT * FROM workflow_context_strategies
WHERE workflow_template_id = 'your-workflow-id';

# Verify knowledge base has entries:
SELECT COUNT(*) FROM acm_knowledge_base;
```

**Problem:** High costs despite caching
```bash
# Check cache hit rate:
SELECT
  provider,
  COUNT(*) as total,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as hits
FROM query_context_usage
GROUP BY provider;

# Should show >80% hit rate
```

### Knowledge Graph Issues

**Problem:** Graph not loading
- Check browser console for API errors
- Verify migration ran successfully
- Check that acm_nodes and acm_relationships tables have data

**Problem:** Nodes overlapping
- Manually drag nodes to reposition
- Update positions via API
- Use hierarchical layout mode

---

## 📚 Further Reading

- [Anthropic Prompt Caching Documentation](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [ReactFlow Documentation](https://reactflow.dev/learn)
- [ACM Biolabs Company Information](https://acmbiolabs.com)

---

## 🎉 Summary

You now have:

✅ **Context Loading System** with 3 levels (Minimal, Standard, Deep)
✅ **Prompt Caching** for 90%+ cost reduction
✅ **Knowledge Graph** with interactive visualization
✅ **Analytics Dashboard** for usage tracking
✅ **API Endpoints** for programmatic access
✅ **UI Components** ready to use

**Next Steps:**
1. Run the migration (`POST /api/admin/migrate`)
2. Visit the Knowledge Graph page (`/ontology`)
3. Execute a workflow with context loading
4. Monitor cache hit rates and cost savings
5. Add your own knowledge base entries

**Questions?** Review this documentation or check the API responses for detailed error messages.
