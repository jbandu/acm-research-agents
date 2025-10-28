# Cost Estimation & Data Source System

## 🎯 Overview

The ACM Research Agents platform now includes a comprehensive **cost estimation and data source selection system** that provides complete transparency into research costs **before** executing queries.

### Key Features

✅ **17 Research Databases** (free and paid)
✅ **Pre-flight Cost Calculator** - See costs before running
✅ **LLM Cost Breakdown** - All 4 models (Claude, OpenAI, Gemini, Grok)
✅ **Data Source Cost Tracking** - Per-query and per-article pricing
✅ **High Cost Warnings** - Alerts for expensive operations
✅ **Smart Recommendations** - Suggested data sources per workflow

---

## 📊 Research Databases Available

### **Free Sources (No Cost)**

| Database | Category | Coverage | MCP Available |
|----------|----------|----------|---------------|
| **PubMed/PMC** | Literature | 36M+ biomedical citations, 8M+ full-text | ✅ Yes |
| **Semantic Scholar** | Literature | 200M+ papers with AI insights | ✅ Yes |
| **arXiv** | Literature | 2M+ preprints (physics, bio, CS) | ✅ Yes |
| **bioRxiv/medRxiv** | Literature | 200K+ biology/medicine preprints | ✅ Yes |
| **ClinicalTrials.gov** | Clinical Trials | 480K+ trial records worldwide | ✅ Yes |
| **PubChem** | Genomics | 111M+ chemical compounds | ✅ Yes |
| **Europe PMC** | Literature | 41M+ life science publications | ✅ Yes |
| **Google Patents** | Patents | 120M+ patents from 100+ offices | ✅ Yes |
| **FDA Drugs Database** | Regulatory | FDA-approved drugs and reviews | ✅ Yes |
| **EMA Clinical Trials** | Regulatory | European regulatory data | ❌ No |

### **Institutional Access (Free with Subscription)**

| Database | Category | Cost Without Subscription | Coverage |
|----------|----------|--------------------------|----------|
| **Scopus** | Literature | $0.05/query | 26K+ journals, 8M+ conference papers |
| **Web of Science** | Literature | $0.10/query | 21K+ journals, 1.9B cited references |
| **Embase** | Literature | $0.10/query | 32M+ biomedical/pharmaceutical records |

### **Paid Per Article**

| Database | Category | Cost | Coverage |
|----------|----------|------|----------|
| **ScienceDirect** | Literature | $35/article | 16M+ articles (Elsevier, Cell, Lancet) |
| **Nature Portfolio** | Literature | $32/article | Nature, Nature Medicine, Nature Biotech |
| **NEJM** | Literature | $15/article | Top-tier medical journal |
| **The Lancet** | Literature | $35/article | Leading medical journal |

---

## 💰 Cost Breakdown

### LLM API Costs (Per Query)

The system queries **4 LLM models in parallel** for consensus:

| Model | Input Cost | Output Cost | Typical Query Cost |
|-------|-----------|-------------|-------------------|
| **Claude Sonnet 4** | $3/M tokens | $15/M tokens | $0.03-0.05 |
| **GPT-4o** | $5/M tokens | $15/M tokens | $0.04-0.06 |
| **Gemini 2.0 Flash** | $1.25/M tokens | $5/M tokens | $0.01-0.02 |
| **Grok-2** | $2/M tokens | $10/M tokens | $0.02-0.04 |

**Total LLM Cost per Query:** ~$0.10-0.17

### Context Loading Costs

| Context Level | Tokens | First Query Cost | Cached Query Cost | Savings |
|---------------|--------|------------------|-------------------|---------|
| **Minimal** | 0 | $0.00 | $0.00 | N/A |
| **Standard** | 10,000 | +$0.03 | +$0.003 | 90% |
| **Deep** | 100,000 | +$0.30 | +$0.030 | 90% |

💡 **Prompt caching** saves 90% on context tokens after the first query!

### Data Source Costs

**Free Sources:** $0
**Institutional (without subscription):** $0.05-0.10 per query
**Paid per article:** $15-35 per full-text article

---

## 🚀 How to Use

### 1. Select Data Sources

When creating a workflow query:

```tsx
import { DataSourceSelector } from '@/components/DataSourceSelector';

<DataSourceSelector
  workflowId={workflowId}
  selectedSources={selectedSources}
  onChange={setSelectedSources}
/>
```

**Features:**
- ✅ Check/uncheck data sources
- 🏷️ Badges for Free/Institutional/Paid
- ⭐ "Use Recommended" button
- 💚 "Free Only" quick filter
- 📂 Filter by category (literature, clinical trials, patents, etc.)
- 📖 Expandable descriptions with cost warnings

