const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connectionString = 'postgresql://neondb_owner:npg_vzB1Y0sZFdiH@ep-restless-violet-ahj1ztdi-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '009_provider_settings.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 009_provider_settings.sql...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');

    // Verify the table was created
    const result = await client.query('SELECT COUNT(*) FROM provider_settings');
    console.log(`✅ Provider settings table has ${result.rows[0].count} records`);

    // Show the providers
    const providers = await client.query('SELECT provider_key, provider_type, enabled FROM provider_settings ORDER BY provider_type, display_order');
    console.log('\n📋 Configured providers:');
    providers.rows.forEach(p => {
      const status = p.enabled ? '✓ enabled' : '✗ disabled';
      console.log(`  ${p.provider_type.padEnd(10)} ${p.provider_key.padEnd(15)} ${status}`);
    });

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
