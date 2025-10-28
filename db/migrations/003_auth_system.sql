-- Migration 003: Authentication System
-- Add users table and update existing tables with proper user references

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user'
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Sessions table for NextAuth
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verification tokens for email verification
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Add updated_at trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing tables to use UUID user references instead of text
-- First, create the admin user
INSERT INTO users (email, password_hash, name, role, email_verified)
VALUES (
  'jbandu@gmail.com',
  '$2a$10$kGxQVHhKvVY5CqN5F5t5Ue5bKfY5K4WoGCKmB5Z5Z5Z5Z5Z5Z5Z5Z5', -- placeholder, will be updated via seed script
  'Jayaprakash Bandu',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Store the admin user ID in a variable
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM users WHERE email = 'jbandu@gmail.com';

  -- Update queries table to reference the admin user
  -- First add the new column
  ALTER TABLE queries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

  -- Migrate existing data
  UPDATE queries SET user_id = admin_user_id WHERE user_id IS NULL;

  -- Update user_workflows table
  ALTER TABLE user_workflows ALTER COLUMN user_id TYPE UUID USING NULL;
  UPDATE user_workflows SET user_id = admin_user_id WHERE user_id IS NULL;

  -- Update query_collections table
  ALTER TABLE query_collections ALTER COLUMN user_id TYPE UUID USING NULL;
  UPDATE query_collections SET user_id = admin_user_id WHERE user_id IS NULL;
END $$;

-- Now drop the old created_by text column from queries and add foreign key
ALTER TABLE queries DROP COLUMN IF EXISTS created_by;

-- Make user_id required for new records
ALTER TABLE queries ALTER COLUMN user_id SET NOT NULL;

-- Add index for user queries
CREATE INDEX IF NOT EXISTS idx_queries_user ON queries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_user_id ON user_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_query_collections_user_id ON query_collections(user_id);