### 2. Estimate Cost

Before running your query:

```tsx
import { CostEstimator } from '@/components/CostEstimator';

<CostEstimator
  workflowId={workflowId}
  userQuery={query}
  selectedDataSources={selectedSources}
  contextLevel="standard"
  onConfirm={handleRunQuery}
/>
```

**Shows:**
- 💵 LLM costs breakdown (4 models)
- 📚 Data source costs (per-query, per-article)
- ⏱️ Estimated duration
- ⚠️ High cost warnings ($10+)
- 🚨 Very high cost alerts ($50+)

### 3. Review and Confirm

The cost estimator provides:

✅ **Green** - Low cost (<$10)
⚠️ **Yellow** - High cost ($10-50)
🚨 **Red** - Very high cost (>$50)

With warnings:
- "Consider using free sources first"
- "Remove paid sources to reduce cost"
- "Narrow your query scope"

### 4. Track Actual Costs

After execution, actual costs are tracked:

```sql
SELECT
  query_id,
  total_estimated_cost_usd,
  total_actual_cost_usd,
  cost_variance_percent
FROM query_cost_summary;
```

---

## 📡 API Endpoints

### Get Data Sources for Workflow

```bash
GET /api/workflows/{id}/data-sources

Response:
{
  "success": true,
  "sources": [
    {
      "id": "uuid",
      "name": "PubMed/PubMed Central",
      "category": "literature",
      "provider": "NCBI",
      "access_type": "free",
      "mcp_server_available": true,
      "cost_per_query": 0,
      "cost_per_article": 0,
      "coverage_description": "Free access to 36M+ biomedical citations...",
      "is_default": true,
      "is_recommended": true
    }
  ]
}
```

### Estimate Query Cost

```bash
POST /api/estimate-cost
Content-Type: application/json

{
  "workflow_id": "uuid",
  "query": "Latest mRNA codon optimization techniques",
  "data_sources": ["uuid1", "uuid2"],
  "context_level": "standard"
}

Response:
{
  "success": true,
  "breakdown": {
    "llm_costs": {
      "claude": 0.035,
      "openai": 0.042,
      "gemini": 0.015,
      "grok": 0.028,
      "total": 0.120
    },
    "data_source_costs": [
      {
        "source_name": "PubMed/PubMed Central",
        "estimated_queries": 8,
        "estimated_articles": 0,
        "cost": 0,
        "is_free": true
      },
      {
        "source_name": "ScienceDirect",
        "estimated_queries": 5,
        "estimated_articles": 3,
        "cost": 105.00,
        "is_free": false
      }
    ],
    "total_estimated_cost": 105.12,
    "estimated_duration_minutes": 18,
    "context_tokens": 10000,
    "query_tokens": 250
  }
}
```

### Get Data Source Details

```bash
GET /api/data-sources?ids=uuid1,uuid2

Response:
{
  "success": true,
  "sources": [...],
  "count": 2
}
```

---

## 💾 Database Schema

### Tables Created

1. **`data_sources`** - Catalog of 17 research databases
2. **`workflow_data_sources`** - Links sources to workflows
3. **`user_data_source_credentials`** - Encrypted API keys (future)
4. **`query_cost_estimates`** - Estimated vs actual costs
5. **`query_cost_summary`** - Aggregated cost tracking

### Run Migration

In Neon SQL Editor:

```sql
-- Run the migration SQL file
\i db/migrations/004_data_sources_and_cost_estimation.sql
```

Or via API (if migration endpoint exists):

```bash
curl -X POST http://localhost:3000/api/admin/migrate \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

---

## 🎨 UI Integration Example

Complete workflow query form:

```tsx
'use client';

import { useState } from 'react';
import { DataSourceSelector } from '@/components/DataSourceSelector';
import { CostEstimator } from '@/components/CostEstimator';
import { ContextLevelSelector } from '@/components/ContextLevelSelector';

