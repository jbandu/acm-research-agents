// Seed admin user with proper password
import { hash } from 'bcryptjs';
import pkg from 'pg';
const { Client } = pkg;

async function seedAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Hash the password (you should change this!)
    const defaultPassword = 'Admin@123!'; // CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN
    const passwordHash = await hash(defaultPassword, 12);

    // Update or insert admin user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, name, role, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email)
       DO UPDATE SET password_hash = $2, name = $3, role = $4, email_verified = $5
       RETURNING id, email`,
      ['jbandu@gmail.com', passwordHash, 'Jayaprakash Bandu', 'admin', true]
    );

    console.log('✅ Admin user created/updated:', result.rows[0]);
    console.log('📧 Email: jbandu@gmail.com');
    console.log('🔑 Default Password: Admin@123!');
    console.log('⚠️  IMPORTANT: Change this password immediately after first login!');

    // Get admin user ID
    const adminUserId = result.rows[0].id;

    // Update all existing queries to be owned by admin
    const queriesUpdate = await client.query(
      `UPDATE queries SET user_id = $1 WHERE user_id IS NULL OR user_id::text = 'current_user'`,
      [adminUserId]
    );
    console.log(`✅ Updated ${queriesUpdate.rowCount} queries to admin ownership`);

    // Update user_workflows
    const workflowsUpdate = await client.query(
      `UPDATE user_workflows SET user_id = $1 WHERE user_id IS NULL`,
      [adminUserId]
    );
    console.log(`✅ Updated ${workflowsUpdate.rowCount} user workflows to admin ownership`);

    // Update query_collections
    const collectionsUpdate = await client.query(
      `UPDATE query_collections SET user_id = $1 WHERE user_id IS NULL`,
      [adminUserId]
    );
    console.log(`✅ Updated ${collectionsUpdate.rowCount} collections to admin ownership`);

    console.log('\n✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seedAdmin().catch(console.error);
