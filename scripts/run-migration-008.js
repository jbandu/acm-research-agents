#!/usr/bin/env node

/**
 * Run migration 008 - Patent Intelligence tables
 * This creates the patent_searches and patent_results tables needed for patent tracking
 */

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

async function runMigration() {
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in environment');
    console.error('');
    console.error('For production migration:');
    console.error('  DATABASE_URL=<your-neon-production-url> node scripts/run-migration-008.js');
    console.error('');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log('   Database:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown');
    console.log('');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '008_patent_intelligence.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Running Migration 008: Patent Intelligence');
    console.log('   This will create:');
    console.log('   - patent_searches table');
    console.log('   - patent_results table');
    console.log('   - Related indexes');
    console.log('');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('patent_searches', 'patent_results')
      ORDER BY table_name
    `);

    console.log('✅ Verified tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

    // Show table counts
    const searchCountResult = await client.query('SELECT COUNT(*) FROM patent_searches');
    const resultsCountResult = await client.query('SELECT COUNT(*) FROM patent_results');

    console.log('📊 Current data:');
    console.log(`   - patent_searches: ${searchCountResult.rows[0].count} records`);
    console.log(`   - patent_results: ${resultsCountResult.rows[0].count} records`);
    console.log('');

    console.log('🎉 Patent Intelligence feature is now ready!');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Ensure SERPAPI_KEY is set in Vercel environment variables');
    console.log('   2. Redeploy the application (or wait for auto-deploy)');
    console.log('   3. Test by running a query on the query page');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');

    if (error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist - migration may have been run before.');
      console.log('   This is not an error if the tables are already set up.');
    } else {
      console.error('Full error:', error);
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
