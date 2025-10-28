// Admin API endpoint to run database migrations
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    // Basic auth check - you might want to add proper authentication
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.ADMIN_SECRET || 'change-me-in-production'}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pool = getPool();

    console.log('🔄 Running ACM Context and Ontology migration...');

    // Read the migration file
    const migrationPath = join(process.cwd(), 'db', 'migrations', '003_acm_context_and_ontology.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'ACM Context and Ontology migration completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Migration error:', error);

    // Check if tables already exist
    if (error.message && error.message.includes('already exists')) {
      return NextResponse.json({
        success: true,
        message: 'Tables already exist - migration not needed',
        warning: error.message
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.detail || 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check migration status
export async function GET(request: NextRequest) {
  try {
    const pool = getPool();

    // Check if the new tables exist
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'acm_knowledge_base',
          'workflow_context_strategies',
          'query_context_usage',
          'acm_domains',
          'acm_nodes',
          'acm_relationships'
        )
      ORDER BY table_name
    `);

    const existingTables = result.rows.map(row => row.table_name);
    const requiredTables = [
      'acm_knowledge_base',
      'workflow_context_strategies',
      'query_context_usage',
      'acm_domains',
      'acm_nodes',
      'acm_relationships'
    ];

    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    // Check if data is seeded
    let dataCounts: Record<string, number> = {};
    if (missingTables.length === 0) {
      const kbCount = await pool.query('SELECT COUNT(*) FROM acm_knowledge_base');
      const domainsCount = await pool.query('SELECT COUNT(*) FROM acm_domains');
      const nodesCount = await pool.query('SELECT COUNT(*) FROM acm_nodes');
      const relsCount = await pool.query('SELECT COUNT(*) FROM acm_relationships');

      dataCounts = {
        knowledge_base_entries: parseInt(kbCount.rows[0].count),
        domains: parseInt(domainsCount.rows[0].count),
        nodes: parseInt(nodesCount.rows[0].count),
        relationships: parseInt(relsCount.rows[0].count)
      };
    }

    return NextResponse.json({
      success: true,
      status: {
        allTablesExist: missingTables.length === 0,
        existingTables,
        missingTables,
        dataCounts,
        isSeeded: dataCounts.knowledge_base_entries > 0 && dataCounts.domains > 0
      }
    });
  } catch (error: any) {
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
