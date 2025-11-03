import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * GET /api/admin/provider-settings
 * Get all provider settings (LLMs and search sources)
 */
export async function GET(request: NextRequest) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    // Get all provider settings ordered by type and display_order
    const result = await client.query(`
      SELECT
        id,
        provider_key,
        provider_type,
        display_name,
        description,
        enabled,
        display_order,
        icon,
        config,
        created_at,
        updated_at
      FROM provider_settings
      ORDER BY provider_type, display_order
    `);

    // Group by provider type
    const llmProviders = result.rows.filter(row => row.provider_type === 'llm');
    const searchSources = result.rows.filter(row => row.provider_type === 'search');

    return NextResponse.json({
      llmProviders,
      searchSources,
      total: result.rows.length,
      enabledLlms: llmProviders.filter(p => p.enabled).length,
      enabledSearchSources: searchSources.filter(p => p.enabled).length
    });

  } catch (error: any) {
    console.error('Error fetching provider settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider settings', details: error.message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

/**
 * PUT /api/admin/provider-settings
 * Update provider settings (enable/disable, reorder)
 * Requires ADMIN_SECRET header for authorization
 */
export async function PUT(request: NextRequest) {
  // Check admin authorization
  const adminSecret = request.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    const body = await request.json();
    const { updates } = body; // Array of { provider_key, enabled, display_order }

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request. Expected array of updates.' },
        { status: 400 }
      );
    }

    await client.connect();

    // Update each provider
    const updatePromises = updates.map(async (update: any) => {
      const { provider_key, enabled, display_order } = update;

      return client.query(
        `UPDATE provider_settings
         SET enabled = $1,
             display_order = COALESCE($2, display_order),
             updated_at = NOW()
         WHERE provider_key = $3
         RETURNING *`,
        [enabled, display_order, provider_key]
      );
    });

    const results = await Promise.all(updatePromises);
    const updatedProviders = results.map(r => r.rows[0]);

    return NextResponse.json({
      success: true,
      updated: updatedProviders.length,
      providers: updatedProviders
    });

  } catch (error: any) {
    console.error('Error updating provider settings:', error);
    return NextResponse.json(
      { error: 'Failed to update provider settings', details: error.message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

/**
 * GET /api/admin/provider-settings/enabled
 * Get only enabled providers (for query page)
 * Public endpoint - no auth required
 */
export async function enabled() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT
        provider_key,
        provider_type,
        display_name,
        description,
        icon,
        config
      FROM provider_settings
      WHERE enabled = true
      ORDER BY provider_type, display_order
    `);

    return NextResponse.json({
      providers: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching enabled providers:', error);
    // Fallback to default providers if database fails
    return NextResponse.json({
      providers: [
        { provider_key: 'claude', provider_type: 'llm', display_name: 'Claude Sonnet 4.5' },
        { provider_key: 'openai', provider_type: 'llm', display_name: 'GPT-4o' },
        { provider_key: 'gemini', provider_type: 'llm', display_name: 'Gemini 2.0 Flash' },
        { provider_key: 'grok', provider_type: 'llm', display_name: 'Grok 2' },
        { provider_key: 'google_patents', provider_type: 'search', display_name: 'Google Patents' }
      ]
    });
  } finally {
    await client.end();
  }
}
