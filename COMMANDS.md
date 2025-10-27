# 🚀 QUICK COMMANDS - Copy & Paste

## Initial Setup

```bash
# Navigate to project
cd /home/claude/acm-research-agents

# Create environment file
cp .env.example .env.local

# Edit .env.local with your API keys (do this manually)
# Then continue...

# Install dependencies
npm install

# Test locally
npm run dev
```

**Open:** http://localhost:3000

---

## Get API Keys

### Claude (Anthropic)
https://console.anthropic.com → Get API Keys

### OpenAI
https://platform.openai.com/api-keys → Create new secret key

### Gemini (Google AI)
https://makersuite.google.com/app/apikey → Get API key

### Grok (xAI) - Optional
https://console.x.ai → API Keys

---

## Setup Neon Database

```bash
# 1. Go to: https://neon.tech
# 2. Create project: "ACM Research Agents"
# 3. Copy connection string
# 4. Add to .env.local as DATABASE_URL

# Initialize database (Option A: Neon SQL Editor - recommended for phone)
# - Open Neon dashboard → SQL Editor
# - Copy all of schema.sql
# - Paste and run

# OR Option B: Command line
psql $DATABASE_URL < schema.sql
```

---

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Option 2: Vercel Dashboard
1. Go to https://vercel.com
2. New Project → Upload or Connect GitHub
3. Add environment variables (same as .env.local)
4. Deploy

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code

# Database
psql $DATABASE_URL -c "SELECT 1;"  # Test connection
psql $DATABASE_URL < schema.sql    # Initialize schema

# Troubleshooting
rm -rf node_modules package-lock.json  # Clean install
npm install                             # Reinstall
npx kill-port 3000                     # Kill port 3000
PORT=3001 npm run dev                  # Use different port
```

---

## Test Query (Copy & Paste)

**Query:** What are the latest advances in TLR9 agonists combined with checkpoint inhibitors for cancer immunotherapy? Include safety profile and mechanism of synergy.

**Workflow:** Target Identification & Validation

---

## Environment Variables Template

```env
# Copy this to .env.local and fill in your values

DATABASE_URL=postgresql://user:password@host.neon.tech/acmresearch?sslmode=require

ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_AI_API_KEY=xxxxx
XAI_API_KEY=xxxxx

NEXT_PUBLIC_APP_NAME=ACM Research Agents
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Vercel Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL
ANTHROPIC_API_KEY
OPENAI_API_KEY
GOOGLE_AI_API_KEY
XAI_API_KEY
```

After adding, redeploy from Deployments tab.

---

## Useful URLs

- **Neon Dashboard:** https://console.neon.tech
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Anthropic Console:** https://console.anthropic.com
- **OpenAI Platform:** https://platform.openai.com
- **Google AI Studio:** https://makersuite.google.com
- **xAI Console:** https://console.x.ai

---

## Project Structure

```
acm-research-agents/
├── app/
│   ├── api/
│   │   ├── query/         # Main query endpoint
│   │   ├── workflows/     # Workflow management
│   │   ├── history/       # Query history
│   │   └── external-search/  # PubMed, ClinicalTrials
│   ├── query/            # Query interface page
│   ├── workflows/        # Workflows management page
│   ├── history/          # History & analytics page
│   └── page.tsx          # Home page
├── lib/
│   ├── llm-clients.ts    # LLM API integrations
│   ├── db.ts             # Database connection
│   └── apis/             # External APIs
├── schema.sql            # Database schema
├── .env.local            # Your secrets (create this)
└── package.json          # Dependencies
```

---

## Git Commands (If Using GitHub)

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: ACM Research Agents"

# Create GitHub repo (using GitHub CLI)
gh repo create acm-research-agents --public --source=. --remote=origin

# Push to GitHub
git push -u origin main
```

---

## Quick Health Check

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM workflows;"

# Should return: count = 5 (the 5 pre-built workflows)

# Test if API keys work (after npm run dev)
curl http://localhost:3000/api/workflows

# Should return JSON with 5 workflows
```

---

## Cost Tracking

```bash
# Check query history in browser
open http://localhost:3000/history

# Or query database directly
psql $DATABASE_URL -c "
  SELECT 
    llm_provider,
    COUNT(*) as queries,
    SUM(tokens_used) as total_tokens,
    AVG(response_time_ms) as avg_response_ms
  FROM llm_responses
  GROUP BY llm_provider;
"
```

---

## Emergency Fixes

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port already in use"
```bash
npx kill-port 3000
npm run dev
```

### "Can't connect to database"
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# If fails, check:
# 1. DATABASE_URL in .env.local
# 2. Neon database is active
# 3. URL ends with ?sslmode=require
```

### "Build failed on Vercel"
1. Check Vercel build logs
2. Add missing environment variables
3. Redeploy

---

## Quick Deployment Checklist

- [ ] API keys in .env.local
- [ ] Database initialized (schema.sql run)
- [ ] `npm install` completed
- [ ] `npm run dev` works locally
- [ ] Test query returns 4 LLM responses
- [ ] Vercel account created
- [ ] Environment variables added to Vercel
- [ ] Deployed and tested on Vercel URL

---

**That's it! You're ready to launch.** 🚀

Full docs: See DEPLOYMENT.md and QUICKSTART.md
