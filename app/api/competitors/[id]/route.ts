import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/competitors/[id] - Get specific competitor with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get competitor details
    const competitorResult = await query(
      'SELECT * FROM competitors WHERE id = $1',
      [id]
    );

    if (competitorResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Competitor not found' },
        { status: 404 }
      );
    }

    const competitor = competitorResult.rows[0];

    // Get related updates
    const updatesResult = await query(
      `SELECT * FROM competitor_updates
       WHERE competitor_id = $1
       ORDER BY published_date DESC NULLS LAST, created_at DESC
       LIMIT 50`,
      [id]
    );

    // Get related trials
    const trialsResult = await query(
      `SELECT * FROM competitor_trials
       WHERE competitor_id = $1
       ORDER BY relevance_score DESC, start_date DESC NULLS LAST
       LIMIT 50`,
      [id]
    );

    // Get related publications
    const publicationsResult = await query(
      `SELECT * FROM competitor_publications
       WHERE competitor_id = $1
       ORDER BY publication_date DESC NULLS LAST, relevance_score DESC
       LIMIT 50`,
      [id]
    );

    return NextResponse.json({
      success: true,
      competitor: {
        ...competitor,
        updates: updatesResult.rows,
        trials: trialsResult.rows,
        publications: publicationsResult.rows
      }
    });
  } catch (error: any) {
    console.error('GET /api/competitors/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/competitors/[id] - Update a competitor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Build dynamic UPDATE query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'short_name', 'logo_url', 'website_url',
      'headquarters_city', 'headquarters_state', 'headquarters_country',
      'latitude', 'longitude', 'company_type', 'ticker_symbol',
      'founded_year', 'employee_count', 'market_cap_usd',
      'last_funding_round_usd', 'total_funding_usd', 'annual_revenue_usd',
      'primary_focus', 'technology_platforms', 'pipeline_stage',
      'threat_level', 'competitive_overlap_score', 'strategic_notes',
      'ai_summary', 'ai_strengths', 'ai_weaknesses', 'ai_opportunities',
      'ai_threats', 'last_ai_research_date', 'research_data', 'is_active'
    ];

    for (const field of allowedFields) {
      if (body.hasOwnProperty(field)) {
        updateFields.push(`${field} = $${paramIndex}`);

        // Handle JSONB fields
        if (field === 'pipeline_stage' || field === 'research_data') {
          values.push(JSON.stringify(body[field]));
        } else {
          values.push(body[field]);
        }

        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id); // Add ID as last parameter

    const sql = `
      UPDATE competitors
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Competitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      competitor: result.rows[0]
    });
  } catch (error: any) {
    console.error('PUT /api/competitors/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/competitors/[id] - Delete a competitor (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Soft delete by setting is_active to false
    const result = await query(
      `UPDATE competitors SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Competitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Competitor ${result.rows[0].name} deactivated successfully`
    });
  } catch (error: any) {
    console.error('DELETE /api/competitors/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
