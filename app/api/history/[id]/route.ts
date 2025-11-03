import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/history/[id] - Get full query details with all responses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get query details
    const queryResult = await query(
      `SELECT
        q.id, q.workflow_id, q.query_text, q.user_id, q.status, q.created_at,
        w.name as workflow_name, w.category as workflow_category,
        w.icon as workflow_icon, w.description as workflow_description,
        cr.consensus_level, cr.agreement_summary, cr.conflicts,
        cr.agreeing_providers, cr.conflicting_providers,
        we.execution_time_seconds
       FROM queries q
       LEFT JOIN workflows w ON w.id = q.workflow_id
       LEFT JOIN consensus_results cr ON cr.query_id = q.id
       LEFT JOIN workflow_executions we ON we.query_id = q.id
       WHERE q.id = $1`,
      [id]
    );

    if (queryResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }

    const queryData = queryResult.rows[0];

    // Get all LLM responses
    const responsesResult = await query(
      `SELECT
        id, llm_provider, model_name, response_text, confidence_score,
        sources, tokens_used, response_time_ms, error, created_at
       FROM llm_responses
       WHERE query_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    // Get patent results
    const patentsResult = await query(
      `SELECT
        id, patent_number, title, abstract, filing_date, publication_date,
        assignee, inventors, url, relevance_score, created_at
       FROM patent_results
       WHERE query_id = $1
       ORDER BY relevance_score DESC NULLS LAST, created_at ASC
       LIMIT 10`,
      [id]
    );

    // Get AI summary
    const summaryResult = await query(
      `SELECT
        id, summary_text, models_analyzed, tokens_used, confidence_level,
        key_insights, created_at
       FROM ai_summaries
       WHERE query_id = $1`,
      [id]
    );

    // Get follow-up questions
    const followupResult = await query(
      `SELECT
        id, question_text, rationale, category, position, created_at
       FROM followup_questions
       WHERE query_id = $1
       ORDER BY position ASC`,
      [id]
    );

    // Get collections this query belongs to
    const collectionsResult = await query(
      `SELECT
        qc.id, qc.name, qc.description, qc.color
       FROM query_collections qc
       JOIN query_collection_items qci ON qci.collection_id = qc.id
       WHERE qci.query_id = $1`,
      [id]
    );

    return NextResponse.json({
      query: queryData,
      responses: responsesResult.rows,
      patents: patentsResult.rows,
      summary: summaryResult.rows.length > 0 ? summaryResult.rows[0] : null,
      followup_questions: followupResult.rows,
      collections: collectionsResult.rows,
    });
  } catch (error: any) {
    console.error('History detail GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch query details' },
      { status: 500 }
    );
  }
}

// DELETE /api/history/[id] - Delete query and all associated data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ON DELETE CASCADE will handle related records
    const result = await query(
      'DELETE FROM queries WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.rows[0].id,
    });
  } catch (error: any) {
    console.error('History DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete query' },
      { status: 500 }
    );
  }
}
