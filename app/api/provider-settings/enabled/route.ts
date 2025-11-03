import { NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * GET /api/provider-settings/enabled
 * Get only enabled providers (for query page)
 * Public endpoint - no auth required
 */
export async function GET() {
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

    const llmProviders = result.rows.filter(row => row.provider_type === 'llm');
    const searchSources = result.rows.filter(row => row.provider_type === 'search');

    return NextResponse.json({
      llmProviders,
      searchSources,
      count: {
        llms: llmProviders.length,
        searchSources: searchSources.length,
        total: result.rows.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching enabled providers:', error);

    // Fallback to default providers if database fails
    return NextResponse.json({
      llmProviders: [
        { provider_key: 'claude', provider_type: 'llm', display_name: 'Claude Sonnet 4.5', icon: '🧠' },
        { provider_key: 'openai', provider_type: 'llm', display_name: 'GPT-4o', icon: '🤖' },
        { provider_key: 'gemini', provider_type: 'llm', display_name: 'Gemini 2.0 Flash', icon: '✨' },
        { provider_key: 'grok', provider_type: 'llm', display_name: 'Grok 2', icon: '⚡' }
      ],
      searchSources: [
        { provider_key: 'google_patents', provider_type: 'search', display_name: 'Google Patents', icon: '📜' }
      ],
      count: { llms: 4, searchSources: 1, total: 5 },
      fallback: true
    });
  } finally {
    await client.end();
  }
}
