# ⚡ QUICK START - Add Your API Keys

## Step 1: Create .env.local File

```bash
cp .env.example .env.local
```

## Step 2: Add Your API Keys

Open `.env.local` and add your keys:

```env
# REQUIRED: Database (from Neon)
DATABASE_URL=postgresql://user:password@host.neon.tech/acm_research?sslmode=require

# REQUIRED: At least 2 LLM APIs (app works with 2-4 LLMs)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-xxxxx

# OPTIONAL: These make it even better
GOOGLE_AI_API_KEY=xxxxx
XAI_API_KEY=xxxxx

# Auto-configured
NEXT_PUBLIC_APP_NAME=ACM Research Agents
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Test Locally

```bash
# Install dependencies (if you haven't)
npm install

# Run the app
npm run dev
```

Open: http://localhost:3000

## Step 4: Try a Query!

1. Click "New Query"
2. Select: "Literature Mining & Synthesis"
3. Enter: "Latest advances in TLR9 agonists for cancer"
4. Click "Run Query"
5. Watch all LLMs respond! 🎉

---

## Where to Get API Keys

### 🔵 Claude (Anthropic) - RECOMMENDED
- URL: https://console.anthropic.com
- Click "Get API Keys"
- Create new key
- Copy to `ANTHROPIC_API_KEY`
- **Cost:** ~$3 per 1M tokens (~$0.05 per query)

### 🟢 OpenAI (GPT-4) - RECOMMENDED  
- URL: https://platform.openai.com/api-keys
- Create new secret key
- Copy to `OPENAI_API_KEY`
- **Cost:** ~$2 per 1M tokens (~$0.03 per query)

### 🔴 Gemini (Google AI) - OPTIONAL
- URL: https://makersuite.google.com/app/apikey
- Get API key
- Copy to `GOOGLE_AI_API_KEY`
- **Cost:** ~$1 per 1M tokens (~$0.02 per query)

### ⚪ Grok (xAI) - OPTIONAL
- URL: https://console.x.ai
- Get API key (may need waitlist access)
- Copy to `XAI_API_KEY`
- **Cost:** ~$2 per 1M tokens (~$0.03 per query)

---

## Database Setup (Neon)

### Get Neon Database (2 minutes):

1. **Go to: https://neon.tech**
2. **Sign up** (free)
3. **Create project:** "ACM Research Agents"
4. **Copy connection string**
5. **Paste into .env.local** as `DATABASE_URL`

### Initialize Schema:

**Option 1: Use Neon SQL Editor (Easiest)**
- Open Neon dashboard → SQL Editor
- Copy all content from `schema.sql`
- Paste and run

**Option 2: Use psql command line**
```bash
psql $DATABASE_URL < schema.sql
```

---

## Test Queries

Try these sample queries to test the system:

### 1. Literature Mining
**Query:** "What are the latest advances in nanoparticle-based immunotherapy delivery systems?"

**Workflow:** Literature Mining & Synthesis

**Expected:** All 4 LLMs will return recent research with PMID citations

---

### 2. Target Validation
**Query:** "Evaluate TLR9 agonists as combination therapy with checkpoint inhibitors. What's the safety profile and mechanism of synergy?"

**Workflow:** Target Identification & Validation

**Expected:** Detailed mechanism analysis with clinical trial references

---

### 3. Competitive Intelligence
**Query:** "What competitors are working on polymer-based nanoparticle delivery for cancer immunotherapy? Include recent patent filings."

**Workflow:** Competitive Intelligence

**Expected:** Market landscape with company names and patent numbers

---

### 4. Clinical Trial Design
**Query:** "Design a Phase 2 trial for ACM-CpG in combination with pembrolizumab for advanced solid tumors. Suggest endpoints and patient selection criteria."

**Workflow:** Clinical Trial Design

**Expected:** Complete trial design with NCT number references to similar trials

---

## Expected Response Format

Each LLM will respond with:
- **Main analysis** (2-5 paragraphs)
- **Key evidence** with citations (PMID, NCT numbers)
- **Confidence score** (0-100)
- **Response time** and token usage

The system will show:
- ✅ **Consensus indicator** if all LLMs agree (>85% similarity)
- ⚠️ **Conflict warning** if LLMs disagree significantly
- 📊 **Comparison view** showing all 4 responses side-by-side

---

## Minimum Requirements

**To run the app, you need:**
- ✅ Node.js 18+ installed
- ✅ A Neon database (free tier is fine)
- ✅ At least 2 LLM API keys (Claude + OpenAI recommended)

**The app will work with 2, 3, or 4 LLMs:**
- 2 LLMs: Basic comparison
- 3 LLMs: Good consensus detection
- 4 LLMs: Full ensemble intelligence (recommended)

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Test your database connection
psql $DATABASE_URL -c "SELECT 1;"
```

If fails:
- Check DATABASE_URL format
- Make sure Neon database is active
- Verify SSL mode is set: `?sslmode=require`

### "Invalid API key"
- Check for extra spaces in .env.local
- Make sure key starts with correct prefix:
  - Claude: `sk-ant-`
  - OpenAI: `sk-`
  - Gemini: varies
  - Grok: varies

### "Module not found"
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### "Port 3000 already in use"
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

---

## Cost Tracking

The app automatically tracks:
- Tokens used per LLM
- Response times
- Cache hit rate (saves money!)

**Check costs in the History page:**
http://localhost:3000/history

**Expected costs per 100 queries:**
- With caching: ~$5-12
- Without caching: ~$13-29

**Caching saves 60-80% on API costs!**

---

## Ready to Deploy?

Once testing locally works:
```bash
# See full deployment guide
cat DEPLOYMENT.md
```

Or jump straight to Vercel:
```bash
vercel
```

---

## 🎯 You're Ready!

Once you see responses from all LLMs on localhost:3000, you're ready to deploy and show Madhavan! 🚀

**Next:** Share your Vercel URL with the ACM Biolabs team and start gathering real research queries.
