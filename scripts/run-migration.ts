// Script to run database migrations
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration(migrationFile: string) {
  console.log(`\n🔄 Running migration: ${migrationFile}`);

  try {
    const migrationPath = join(__dirname, '..', 'db', 'migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await pool.query(sql);

    console.log(`✅ Successfully ran migration: ${migrationFile}`);
  } catch (error: any) {
    console.error(`❌ Error running migration ${migrationFile}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database migration...');

  try {
    // Run the context and ontology migration
    await runMigration('003_acm_context_and_ontology.sql');

    console.log('\n✨ All migrations completed successfully!');
  } catch (error) {
    console.error('\n💥 Migration failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
