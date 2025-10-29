import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/competitors - List all competitors with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country');
    const threatLevel = searchParams.get('threat_level');
    const isActive = searchParams.get('is_active') !== 'false'; // Default true

    let sql = `
      SELECT
        c.*,
        COUNT(DISTINCT cu.id) as update_count,
        COUNT(DISTINCT ct.id) as trial_count,
        COUNT(DISTINCT cp.id) as publication_count,
        MAX(cu.published_date) as latest_update_date
      FROM competitors c
      LEFT JOIN competitor_updates cu ON cu.competitor_id = c.id
      LEFT JOIN competitor_trials ct ON ct.competitor_id = c.id
      LEFT JOIN competitor_publications cp ON cp.competitor_id = c.id
      WHERE c.is_active = $1
    `;

    const params: any[] = [isActive];
    let paramIndex = 2;

    if (country) {
      sql += ` AND c.headquarters_country = $${paramIndex}`;
      params.push(country);
      paramIndex++;
    }

    if (threatLevel) {
      sql += ` AND c.threat_level = $${paramIndex}`;
      params.push(threatLevel);
      paramIndex++;
    }

    sql += `
      GROUP BY c.id
      ORDER BY c.threat_level DESC, c.competitive_overlap_score DESC, c.name ASC
    `;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      competitors: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('GET /api/competitors error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/competitors - Create a new competitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      short_name,
      logo_url,
      website_url,
      headquarters_city,
      headquarters_state,
      headquarters_country,
      latitude,
      longitude,
      company_type,
      ticker_symbol,
      founded_year,
      employee_count,
      market_cap_usd,
      last_funding_round_usd,
      total_funding_usd,
      annual_revenue_usd,
      primary_focus,
      technology_platforms,
      pipeline_stage,
      threat_level,
      competitive_overlap_score,
      strategic_notes,
      created_by
    } = body;

    // Validation
    if (!name || !headquarters_country) {
      return NextResponse.json(
        { success: false, error: 'Name and headquarters_country are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO competitors (
        name, short_name, logo_url, website_url,
        headquarters_city, headquarters_state, headquarters_country, latitude, longitude,
        company_type, ticker_symbol, founded_year, employee_count,
        market_cap_usd, last_funding_round_usd, total_funding_usd, annual_revenue_usd,
        primary_focus, technology_platforms, pipeline_stage,
        threat_level, competitive_overlap_score, strategic_notes, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *`,
      [
        name, short_name, logo_url, website_url,
        headquarters_city, headquarters_state, headquarters_country, latitude, longitude,
        company_type, ticker_symbol, founded_year, employee_count,
        market_cap_usd, last_funding_round_usd, total_funding_usd, annual_revenue_usd,
        primary_focus, technology_platforms, pipeline_stage ? JSON.stringify(pipeline_stage) : null,
        threat_level || 'medium', competitive_overlap_score || 50, strategic_notes, created_by || 'system'
      ]
    );

    return NextResponse.json({
      success: true,
      competitor: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/competitors error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