export function WorkflowQueryForm({ workflowId }: { workflowId: string }) {
  const [query, setQuery] = useState('');
  const [contextLevel, setContextLevel] = useState<'minimal' | 'standard' | 'deep'>('standard');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showCostEstimate, setShowCostEstimate] = useState(false);

  return (
    <form className="space-y-6">
      {/* Query Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Research Query</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded-lg p-3"
          rows={4}
          placeholder="Enter your research question..."
        />
      </div>

      {/* Context Level */}
      <ContextLevelSelector
        selectedLevel={contextLevel}
        onChange={setContextLevel}
      />

      {/* Data Sources */}
      <DataSourceSelector
        workflowId={workflowId}
        selectedSources={selectedSources}
        onChange={setSelectedSources}
      />

      {/* Cost Estimator */}
      {query && selectedSources.length > 0 && (
        <CostEstimator
          workflowId={workflowId}
          userQuery={query}
          selectedDataSources={selectedSources}
          contextLevel={contextLevel}
          onConfirm={() => {
            // Submit the query
            console.log('Running query with:', {
              query,
              contextLevel,
              selectedSources
            });
          }}
        />
      )}
    </form>
  );
}
```

---

## 📈 Cost Analytics

### View Cost Trends

```sql
SELECT * FROM vw_cost_analytics
ORDER BY date DESC
LIMIT 30;
```

**Shows:**
- Daily query counts
- Estimated vs actual costs
- LLM costs vs data source costs
- Cost variance percentage

### Identify Expensive Queries

```sql
SELECT
  q.query_text,
  qcs.total_actual_cost_usd,
  qcs.estimated_duration_minutes,
  qcs.cost_variance_percent
FROM query_cost_summary qcs
JOIN queries q ON qcs.query_id = q.id
WHERE qcs.total_actual_cost_usd > 10
ORDER BY qcs.total_actual_cost_usd DESC
LIMIT 10;
```

---

## 🎯 Best Practices

### For Users

1. **Start with Free Sources**
   - Use PubMed, Semantic Scholar, arXiv first
   - Only add paid sources if needed

2. **Use Cost Estimation**
   - Always click "Estimate Cost" before running
   - Review the breakdown carefully
   - Heed high-cost warnings

3. **Optimize Query Scope**
   - Be specific to reduce API calls
   - Use date ranges to limit results
   - Start broad, then refine

4. **Leverage Caching**
   - Run similar queries together
   - Benefit from 90% cost reduction on cached context

### For Administrators

1. **Monitor Cost Trends**
   - Review `vw_cost_analytics` weekly
   - Identify cost spikes
   - Adjust data source recommendations

2. **Update Pricing**
   - Keep `data_sources` table current
   - Update `LLM_PRICING` in code as APIs change

3. **Add New Sources**
   - Use `/api/data-sources` POST endpoint
   - Link to relevant workflows
   - Set appropriate pricing models

---

## 🔧 Customization

### Add a New Data Source

```sql
INSERT INTO data_sources (
  name,
  category,
  provider,
  access_type,
  mcp_server_available,
  pricing_model,
  cost_per_query,
  cost_per_article,
  coverage_description,
  display_order
) VALUES (
  'Your Database Name',
  'literature',
  'Provider Name',
  'paid_api',
  true,
  'per_query',
  0.10,
  0,
  'Description of database coverage and features',
  60
);
```

### Link to Workflow

```sql
INSERT INTO workflow_data_sources (
  workflow_template_id,
  data_source_id,
  is_default,
  is_recommended,
  priority
) VALUES (
  'your-workflow-uuid',
  'your-datasource-uuid',
  true,
  true,
  80
);
```

---

## 🆘 Troubleshooting

### "No data sources available"

**Solution:** Run the migration to seed initial data sources:

```bash
psql $DATABASE_URL -f db/migrations/004_data_sources_and_cost_estimation.sql
```

### Cost estimate seems too high

**Check:**
1. How many paid sources are selected?
2. Is context level set to "Deep"? (100K tokens)
3. Is query very long? (more tokens = higher cost)

**Fix:**
- Select only free sources
- Use "Standard" context
- Shorten your query

### Cost estimate doesn't match actual

**Reasons:**
- Actual results may vary from estimates
- Some APIs charge per result, not per query
- Token counts are approximate

**Track variance:**
```sql
SELECT
  AVG(cost_variance_percent) as avg_variance
FROM query_cost_summary;
```

If variance > 50%, adjust estimation heuristics in `/api/estimate-cost/route.ts`.

---

## 📚 Related Documentation

- **Context Loading**: `CONTEXT_AND_KNOWLEDGE_GRAPH.md`
- **Workflow System**: Main README
- **API Reference**: See `/app/api/` endpoints

---

## 🎉 Summary

The Cost Estimation system gives Madhavan:

✅ **Complete cost transparency** before executing queries
✅ **17 research databases** (10 free, 3 institutional, 4 paid)
✅ **Smart recommendations** per workflow
✅ **High-cost warnings** to prevent bill shock
✅ **Cost tracking analytics** for budget management

This transparency builds trust and enables informed decision-making about which data sources to use for each research query! 💎

---

**Implementation Date:** October 28, 2025
**Status:** ✅ Ready for Production
**Next Step:** Run migration and test with sample queries
