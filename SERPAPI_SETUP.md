# Google Patents API Setup Guide (via SerpAPI)

## Overview

Google Patents doesn't have an official API, so we use **SerpAPI** which provides structured access to Google Patents search results.

---

## Step 1: Sign Up for SerpAPI

### 1. Visit SerpAPI
Go to: **https://serpapi.com/**

### 2. Create Account
- Click "Sign Up" or "Get Started"
- Use your ACM Biolabs email: `jbandu@gmail.com`
- Create a password
- Verify your email

### 3. Choose Plan

**Free Tier (Good for Testing):**
- ✅ 100 searches per month
- ✅ All engines including Google Patents
- ✅ No credit card required
- ⚠️ Limited for production use

**Starter Plan ($50/month):**
- ✅ 5,000 searches per month
- ✅ ~$0.01 per search
- ✅ Good for ~150 queries/day
- ✅ Recommended for ACM production

**Professional Plan ($200/month):**
- ✅ 30,000 searches per month
- ✅ ~$0.0067 per search
- ✅ Good for ~1,000 queries/day
- ✅ Best value if high volume

**Recommendation for ACM:**
Start with **Starter Plan ($50/month)** and upgrade if needed.

---

## Step 2: Get Your API Key

### After Signup:

1. **Login** to https://serpapi.com/
2. Go to **Dashboard** (top right)
3. Find **"Your Private API Key"** section
4. Copy the API key (looks like: `abc123def456...`)

**Example:**
```
Your API Key: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

⚠️ **Keep this secret!** Don't commit to GitHub or share publicly.

---

## Step 3: Add API Key to Your Environment

### Local Development (.env.local)

1. Open your `.env.local` file:
```bash
cd ~/acm
nano .env.local
```

2. Add the SerpAPI key:
```bash
# Existing keys
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_AI_API_KEY=AIza...
XAI_API_KEY=xai-...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# NEW: Add SerpAPI key
SERPAPI_KEY=your_serpapi_key_here
```

3. Save and exit (Ctrl+X, Y, Enter)

### Vercel Production

1. Go to **Vercel Dashboard**
   - Visit: https://vercel.com/
   - Select your project: `acm-research-agents`

2. Go to **Settings** → **Environment Variables**

3. Add new variable:
   - **Name:** `SERPAPI_KEY`
   - **Value:** `your_serpapi_key_here`
   - **Environment:** Check all (Production, Preview, Development)

4. Click **Save**

5. **Redeploy:**
   - Go to **Deployments**
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

---

## Step 4: Test the Connection

### Option A: Quick Test Script

Run this test script to verify your API key works:

```bash
cd ~/acm
node scripts/test-serpapi.js
```

Expected output:
```
✅ SerpAPI Connection Test
Testing Google Patents search...
Found 10 patents for "cancer immunotherapy"
✅ Connection successful!

Sample patent:
Patent: US1234567A
Title: Methods for cancer immunotherapy...
Assignee: Moderna Therapeutics
```

### Option B: Test via API Route

1. Start dev server (if not running):
```bash
npm run dev
```

2. Make a test query:
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query_text": "TLR9 agonist cancer"}'
```

3. Check server logs for:
```
Searching Google Patents...
Found X patents
```

### Option C: Test via UI

1. Login to http://localhost:3000/query
2. Enter query: "TLR9 agonist cancer immunotherapy"
3. Click "Execute Query"
4. Scroll down after results
5. Should see **"Patent Intelligence"** section with patent cards

---

## Step 5: Run Database Migration

The patent tables need to be created:

### Option A: Via psql

```bash
psql $DATABASE_URL -f db/migrations/008_patent_intelligence.sql
```

### Option B: Via Node.js

```bash
npm run migrate:008
```

### Option C: Manually via SQL client

Connect to your Neon database and run:

```sql
-- Copy contents of db/migrations/008_patent_intelligence.sql
-- Run in your database client (pgAdmin, DBeaver, etc.)
```

---

## Troubleshooting

### Error: "SERPAPI_KEY not configured"

**Problem:** API key not loaded

**Solution:**
```bash
# Check if key is in .env.local
cat .env.local | grep SERPAPI

# Restart dev server
# Kill existing: Ctrl+C
npm run dev
```

### Error: "Invalid API key"

**Problem:** Wrong key or typo

**Solution:**
1. Go back to https://serpapi.com/dashboard
2. Copy the key again (might have extra space)
3. Update `.env.local`
4. Restart server

### Error: "Rate limit exceeded"

**Problem:** Used all 100 free searches

**Solution:**
- Upgrade to paid plan ($50/month)
- Or wait until next month for free tier reset
- Or use caching to reduce searches (already implemented)

### Patents Not Appearing

**Problem:** API key not in Vercel

**Solution:**
1. Verify `SERPAPI_KEY` in Vercel environment variables
2. Redeploy from Vercel dashboard
3. Check deployment logs for errors

### No Patents Found

