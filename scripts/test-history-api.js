#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function testHistoryAPI() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Simulate the exact query from the API
    const page = 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const sortBy = 'created_at';
    const sortOrder = 'desc';

    let queryText = `
      SELECT
        q.id, q.workflow_id, q.query_text, q.user_id, q.status, q.created_at,
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
      ORDER BY q.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $1 OFFSET $2
    `;

    console.log('🔍 Testing History API Query\n');
    console.log('Parameters:', { page, limit, offset, sortBy, sortOrder });
    console.log('\n');

    const result = await client.query(queryText, [limit, offset]);

    console.log(`✅ Found ${result.rows.length} queries\n`);

    if (result.rows.length > 0) {
      console.log('📋 First Query Details:\n');
      const first = result.rows[0];
      console.log('  ID:', first.id);
      console.log('  Query:', first.query_text.substring(0, 100) + '...');
      console.log('  Status:', first.status);
      console.log('  Created:', first.created_at);
      console.log('  Workflow:', first.workflow_name || 'null');
      console.log('  Consensus:', first.consensus_level || 'null');
      console.log('  Response Count:', first.response_count);
      console.log('\n');
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT q.id) as total
      FROM queries q
      LEFT JOIN workflows w ON w.id = q.workflow_id
      LEFT JOIN consensus_results cr ON cr.query_id = q.id
      LEFT JOIN workflow_executions we ON we.query_id = q.id
      WHERE 1=1
    `;

    const countResult = await client.query(countQuery);
    const total = parseInt(countResult.rows[0]?.total || '0');

    console.log(`📊 Total Queries: ${total}`);
    console.log(`📊 Returned Queries: ${result.rows.length}`);
    console.log(`📊 Total Pages: ${Math.ceil(total / limit)}`);

    // Transform data like the API does
    const transformedQueries = result.rows.map(q => ({
      id: q.id,
      workflow_id: q.workflow_id,
      query_text: q.query_text,
      user_id: q.user_id,
      status: q.status,
      created_at: q.created_at,
      response_count: q.response_count,
      responses: [],
      workflow: q.workflow_name ? {
        id: q.workflow_id,
        name: q.workflow_name,
        category: q.workflow_category,
        icon: q.workflow_icon
      } : null,
      consensus: q.consensus_level ? {
        consensus_level: q.consensus_level,
        agreeing_providers: q.agreeing_providers || [],
        conflicting_providers: q.conflicting_providers || []
      } : null,
      execution: q.execution_time_seconds ? {
        execution_time_seconds: q.execution_time_seconds
      } : null
    }));

    console.log('\n✅ API Response Structure:\n');
    console.log(JSON.stringify({
      queries: transformedQueries.slice(0, 2), // First 2 for brevity
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

testHistoryAPI();
