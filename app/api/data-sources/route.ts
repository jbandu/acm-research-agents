// API endpoint for data sources
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/data-sources - Get data source details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const category = searchParams.get('category');

    let sql = 'SELECT * FROM data_sources WHERE is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (ids) {
      const idArray = ids.split(',');
      sql += ` AND id = ANY($${paramIndex})`;
      params.push(idArray);
      paramIndex++;
    }

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    sql += ' ORDER BY display_order DESC, name';

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      sources: result.rows.map(s => ({
        ...s,
        cost_per_query: parseFloat(s.cost_per_query || 0),
        cost_per_article: parseFloat(s.cost_per_article || 0),
        monthly_subscription: parseFloat(s.monthly_subscription || 0)
      })),
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/data-sources - Create new data source (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      provider,
      access_type,
      mcp_server_available,
      mcp_server_name,
      api_endpoint,
      requires_api_key,
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
      display_order,
      metadata
    } = body;

    if (!name || !access_type || !pricing_model) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, access_type, pricing_model' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO data_sources (
        name, category, provider, access_type, mcp_server_available,
        mcp_server_name, api_endpoint, requires_api_key, pricing_model,
        cost_per_query, cost_per_article, monthly_subscription,
        query_rate_limit, rate_limit_unit, coverage_description,
        typical_result_count, avg_response_time_ms, data_freshness,
        display_order, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *
    `, [
      name, category, provider, access_type, mcp_server_available || false,
      mcp_server_name, api_endpoint, requires_api_key || false, pricing_model,
      cost_per_query || 0, cost_per_article || 0, monthly_subscription || 0,
      query_rate_limit, rate_limit_unit || 'hour', coverage_description,
      typical_result_count, avg_response_time_ms, data_freshness,
      display_order || 50, JSON.stringify(metadata || {})
    ]);

    return NextResponse.json({
      success: true,
      source: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating data source:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/data-sources - Update data source
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(id);

    const result = await query(`
      UPDATE data_sources
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating data source:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/data-sources?id=<uuid> - Delete (deactivate) data source
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Soft delete by marking as inactive
    const result = await query(`
      UPDATE data_sources
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data source deactivated successfully'
    });
  } catch (error: any) {
    console.error('Error deleting data source:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
