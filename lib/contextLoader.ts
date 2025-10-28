// Context Loading System with Prompt Caching for ACM Research Agents
// Supports Anthropic, OpenAI, Google Gemini, and xAI Grok

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from './db';

// ============================================
// Types and Interfaces
// ============================================

export type ContextLevel = 'minimal' | 'standard' | 'deep';

export interface ContextStrategy {
  level: ContextLevel;
  maxTokens: number;
  categories: string[];
  description: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  importance_score: number;
  token_count: number;
}

export interface ContextUsageMetrics {
  queryId: string;
  contextLevel: ContextLevel;
  knowledgeBaseIds: string[];
  cacheHit: boolean;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalContextTokens: number;
  provider: string;
}

// ============================================
// Context Strategies Configuration
// ============================================

export const CONTEXT_STRATEGIES: Record<ContextLevel, ContextStrategy> = {
  minimal: {
    level: 'minimal',
    maxTokens: 0,
    categories: [],
    description: 'No additional context - just the user query'
  },
  standard: {
    level: 'standard',
    maxTokens: 10000,
    categories: ['company:overview', 'company:challenges', 'people:leadership'],
    description: 'Company basics and leadership (cached, ~10K tokens)'
  },
  deep: {
    level: 'deep',
    maxTokens: 200000,
    categories: [
      'company:overview',
      'company:challenges',
      'people:leadership',
      'research:clinical_trials',
      'competitive:tlr9_landscape',
      'competitive:ai_in_biotech'
    ],
    description: 'Full knowledge base with competitive intelligence (cached, ~200K tokens)'
  }
};

// ============================================
// Core Context Loading Functions
// ============================================

/**
 * Load ACM knowledge base context based on strategy
 */
export async function loadACMContext(
  contextLevel: ContextLevel = 'standard',
  customCategories?: string[]
): Promise<{ context: string; entries: KnowledgeBaseEntry[] }> {
  const strategy = CONTEXT_STRATEGIES[contextLevel];

  if (strategy.level === 'minimal') {
    return { context: '', entries: [] };
  }

  const categoriesToLoad = customCategories || strategy.categories;

  // Build SQL query to fetch knowledge base entries
  const categoryConditions = categoriesToLoad.map(cat => {
    const [category, subcategory] = cat.split(':');
    if (subcategory) {
      return `(category = '${category}' AND subcategory = '${subcategory}')`;
    }
    return `category = '${category}'`;
  }).join(' OR ');

  const result = await query(`
    SELECT
      id, category, subcategory, title, content,
      metadata, importance_score, token_count
    FROM acm_knowledge_base
    WHERE ${categoryConditions}
    ORDER BY importance_score DESC, created_at DESC
  `);

  const entries: KnowledgeBaseEntry[] = result.rows;

  // Build context document
  let contextDoc = `# ACM Biolabs Knowledge Base
## Context for Research Query

This context provides background information about ACM Biolabs to help answer research questions accurately.

---

`;

  let totalTokens = 0;
  const includedEntries: KnowledgeBaseEntry[] = [];

  for (const entry of entries) {
    const entryText = `### ${entry.title}\n**Category:** ${entry.category} / ${entry.subcategory}\n\n${entry.content}\n\n---\n\n`;
    const estimatedTokens = Math.ceil(entryText.length / 4); // Rough estimate: 4 chars per token

    if (totalTokens + estimatedTokens > strategy.maxTokens) {
      break; // Stop if we exceed token budget
    }

    contextDoc += entryText;
    totalTokens += estimatedTokens;
    includedEntries.push(entry);
  }

  contextDoc += `\n**Total Context Entries:** ${includedEntries.length}\n**Estimated Tokens:** ~${totalTokens}\n`;

  return { context: contextDoc, entries: includedEntries };
}

/**
 * Get context strategy for a workflow template
 */
export async function getWorkflowContextStrategy(
  workflowTemplateId: string
): Promise<{ level: ContextLevel; categories: string[]; maxTokens: number } | null> {
  const result = await query(`
    SELECT context_level, required_categories, max_tokens
    FROM workflow_context_strategies
    WHERE workflow_template_id = $1
  `, [workflowTemplateId]);

  if (result.rows.length === 0) {
    return null; // Use default strategy
  }

  return {
    level: result.rows[0].context_level as ContextLevel,
    categories: result.rows[0].required_categories || [],
    maxTokens: result.rows[0].max_tokens || 10000
  };
}

/**
 * Save context strategy for a workflow template
 */
export async function saveWorkflowContextStrategy(
  workflowTemplateId: string,
  contextLevel: ContextLevel,
  requiredCategories?: string[],
  maxTokens?: number
): Promise<void> {
  await query(`
    INSERT INTO workflow_context_strategies
      (workflow_template_id, context_level, required_categories, max_tokens, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (workflow_template_id)
    DO UPDATE SET
      context_level = EXCLUDED.context_level,
      required_categories = EXCLUDED.required_categories,
      max_tokens = EXCLUDED.max_tokens,
      updated_at = NOW()
  `, [
    workflowTemplateId,
    contextLevel,
    requiredCategories || CONTEXT_STRATEGIES[contextLevel].categories,
    maxTokens || CONTEXT_STRATEGIES[contextLevel].maxTokens
  ]);
}

