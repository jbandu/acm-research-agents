/**
 * Test Data Seeding Script
 * Creates test users and sample data for E2E testing
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const TEST_USERS = [
  {
    email: 'test@acm.com',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'user',
  },
  {
    email: 'admin@acm.com',
    password: 'AdminPassword123!',
    name: 'Admin User',
    role: 'admin',
  },
];

async function seedTestData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Delete existing test users
    console.log('Cleaning up existing test data...');
    await client.query(
      "DELETE FROM users WHERE email IN ($1, $2)",
      TEST_USERS.map(u => u.email)
    );

    // Create test users
    console.log('Creating test users...');
    for (const user of TEST_USERS) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const result = await client.query(
        `INSERT INTO users (email, password_hash, name, role, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, role`,
        [user.email, hashedPassword, user.name, user.role, true]
      );

      console.log(`✓ Created user: ${result.rows[0].email} (${result.rows[0].role})`);
    }

    // Verify workflows exist
    const workflowsResult = await client.query('SELECT COUNT(*) FROM workflows');
    console.log(`✓ Found ${workflowsResult.rows[0].count} workflows in database`);

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('─────────────────────────────────────────────');
    TEST_USERS.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedTestData();
