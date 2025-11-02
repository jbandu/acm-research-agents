#!/usr/bin/env node

const bcrypt = require('bcryptjs');
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

async function testPassword() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const result = await client.query(
      'SELECT email, password_hash FROM users WHERE email = $1',
      ['jbandu@gmail.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log('User email:', user.email);
    console.log('Password hash:', user.password_hash.substring(0, 30) + '...\n');

    // Test the password
    const password = 'Admin@123!';
    console.log(`Testing password: "${password}"`);

    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password is valid:', isValid ? '✅ YES' : '❌ NO');

    if (!isValid) {
      console.log('\n💡 The password hash may be incorrect.');
      console.log('   Creating a new hash for comparison...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('   New hash:', newHash.substring(0, 30) + '...');
      console.log('   Old hash:', user.password_hash.substring(0, 30) + '...');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testPassword();