/**
 * Track context usage for analytics
 */
export async function trackContextUsage(metrics: ContextUsageMetrics): Promise<void> {
  await query(`
    INSERT INTO query_context_usage (
      query_id, knowledge_base_ids, context_level, cache_hit,
      cache_read_tokens, cache_write_tokens, total_context_tokens, provider
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    metrics.queryId,
    metrics.knowledgeBaseIds,
    metrics.contextLevel,
    metrics.cacheHit,
    metrics.cacheReadTokens,
    metrics.cacheWriteTokens,
    metrics.totalContextTokens,
    metrics.provider
  ]);
}

// ============================================
// LLM Provider Integrations with Caching
// ============================================

/**
 * Query Claude with context and prompt caching
 */
export async function queryClaudeWithContext(
  userQuery: string,
  contextLevel: ContextLevel = 'standard',
  queryId?: string,
  model: string = 'claude-sonnet-4-5-20250929'
): Promise<{ response: string; usage: any }> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const { context, entries } = await loadACMContext(contextLevel);

  const systemMessages: Anthropic.Messages.MessageCreateParams['system'] = [
    {
      type: 'text',
      text: 'You are a research assistant for ACM Biolabs, a clinical-stage biopharmaceutical company specializing in cancer immunotherapy and mRNA delivery platforms. Provide accurate, scientifically rigorous responses based on the provided context.'
    }
  ];

  // Add cached context if available
  if (context) {
    systemMessages.push({
      type: 'text',
      text: context,
      cache_control: { type: 'ephemeral' } // Enable prompt caching
    });
  }

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system: systemMessages,
    messages: [
      {
        role: 'user',
        content: userQuery
      }
    ]
  });

  // Extract text from response
  const responseText = response.content
    .filter(block => block.type === 'text')
    .map(block => (block as Anthropic.Messages.TextBlock).text)
    .join('\n');

  // Track usage if queryId provided
  if (queryId) {
    await trackContextUsage({
      queryId,
      contextLevel,
      knowledgeBaseIds: entries.map(e => e.id),
      cacheHit: (response.usage.cache_read_input_tokens || 0) > 0,
      cacheReadTokens: response.usage.cache_read_input_tokens || 0,
      cacheWriteTokens: response.usage.cache_creation_input_tokens || 0,
      totalContextTokens: Math.ceil(context.length / 4),
      provider: 'anthropic'
    });
  }

  return {
    response: responseText,
    usage: response.usage
  };
}

/**
 * Query OpenAI with context (uses native prompt caching for supported models)
 */
export async function queryOpenAIWithContext(
  userQuery: string,
  contextLevel: ContextLevel = 'standard',
  queryId?: string,
  model: string = 'gpt-4o'
): Promise<{ response: string; usage: any }> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const { context, entries } = await loadACMContext(contextLevel);

  const systemMessage = context
    ? `You are a research assistant for ACM Biolabs, a clinical-stage biopharmaceutical company specializing in cancer immunotherapy and mRNA delivery platforms.

${context}

Provide accurate, scientifically rigorous responses based on the provided context.`
    : 'You are a research assistant for ACM Biolabs. Provide accurate, scientifically rigorous responses.';

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userQuery }
    ],
    max_tokens: 4096
  });

  const responseText = response.choices[0]?.message?.content || '';

  // Track usage if queryId provided
  if (queryId) {
    await trackContextUsage({
      queryId,
      contextLevel,
      knowledgeBaseIds: entries.map(e => e.id),
      cacheHit: false, // OpenAI doesn't expose cache metrics directly
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalContextTokens: response.usage?.prompt_tokens || 0,
      provider: 'openai'
    });
  }

  return {
    response: responseText,
    usage: response.usage
  };
}

/**
 * Query Google Gemini with context (uses native caching)
 */
export async function queryGeminiWithContext(
  userQuery: string,
  contextLevel: ContextLevel = 'standard',
  queryId?: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<{ response: string; usage: any }> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

  const { context, entries } = await loadACMContext(contextLevel);

  const systemInstruction = context
    ? `You are a research assistant for ACM Biolabs, a clinical-stage biopharmaceutical company specializing in cancer immunotherapy and mRNA delivery platforms.

${context}

Provide accurate, scientifically rigorous responses based on the provided context.`
    : 'You are a research assistant for ACM Biolabs. Provide accurate, scientifically rigorous responses.';

  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction
  });

  const result = await genModel.generateContent(userQuery);
  const responseText = result.response.text();

  // Track usage if queryId provided
  if (queryId) {
    await trackContextUsage({
      queryId,
      contextLevel,
      knowledgeBaseIds: entries.map(e => e.id),
      cacheHit: false, // Gemini doesn't expose cache metrics in the same way
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalContextTokens: Math.ceil(context.length / 4),
      provider: 'google'
    });
  }

  return {
    response: responseText,
    usage: result.response.usageMetadata || {}
  };
}

/**
 * Query Grok with context (no native caching, include in system message)
 */
export async function queryGrokWithContext(
  userQuery: string,
  contextLevel: ContextLevel = 'standard',
  queryId?: string,
  model: string = 'grok-2-latest'
): Promise<{ response: string; usage: any }> {
  const openai = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1'
  });

  const { context, entries } = await loadACMContext(contextLevel);

  const systemMessage = context
    ? `You are a research assistant for ACM Biolabs, a clinical-stage biopharmaceutical company specializing in cancer immunotherapy and mRNA delivery platforms.

${context}

Provide accurate, scientifically rigorous responses based on the provided context.`
    : 'You are a research assistant for ACM Biolabs. Provide accurate, scientifically rigorous responses.';

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userQuery }
    ],
    max_tokens: 4096
  });

  const responseText = response.choices[0]?.message?.content || '';

  // Track usage if queryId provided
  if (queryId) {
    await trackContextUsage({
      queryId,
      contextLevel,
      knowledgeBaseIds: entries.map(e => e.id),
      cacheHit: false, // Grok doesn't have native caching
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalContextTokens: response.usage?.prompt_tokens || 0,
      provider: 'xai'
    });
  }

  return {
    response: responseText,
    usage: response.usage
  };
}

// ============================================
// Universal Query Function
// ============================================

export interface UniversalQueryOptions {
  provider: 'anthropic' | 'openai' | 'google' | 'xai';
  model?: string;
  contextLevel?: ContextLevel;
  queryId?: string;
}

/**
 * Universal query function that routes to the appropriate provider
 */
export async function queryLLMWithContext(
  userQuery: string,
  options: UniversalQueryOptions
): Promise<{ response: string; usage: any }> {
  const { provider, model, contextLevel = 'standard', queryId } = options;

  switch (provider) {
    case 'anthropic':
      return queryClaudeWithContext(userQuery, contextLevel, queryId, model);
    case 'openai':
      return queryOpenAIWithContext(userQuery, contextLevel, queryId, model);
    case 'google':
      return queryGeminiWithContext(userQuery, contextLevel, queryId, model);
    case 'xai':
      return queryGrokWithContext(userQuery, contextLevel, queryId, model);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ============================================
// Analytics and Reporting
// ============================================

/**
 * Get context usage statistics
 */
export async function getContextUsageStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalQueries: number;
  cacheHitRate: number;
  tokensSaved: number;
  byProvider: Record<string, any>;
  byContextLevel: Record<string, any>;
}> {
  const dateFilter = startDate && endDate
    ? `WHERE created_at BETWEEN $1 AND $2`
    : '';

  const params = startDate && endDate ? [startDate, endDate] : [];

  const result = await query(`
    SELECT
      COUNT(*) as total_queries,
      SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
      SUM(cache_read_tokens) as total_cache_read_tokens,
      SUM(cache_write_tokens) as total_cache_write_tokens,
      provider,
      context_level
    FROM query_context_usage
    ${dateFilter}
    GROUP BY provider, context_level
  `, params);

  const totalQueries = result.rows.reduce((sum, row) => sum + parseInt(row.total_queries), 0);
  const totalCacheHits = result.rows.reduce((sum, row) => sum + parseInt(row.cache_hits), 0);
  const totalCacheReadTokens = result.rows.reduce((sum, row) => sum + parseInt(row.total_cache_read_tokens || 0), 0);

  const cacheHitRate = totalQueries > 0 ? (totalCacheHits / totalQueries) * 100 : 0;

  // Estimate tokens saved (cache read tokens are tokens not charged)
  const tokensSaved = totalCacheReadTokens;

  // Aggregate by provider
  const byProvider: Record<string, any> = {};
  const byContextLevel: Record<string, any> = {};

  for (const row of result.rows) {
    const provider = row.provider;
    if (!byProvider[provider]) {
      byProvider[provider] = {
        queries: 0,
        cacheHits: 0,
        cacheReadTokens: 0
      };
    }
    byProvider[provider].queries += parseInt(row.total_queries);
    byProvider[provider].cacheHits += parseInt(row.cache_hits);
    byProvider[provider].cacheReadTokens += parseInt(row.total_cache_read_tokens || 0);

    const level = row.context_level;
    if (!byContextLevel[level]) {
      byContextLevel[level] = {
        queries: 0,
        cacheHits: 0,
        cacheReadTokens: 0
      };
    }
    byContextLevel[level].queries += parseInt(row.total_queries);
    byContextLevel[level].cacheHits += parseInt(row.cache_hits);
    byContextLevel[level].cacheReadTokens += parseInt(row.total_cache_read_tokens || 0);
  }

  return {
    totalQueries,
    cacheHitRate,
    tokensSaved,
    byProvider,
    byContextLevel
  };
}
