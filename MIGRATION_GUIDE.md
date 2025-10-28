# Migration Guide: ACM Context & Knowledge Graph

## Error: "relation 'acm_domains' does not exist"

This error means the database tables haven't been created yet. Follow this guide to run the migration.

---

## 🚀 Three Ways to Run the Migration

### Option 1: Admin UI (Easiest) ⭐

1. **Start your development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Visit the admin migration page**:
   ```
   http://localhost:3000/admin/migrate
   ```

3. **Click "Check Status"** to see current migration state

4. **If tables are missing:**
   - Enter your `ADMIN_SECRET` (from `.env.local`)
   - Click "Run Migration"

5. **Verify success** - You should see:
   - ✅ 6 Knowledge base entries
   - ✅ 6 Domains
   - ✅ 10+ Nodes
   - ✅ 10+ Relationships

6. **Visit Knowledge Graph**:
   ```
   http://localhost:3000/ontology
   ```

---

### Option 2: Command Line Script

1. **Ensure you have a `.env.local` file** with `DATABASE_URL`:
   ```bash
   # Create from example
   cp .env.example .env.local

   # Edit and add your DATABASE_URL
   nano .env.local
   ```

2. **Run the migration script**:
   ```bash
   node scripts/migrate.js
   ```

3. **Expected output**:
   ```
   🚀 Starting ACM Context & Knowledge Graph migration...
   📄 Reading migration file...
   🔄 Executing migration...
   ✅ Migration completed successfully!

   ✅ Tables created: 6/6
      ✓ acm_domains
      ✓ acm_knowledge_base
      ✓ acm_nodes
      ✓ acm_relationships
      ✓ query_context_usage
      ✓ workflow_context_strategies

   📚 Knowledge base entries: 6
   🏷️  Domains: 6
   🔵 Nodes: 10+
   🔗 Relationships: 10+

   🎉 Migration and seeding completed successfully!
   ```

---

### Option 3: API Endpoint (Advanced)

1. **Check status**:
   ```bash
   curl http://localhost:3000/api/admin/migrate
   ```

2. **Run migration** (requires ADMIN_SECRET):
   ```bash
   curl -X POST http://localhost:3000/api/admin/migrate \
     -H "Authorization: Bearer YOUR_ADMIN_SECRET"
   ```

---

## 📋 Prerequisites

### 1. Environment Variables

Create or update `.env.local` file:

```bash
# Required for migration
DATABASE_URL=postgresql://user:password@host:port/database

# Required for admin endpoints
ADMIN_SECRET=your-secure-random-string

# Required for LLM features
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
XAI_API_KEY=...

# Required for NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 2. Database Connection

Make sure your database is accessible:

```bash
# Test database connection
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connection successful!');
  console.log('Current time:', res.rows[0].now);
  pool.end();
});
"
```

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL not set"

**Solution**: Create `.env.local` file with your database connection string:

```bash
# Copy from example
cp .env.example .env.local

# Edit and add your credentials
nano .env.local
```

### Error: "relation already exists"

**Good news!** This means tables are already created. Verify by:

```bash
curl http://localhost:3000/api/admin/migrate
```

Or visit: `http://localhost:3000/admin/migrate`

### Error: "Unauthorized" when running migration

**Solution**: Set or update your `ADMIN_SECRET`:

```bash
# In .env.local
ADMIN_SECRET=my-secure-secret-123

# Then restart your dev server
npm run dev
```

### Error: "Cannot connect to database"

**Check**:
1. Is your database running?
2. Is `DATABASE_URL` correct in `.env.local`?
3. Does your database allow connections from your IP?
4. For Neon/Vercel Postgres: Is SSL enabled?

---

## ✅ Verification

After successful migration, verify everything works:

### 1. Check API Status
```bash
curl http://localhost:3000/api/admin/migrate
```

**Expected response**:
```json
{
  "success": true,
  "status": {
    "allTablesExist": true,
    "isSeeded": true,
    "dataCounts": {
      "knowledge_base_entries": 6,
      "domains": 6,
      "nodes": 10,
      "relationships": 10
    }
  }
}
```

### 2. Visit Knowledge Graph
Navigate to: `http://localhost:3000/ontology`

You should see:
- 6 colored domain buttons (Leadership, Technology, Clinical, etc.)
- Interactive graph with 10+ nodes
- Node connections showing relationships

### 3. Test Context Loading
Execute any workflow - context will be automatically loaded:

```bash
POST /api/workflows/{workflow-id}/execute
{
  "query_text": "What are ACM's main technology platforms?",
  "contextLevel": "standard"
}
```

The response should include ACM-specific context in the LLM responses.

---

## 🎯 Next Steps

After successful migration:

1. **Explore the Knowledge Graph**: `/ontology`
2. **Read the documentation**: `CONTEXT_AND_KNOWLEDGE_GRAPH.md`
3. **Test context loading** in workflows
4. **Add custom knowledge** via API endpoints
5. **Monitor analytics** for cache hit rates

---

## 📚 Related Documentation

- **Main Documentation**: `CONTEXT_AND_KNOWLEDGE_GRAPH.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **API Reference**: See `/app/api/` endpoints

---

## 🆘 Still Having Issues?

1. Check browser console for errors (F12)
2. Check server logs: `npm run dev` output
3. Verify all environment variables are set
4. Try running migration via Admin UI: `/admin/migrate`
5. Check database logs for connection issues

---

**Need Help?** Review the error message carefully - it usually indicates the exact problem!
