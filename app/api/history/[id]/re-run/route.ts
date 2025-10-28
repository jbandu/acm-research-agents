import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryAllLLMs } from '@/lib/llm-clients';
import { requireAuth } from '@/lib/session';

// POST /api/history/[id]/re-run - Re-execute an old query
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth();

    const { id: originalQueryId } = await params;

    // Get original query details
    const originalQueryResult = await query(
      `SELECT q.query_text, q.workflow_id, w.system_prompt
       FROM queries q
       LEFT JOIN workflows w ON w.id = q.workflow_id
       WHERE q.id = $1`,
      [originalQueryId]
    );

    if (originalQueryResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Original query not found' },
        { status: 404 }
      );
    }

    const originalQuery = originalQueryResult.rows[0];

    // Create new query record
    const newQueryResult = await query(
      `INSERT INTO queries (query_text, workflow_id, user_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        originalQuery.query_text,
        originalQuery.workflow_id,
        user.id,
        'processing',
      ]
    );

    const newQueryId = newQueryResult.rows[0].id;

    // If it's a workflow query, create execution record
    if (originalQuery.workflow_id) {
      await query(
        `INSERT INTO workflow_executions (workflow_id, query_id, status)
         VALUES ($1, $2, $3)`,
        [originalQuery.workflow_id, newQueryId, 'running']
      );
    }

    // Execute query with all LLMs
    const startTime = Date.now();
    const llmResponses = await queryAllLLMs({
      queryText: originalQuery.query_text,
      systemPrompt: originalQuery.system_prompt,
    });

    // Save all responses
    for (const response of llmResponses) {
      await query(
        `INSERT INTO llm_responses
         (query_id, llm_provider, model_name, response_text, confidence_score,
          sources, tokens_used, response_time_ms, error)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newQueryId,
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

    const executionTime = Math.floor((Date.now() - startTime) / 1000);

    // Update query status
    await query(
      'UPDATE queries SET status = $1 WHERE id = $2',
      ['completed', newQueryId]
    );

    // Update execution record if exists
    if (originalQuery.workflow_id) {
      await query(
        `UPDATE workflow_executions
         SET status = $1, execution_time_seconds = $2
         WHERE query_id = $3`,
        ['completed', executionTime, newQueryId]
      );
    }

    // Calculate and save consensus
    const successfulResponses = llmResponses.filter(r => !r.error);
    const confidenceScores = successfulResponses
      .map(r => r.confidenceScore)
      .filter((score): score is number => score !== undefined);

    let consensusLevel: 'high' | 'medium' | 'low' | 'none' = 'none';
    let agreeing_providers: string[] = [];
    let conflicting_providers: string[] = [];

    if (confidenceScores.length >= 2) {
      const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
      const variance = confidenceScores.reduce((sum, score) => sum + Math.pow(score - avgConfidence, 2), 0) / confidenceScores.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < 15) {
        consensusLevel = 'high';
        agreeing_providers = successfulResponses.map(r => r.provider);
      } else if (stdDev < 30) {
        consensusLevel = 'medium';
        agreeing_providers = successfulResponses.map(r => r.provider);
      } else {
        consensusLevel = 'low';
        conflicting_providers = successfulResponses
          .filter(r => r.confidenceScore && Math.abs(r.confidenceScore - avgConfidence) > stdDev)
          .map(r => r.provider);
        agreeing_providers = successfulResponses
          .filter(r => r.confidenceScore && Math.abs(r.confidenceScore - avgConfidence) <= stdDev)
          .map(r => r.provider);
      }
    }

    await query(
      `INSERT INTO consensus_results
       (query_id, consensus_level, agreeing_providers, conflicting_providers)
       VALUES ($1, $2, $3, $4)`,
      [newQueryId, consensusLevel, agreeing_providers, conflicting_providers]
    );

    return NextResponse.json({
      query_id: newQueryId,
      original_query_id: originalQueryId,
      status: 'completed',
      execution_time_seconds: executionTime,
      responses: llmResponses,
      consensus: {
        level: consensusLevel,
        agreeing_providers,
        conflicting_providers,
      },
    });
  } catch (error: any) {
    console.error('History re-run error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to re-run query' },
      { status: 500 }
    );
  }
}
