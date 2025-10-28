import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryAllLLMs } from '@/lib/llm-clients';
import { requireAuth } from '@/lib/session';

// POST /api/workflows/[id]/execute - Execute workflow with parameters
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth();

    const { id: workflowId } = await params;
    const body = await request.json();
    const { parameters, query_text } = body;

    if (!query_text) {
      return NextResponse.json(
        { error: 'Missing required field: query_text' },
        { status: 400 }
      );
    }

    // Get workflow template
    const workflowResult = await query(
      `SELECT id, name, system_prompt, prompt_template, required_parameters, use_count
       FROM workflows
       WHERE id = $1`,
      [workflowId]
    );

    if (workflowResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const workflow = workflowResult.rows[0];

    // Generate enriched prompt from template
    let enrichedPrompt = workflow.prompt_template || workflow.system_prompt;

    // Replace parameter placeholders
    if (parameters && typeof parameters === 'object') {
      Object.entries(parameters).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        enrichedPrompt = enrichedPrompt.replace(
          new RegExp(placeholder, 'g'),
          String(value)
        );
      });
    }

    // Replace {query} placeholder with actual query
    enrichedPrompt = enrichedPrompt.replace(/{query}/g, query_text);

    // Create query record
    const queryResult = await query(
      `INSERT INTO queries (query_text, workflow_id, user_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [query_text, workflowId, user.id, 'processing']
    );

    const queryId = queryResult.rows[0].id;

    // Create workflow execution record
    const executionResult = await query(
      `INSERT INTO workflow_executions (workflow_id, query_id, status)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [workflowId, queryId, 'running']
    );

    const executionId = executionResult.rows[0].id;

    // Increment workflow use count
    await query(
      'UPDATE workflows SET use_count = use_count + 1 WHERE id = $1',
      [workflowId]
    );

    // Execute query with all LLMs
    const startTime = Date.now();
    const llmResponses = await queryAllLLMs({
      queryText: query_text,
      systemPrompt: enrichedPrompt,
    });

    // Save all responses to database
    for (const response of llmResponses) {
      await query(
        `INSERT INTO llm_responses
         (query_id, llm_provider, model_name, response_text, confidence_score,
          sources, tokens_used, response_time_ms, error)
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

    const executionTime = Math.floor((Date.now() - startTime) / 1000);

    // Update query and execution status
    await query(
      'UPDATE queries SET status = $1 WHERE id = $2',
      ['completed', queryId]
    );

    await query(
      `UPDATE workflow_executions
       SET status = $1, execution_time_seconds = $2
       WHERE id = $3`,
      ['completed', executionTime, executionId]
    );

    // Calculate consensus
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

    // Save consensus result
    await query(
      `INSERT INTO consensus_results
       (query_id, consensus_level, agreeing_providers, conflicting_providers)
       VALUES ($1, $2, $3, $4)`,
      [queryId, consensusLevel, agreeing_providers, conflicting_providers]
    );

    return NextResponse.json({
      execution_id: executionId,
      query_id: queryId,
      workflow_id: workflowId,
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
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
