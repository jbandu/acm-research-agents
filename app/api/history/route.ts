import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/history - List queries with filters, search, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Filters
    const workflows = searchParams.get('workflows')?.split(',').filter(Boolean);
    const categories = searchParams.get('categories')?.split(',').filter(Boolean);
    const consensusLevels = searchParams.get('consensusLevels')?.split(',').filter(Boolean);
    const llmProviders = searchParams.get('llmProviders')?.split(',').filter(Boolean);
    const status = searchParams.get('status')?.split(',').filter(Boolean);
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build dynamic query
    let queryText = `
      SELECT
        q.id, q.workflow_id, q.query_text, q.created_by, q.status, q.created_at,
        w.name as workflow_name, w.category as workflow_category, w.icon as workflow_icon,
        cr.consensus_level, cr.agreeing_providers, cr.conflicting_providers,
        we.execution_time_seconds,
        (
          SELECT COUNT(*)
          FROM llm_responses lr
          WHERE lr.query_id = q.id
        ) as response_count
      FROM queries q
      LEFT JOIN workflows w ON w.id = q.workflow_id
      LEFT JOIN consensus_results cr ON cr.query_id = q.id
      LEFT JOIN workflow_executions we ON we.query_id = q.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (workflows && workflows.length > 0) {
      queryText += ` AND q.workflow_id = ANY($${paramIndex}::uuid[])`;
      params.push(workflows);
      paramIndex++;
    }

    if (categories && categories.length > 0) {
      queryText += ` AND w.category = ANY($${paramIndex}::text[])`;
      params.push(categories);
      paramIndex++;
    }

    if (consensusLevels && consensusLevels.length > 0) {
      queryText += ` AND cr.consensus_level = ANY($${paramIndex}::text[])`;
      params.push(consensusLevels);
      paramIndex++;
    }

    if (status && status.length > 0) {
      queryText += ` AND q.status = ANY($${paramIndex}::text[])`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND q.query_text ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (dateFrom) {
      queryText += ` AND q.created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      queryText += ` AND q.created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    // Count total matching records
    const countQuery = queryText.replace(
      /SELECT[\s\S]*?FROM queries/,
      'SELECT COUNT(DISTINCT q.id) as total FROM queries'
    );
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Add sorting and pagination
    queryText += ` ORDER BY q.${sortBy} ${sortOrder.toUpperCase()}`;
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // For queries with LLM providers filter, we need to check responses
    let queries = result.rows;
    if (llmProviders && llmProviders.length > 0) {
      queries = await Promise.all(
        queries.map(async (q) => {
          const responsesResult = await query(
            `SELECT DISTINCT llm_provider
             FROM llm_responses
             WHERE query_id = $1 AND llm_provider = ANY($2)`,
            [q.id, llmProviders]
          );
          return responsesResult.rows.length > 0 ? q : null;
        })
      );
      queries = queries.filter(Boolean);
    }

    return NextResponse.json({
      queries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('History GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
