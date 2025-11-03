#!/bin/bash
set -e

echo "Setting up test database schema..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

# Run base schema (includes UUID extension, base tables, and trigger function)
echo "Running base schema..."
psql "$DATABASE_URL" -f schema.sql

# Run authentication system migration (includes users table)
echo "Running authentication migration..."
psql "$DATABASE_URL" -f db/migrations/003_auth_system.sql

echo "Test database schema setup complete!"
