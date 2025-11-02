import { NextRequest, NextResponse } from 'next/server';
import { queryAllLLMs, LLMResponse } from '@/lib/llm-clients';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { searchGooglePatents, createPatentContext, PatentResult } from '@/lib/google-patents';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    const body = await request.json();
    const { query_text, workflow_id, system_prompt } = body;

    if (!query_text) {
      return NextResponse.json(
        { error: 'Missing required field: query_text' },
        { status: 400 }
      );
    }

    // Check for cached results (same query in last 24 hours)
    const cacheCheck = await query(
      `SELECT q.id, q.query_text, q.created_at,
              json_agg(json_build_object(
                'provider', lr.llm_provider,
                'model', lr.model_name,
                'responseText', lr.response_text,
                'confidenceScore', lr.confidence_score,
                'sources', lr.sources,
                'tokensUsed', lr.tokens_used,
                'responseTimeMs', lr.response_time_ms
              )) as responses
       FROM queries q
       LEFT JOIN llm_responses lr ON lr.query_id = q.id
       WHERE q.query_text = $1
       AND q.created_at > NOW() - INTERVAL '24 hours'
       AND q.status = 'completed'
       GROUP BY q.id, q.query_text, q.created_at
       ORDER BY q.created_at DESC
       LIMIT 1`,
      [query_text]
    );

    if (cacheCheck.rows.length > 0) {
      const cached = cacheCheck.rows[0];
      return NextResponse.json({
        cached: true,
        query_id: cached.id,
        query_text: cached.query_text,
        responses: cached.responses,
        cached_at: cached.created_at,
      });
    }

    // Create query record
    const queryResult = await query(
      'INSERT INTO queries (query_text, workflow_id, user_id, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [query_text, workflow_id, user.id, 'processing']
    );

    const queryId = queryResult.rows[0].id;

    // Get system prompt from workflow if not provided
    let systemPromptToUse = system_prompt;
    if (!systemPromptToUse && workflow_id) {
      const workflowResult = await query(
        'SELECT system_prompt FROM workflows WHERE id = $1',
        [workflow_id]
      );
      if (workflowResult.rows.length > 0) {
        systemPromptToUse = workflowResult.rows[0].system_prompt;
      }
    }

    // Search Google Patents FIRST (before LLMs)
    console.log('Searching Google Patents...');
    const patentResults: PatentResult[] = await searchGooglePatents(query_text, 10);
    console.log(`Found ${patentResults.length} patents`);

    // Save patent search to database (gracefully handle missing tables)
    let patentSearchId: string | null = null;
    if (patentResults.length > 0) {
      try {
        const patentSearchResult = await query(
          'INSERT INTO patent_searches (query_id, search_query, results_count) VALUES ($1, $2, $3) RETURNING id',
          [queryId, query_text, patentResults.length]
        );
        patentSearchId = patentSearchResult.rows[0].id;

        // Save individual patent results
        for (const patent of patentResults) {
          await query(
            `INSERT INTO patent_results
             (search_id, patent_number, title, assignee, publication_date, url, snippet, pdf_url, relevance_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (search_id, patent_number) DO NOTHING`,
            [
              patentSearchId,
              patent.patentNumber,
              patent.title,
              patent.assignee,
              patent.publicationDate,
              patent.url,
              patent.snippet,
              patent.pdfUrl || null,
              patent.relevanceScore || 0
            ]
          );
        }
      } catch (patentDbError: any) {
        // If patent tables don't exist yet, just log warning and continue
        console.warn('Patent tables not available (run migration 008):', patentDbError.message);
        // Patents will still be returned in API response, just not saved to DB
      }
    }

    // Create patent context for LLM prompts
    const patentContext = createPatentContext(patentResults);
    const enhancedQueryText = patentContext ? query_text + patentContext : query_text;

    // Query all LLMs in parallel (with patent context)
    const llmResponses = await queryAllLLMs({
      queryText: enhancedQueryText,
      systemPrompt: systemPromptToUse,
    });

    // Save all responses to database
    for (const response of llmResponses) {
      await query(
        `INSERT INTO llm_responses 
         (query_id, llm_provider, model_name, response_text, confidence_score, sources, tokens_used, response_time_ms, error) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          queryId,
          response.provider,
          response.model,
          response.responseText,
          response.confidenceScore || null,
          JSON.stringify(response.sources || []),
          response.tokensUsed || null,
          response.responseTimeMs,
          response.error || null,
        ]
      );
    }

    // Update query status
    await query(
      'UPDATE queries SET status = $1 WHERE id = $2',
      ['completed', queryId]
    );

    // Calculate consensus
    const consensus = calculateConsensus(llmResponses);

    return NextResponse.json({
      cached: false,
      query_id: queryId,
      query_text,
      responses: llmResponses,
      consensus,
      patents: patentResults, // Include patent results
      patent_count: patentResults.length,
    });
  } catch (error: any) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateConsensus(responses: LLMResponse[]): {
  hasConsensus: boolean;
  consensusLevel: 'high' | 'medium' | 'low';
  conflictingProviders: string[];
} {
  const successfulResponses = responses.filter(r => !r.error && r.responseText);
  
  if (successfulResponses.length < 2) {
    return {
      hasConsensus: false,
      consensusLevel: 'low',
      conflictingProviders: [],
    };
  }

  // Simple heuristic: check if confidence scores are similar
  const confidenceScores = successfulResponses
    .map(r => r.confidenceScore)
    .filter((score): score is number => score !== undefined);

  if (confidenceScores.length < 2) {
    return {
      hasConsensus: false,
      consensusLevel: 'medium',
      conflictingProviders: [],
    };
  }

  const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
  const variance = confidenceScores.reduce((sum, score) => sum + Math.pow(score - avgConfidence, 2), 0) / confidenceScores.length;
  const stdDev = Math.sqrt(variance);

  // High consensus: all LLMs agree within 15 points
  if (stdDev < 15) {
    return {
      hasConsensus: true,
      consensusLevel: 'high',
      conflictingProviders: [],
    };
  }

  // Medium consensus: reasonable agreement
  if (stdDev < 30) {
    return {
      hasConsensus: true,
      consensusLevel: 'medium',
      conflictingProviders: [],
    };
  }

  // Low consensus: significant disagreement
  const outliers = successfulResponses
    .filter(r => r.confidenceScore && Math.abs(r.confidenceScore - avgConfidence) > stdDev)
    .map(r => r.provider);

  return {
    hasConsensus: false,
    consensusLevel: 'low',
    conflictingProviders: outliers,
  };
}
