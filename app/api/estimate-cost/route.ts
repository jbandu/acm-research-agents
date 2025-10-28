// API endpoint for cost estimation
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// LLM pricing (per million tokens)
const LLM_PRICING = {
  claude: { input: 3.00, output: 15.00 }, // Claude Sonnet 4 ($3/$15 per M)
  openai: { input: 5.00, output: 15.00 }, // GPT-4o ($5/$15 per M)
  gemini: { input: 1.25, output: 5.00 },  // Gemini 2.0 Flash ($1.25/$5 per M)
  grok: { input: 2.00, output: 10.00 }    // Grok-2 ($2/$10 per M)
};

// Context token counts by level
const CONTEXT_TOKENS = {
  minimal: 0,
  standard: 10000,
  deep: 100000
};

// POST /api/estimate-cost - Estimate query cost before execution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workflow_id,
      query: userQuery,
      data_sources: dataSourceIds,
      context_level = 'standard'
    } = body;

    if (!workflow_id || !userQuery || !dataSourceIds || dataSourceIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: workflow_id, query, data_sources'
        },
        { status: 400 }
      );
    }

    // 1. Calculate LLM costs
    const queryTokens = Math.ceil(userQuery.length / 4); // Rough estimate: 4 chars per token
    const contextTokens = CONTEXT_TOKENS[context_level as keyof typeof CONTEXT_TOKENS] || 0;
    const estimatedOutputTokens = 2000; // Per model

    const llmCosts: Record<string, number> = {};
    let totalLLMCost = 0;

    for (const [model, pricing] of Object.entries(LLM_PRICING)) {
      const inputCost = ((queryTokens + contextTokens) / 1_000_000) * pricing.input;
      const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.output;
      const modelCost = inputCost + outputCost;
      llmCosts[model] = modelCost;
      totalLLMCost += modelCost;
    }

    // 2. Get data source details and estimate costs
    const sourcesResult = await query(`
      SELECT
        ds.id,
        ds.name,
        ds.access_type,
        ds.pricing_model,
        ds.cost_per_query,
        ds.cost_per_article,
        ds.mcp_server_available
      FROM data_sources ds
      WHERE ds.id = ANY($1) AND ds.is_active = true
    `, [dataSourceIds]);

    const dataSourceCosts = [];
    let totalDataCost = 0;

    for (const source of sourcesResult.rows) {
      // Heuristic: estimate number of queries and articles based on source type
      let estimatedQueries = 5; // Base assumption
      let estimatedArticles = 0;

      // Faster sources with MCP servers may do more queries
      if (source.mcp_server_available) {
        estimatedQueries = 8;
      }

      // For paid-per-article sources, estimate conservatively
      if (source.access_type === 'paid_per_article') {
        estimatedArticles = 3; // Assume 3 full-text articles retrieved
      }

      let sourceCost = 0;

      // Calculate cost based on pricing model
      if (source.pricing_model === 'per_query' && source.cost_per_query > 0) {
        sourceCost = estimatedQueries * parseFloat(source.cost_per_query);
      } else if (source.pricing_model === 'per_article' && source.cost_per_article > 0) {
        sourceCost = estimatedArticles * parseFloat(source.cost_per_article);
      }

      const isFree = source.access_type === 'free';

      dataSourceCosts.push({
        source_id: source.id,
        source_name: source.name,
        estimated_queries: estimatedQueries,
        estimated_articles: estimatedArticles,
        cost: sourceCost,
        is_free: isFree
      });

      totalDataCost += sourceCost;
    }

    // 3. Estimate duration based on workflow complexity and data sources
    const workflowResult = await query(`
      SELECT name FROM workflows WHERE id = $1
    `, [workflow_id]);

    const workflowName = workflowResult.rows[0]?.name || 'Unknown';

    // Base duration estimates by workflow type (minutes)
    const workflowDurations: Record<string, number> = {
      'Literature Mining & Synthesis': 15,
      'Target Identification & Validation': 20,
      'Clinical Trial Design': 25,
      'Regulatory Documentation': 20,
      'Competitive Intelligence': 25,
      'Drug Formulation Optimization': 20,
      'Biomarker Discovery': 25,
      'Toxicology Assessment': 20
    };

    let estimatedDuration = workflowDurations[workflowName] || 15;

    // Add time for paid sources (they typically have slower APIs)
    const paidSourceCount = dataSourceCosts.filter(ds => !ds.is_free).length;
    estimatedDuration += paidSourceCount * 3; // +3 mins per paid source

    // 4. Build response
    const breakdown = {
      llm_costs: {
        ...llmCosts,
        total: totalLLMCost
      },
      data_source_costs: dataSourceCosts,
      total_estimated_cost: totalLLMCost + totalDataCost,
      estimated_duration_minutes: estimatedDuration,
      context_tokens: contextTokens,
      query_tokens: queryTokens
    };

    return NextResponse.json({
      success: true,
      breakdown
    });
  } catch (error: any) {
    console.error('Error estimating cost:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to estimate cost'
      },
      { status: 500 }
    );
  }
}

// GET /api/estimate-cost - Get pricing information
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    pricing: {
      llm_pricing: LLM_PRICING,
      context_tokens: CONTEXT_TOKENS,
      notes: {
        llm: 'Prices in USD per million tokens',
        data_sources: 'Varies by source - see data_sources table',
        estimation: 'Estimates are approximate and may vary based on actual usage'
      }
    }
  });
}
