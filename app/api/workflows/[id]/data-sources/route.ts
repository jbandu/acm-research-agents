// API endpoint to get available data sources for a workflow
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/workflows/[id]/data-sources - Get available data sources for a workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;

    // Get data sources linked to this workflow
    const result = await query(`
      SELECT
        ds.id,
        ds.name,
        ds.category,
        ds.provider,
        ds.access_type,
        ds.mcp_server_available,
        ds.mcp_server_name,
        ds.pricing_model,
        ds.cost_per_query,
        ds.cost_per_article,
        ds.monthly_subscription,
        ds.query_rate_limit,
        ds.rate_limit_unit,
        ds.coverage_description,
        ds.typical_result_count,
        ds.avg_response_time_ms,
        ds.data_freshness,
        wds.is_default,
        wds.is_recommended,
        wds.priority
      FROM data_sources ds
      LEFT JOIN workflow_data_sources wds
        ON ds.id = wds.data_source_id AND wds.workflow_template_id = $1
      WHERE ds.is_active = true
        AND (wds.workflow_template_id = $1 OR wds.workflow_template_id IS NULL)
      ORDER BY
        wds.priority DESC NULLS LAST,
        ds.display_order DESC,
        ds.name
    `, [workflowId]);

    // If no workflow-specific sources, return all sources
    let sources = result.rows;

    if (sources.length === 0) {
      const allSources = await query(`
        SELECT
          id,
          name,
          category,
          provider,
          access_type,
          mcp_server_available,
          mcp_server_name,
          pricing_model,
          cost_per_query,
          cost_per_article,
          monthly_subscription,
          query_rate_limit,
          rate_limit_unit,
          coverage_description,
          typical_result_count,
          avg_response_time_ms,
          data_freshness,
          false as is_default,
          CASE WHEN access_type = 'free' THEN true ELSE false END as is_recommended,
          50 as priority
        FROM data_sources
        WHERE is_active = true
        ORDER BY display_order DESC, name
      `);
      sources = allSources.rows;
    }

    return NextResponse.json({
      success: true,
      sources: sources.map(s => ({
        ...s,
        cost_per_query: parseFloat(s.cost_per_query || 0),
        cost_per_article: parseFloat(s.cost_per_article || 0),
        monthly_subscription: parseFloat(s.monthly_subscription || 0)
      }))
    });
  } catch (error: any) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/workflows/[id]/data-sources - Link data sources to workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const body = await request.json();
    const { data_source_ids, is_default, is_recommended } = body;

    if (!Array.isArray(data_source_ids) || data_source_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'data_source_ids array is required' },
        { status: 400 }
      );
    }

    // Remove existing links
    await query(`
      DELETE FROM workflow_data_sources
      WHERE workflow_template_id = $1
    `, [workflowId]);

    // Add new links
    for (const sourceId of data_source_ids) {
      await query(`
        INSERT INTO workflow_data_sources (
          workflow_template_id,
          data_source_id,
          is_default,
          is_recommended,
          priority
        ) VALUES ($1, $2, $3, $4, 50)
        ON CONFLICT (workflow_template_id, data_source_id)
        DO UPDATE SET
          is_default = EXCLUDED.is_default,
          is_recommended = EXCLUDED.is_recommended
      `, [workflowId, sourceId, is_default || false, is_recommended || false]);
    }

    return NextResponse.json({
      success: true,
      message: `Linked ${data_source_ids.length} data sources to workflow`
    });
  } catch (error: any) {
    console.error('Error linking data sources:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