**Problem:** Query too specific or no results

**Solution:**
- This is normal for some queries
- Try broader query: "cancer immunotherapy" vs "XYZ-123 compound"
- Patents section will be hidden if 0 results

---

## API Usage Tracking

### Monitor Usage:

1. Visit https://serpapi.com/dashboard
2. See real-time usage:
   - Searches used this month
   - Remaining searches
   - Cost breakdown

### Set Up Alerts:

1. Go to Dashboard → Settings
2. Enable email alerts at:
   - 50% usage
   - 80% usage
   - 100% usage

---

## Cost Optimization

### Our Implementation Already Includes:

✅ **Database Caching**
- First query for "cancer immunotherapy" → SerpAPI call
- Second identical query → Database (free, instant)
- Cache stays until query changes

✅ **Smart Limits**
- Only top 10 patents fetched
- Not called if SERPAPI_KEY missing (graceful degradation)
- Errors don't break LLM queries

✅ **Analytics Tracking**
- All searches logged in `patent_searches` table
- Can see most common queries
- Optimize which queries need patents

### Additional Optimization Ideas:

**1. Query Normalization**
```javascript
// Treat these as same query (hits cache):
"TLR9 agonist cancer"
"tlr9 agonist cancer"
"TLR9  agonist  cancer"
```

**2. Selective Patent Search**
Only search patents for certain workflows:
- ✅ Drug Discovery workflows
- ✅ Preclinical Research workflows
- ❌ Literature Review workflows (don't need patents)

**3. Batch Processing**
If processing multiple queries, batch the patent searches.

---

## Pricing Calculator

### Your Expected Usage:

**Assumptions:**
- 50 unique queries per day (on average)
- 50% cache hit rate (half are repeat queries)
- 25 new patent searches per day

**Monthly Cost:**
```
25 searches/day × 30 days = 750 searches/month
750 searches < 5,000 (Starter Plan) ✅

Cost: $50/month flat rate
Per-search cost: $50/750 = $0.067 per search
```

**Annual Cost:**
```
$50/month × 12 = $600/year
```

**Compared to hiring a patent analyst:**
- Patent analyst: $100K+/year
- SerpAPI: $600/year
- **Savings: $99,400/year** 💰

---

## Alternative Options (If You Don't Want SerpAPI)

### Option 1: Google Custom Search API
**Pros:**
- Direct from Google
- 10,000 free searches per day

**Cons:**
- More complex setup
- Returns HTML, not structured data
- Need to parse results yourself

**Cost:** Free (10K/day) or $5 per 1,000 queries after

### Option 2: USPTO API (Free)
**Pros:**
- Completely free
- Official US Patent Office API
- No rate limits

**Cons:**
- Only US patents (Google Patents includes worldwide)
- Less user-friendly data format
- No Google's search quality

**URL:** https://developer.uspto.gov/

### Option 3: PatentsView API (Free)
**Pros:**
- Free and open
- Great for analytics
- Bulk data downloads

**Cons:**
- Not real-time
- Data updated quarterly
- Complex API

**URL:** https://patentsview.org/apis/api

### Recommendation:
**Stick with SerpAPI** - it's worth $50/month for:
- ✅ Structured data (JSON)
- ✅ Google's search quality
- ✅ Worldwide patent coverage
- ✅ Easy to use
- ✅ Reliable uptime

---

## Quick Start Checklist

- [ ] Sign up at https://serpapi.com/
- [ ] Choose Starter Plan ($50/month)
- [ ] Copy API key from dashboard
- [ ] Add `SERPAPI_KEY` to `.env.local`
- [ ] Add `SERPAPI_KEY` to Vercel environment variables
- [ ] Run database migration (008_patent_intelligence.sql)
- [ ] Restart local dev server
- [ ] Redeploy Vercel
- [ ] Test with a query
- [ ] Verify patents appear in UI
- [ ] Monitor usage in SerpAPI dashboard

---

## Support

**SerpAPI Support:**
- Email: support@serpapi.com
- Docs: https://serpapi.com/google-patents-api
- Status: https://status.serpapi.com/

**ACM Platform Support:**
- Check server logs for detailed error messages
- Patent search failures won't break LLM queries (graceful fallback)
- All patent searches logged in database for debugging

---

## Summary

**What You're Paying For:**
- $50/month for 5,000 patent searches
- Access to Google Patents' entire database
- Structured JSON responses (not HTML scraping)
- Reliable API with 99.9% uptime
- No need to maintain scraper infrastructure

**What You Get:**
- IP landscape analysis on every query
- LLMs can reference specific patents
- Competitive intelligence (who's patenting what)
- Freedom-to-operate risk assessment
- Patent portfolio tracking

**ROI:**
- Faster research (no manual patent searches)
- Better decisions (IP-aware from day 1)
- Reduced legal risk (know what's patented)
- Competitive advantage (spot trends early)

**Worth it?** Absolutely! 🎯
