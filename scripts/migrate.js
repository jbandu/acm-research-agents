// Simple migration script to create ACM tables
// Usage: node scripts/migrate.js
//    or: npm run migrate

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try to load .env.local if it exists
try {
  const dotenv = require('dotenv');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('📋 Loaded environment from .env.local');
  }
} catch (err) {
  // dotenv not available or .env.local doesn't exist, that's okay
}

async function runMigration() {
  console.log('🚀 Starting ACM Context & Knowledge Graph migration...\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable not set');
    console.error('Please set DATABASE_URL and try again.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '003_acm_context_and_ontology.sql');

    console.log('📄 Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🔄 Executing migration...');
    await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tablesResult = await pool.query(`
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

    console.log(`\n✅ Tables created: ${tablesResult.rows.length}/6`);
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check seed data
    console.log('\n🔍 Checking seed data...');
    const kbCount = await pool.query('SELECT COUNT(*) FROM acm_knowledge_base');
    const domainsCount = await pool.query('SELECT COUNT(*) FROM acm_domains');
    const nodesCount = await pool.query('SELECT COUNT(*) FROM acm_nodes');
    const relsCount = await pool.query('SELECT COUNT(*) FROM acm_relationships');

    console.log(`   📚 Knowledge base entries: ${kbCount.rows[0].count}`);
    console.log(`   🏷️  Domains: ${domainsCount.rows[0].count}`);
    console.log(`   🔵 Nodes: ${nodesCount.rows[0].count}`);
    console.log(`   🔗 Relationships: ${relsCount.rows[0].count}`);

    console.log('\n🎉 Migration and seeding completed successfully!');
    console.log('👉 You can now access the Knowledge Graph at /ontology\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);

    // Check if it's because tables already exist
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Tables already exist. This is okay!');
      console.log('Run this query to check status:');
      console.log('   SELECT COUNT(*) FROM acm_domains;');
      process.exit(0);
    } else {
      console.error('\nError details:', error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();
