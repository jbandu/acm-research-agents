import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export interface LLMResponse {
  provider: 'claude' | 'openai' | 'gemini' | 'grok';
  model: string;
  responseText: string;
  confidenceScore?: number;
  sources?: string[];
  tokensUsed?: number;
  responseTimeMs: number;
  error?: string;
}

export interface QueryInput {
  queryText: string;
  systemPrompt?: string;
  temperature?: number;
}

// Helper to extract confidence score from response text
function extractConfidence(text: string): number | undefined {
  const match = text.match(/confidence[:\s]+(\d+)%?/i);
  return match ? parseInt(match[1]) : undefined;
}

// Helper to extract sources from response text
function extractSources(text: string): string[] {
  const sources: string[] = [];
  const pmidMatches = text.matchAll(/PMID[:\s]+(\d+)/gi);
  for (const match of pmidMatches) {
    sources.push(`PMID:${match[1]}`);
  }
  const nctMatches = text.matchAll(/NCT(\d+)/gi);
  for (const match of nctMatches) {
    sources.push(`NCT${match[1]}`);
  }
  return [...new Set(sources)];
}

export async function queryClaude(input: QueryInput): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const systemPrompt = input.systemPrompt || 'You are a helpful biotech research assistant.';
    const fullPrompt = `${input.queryText}\n\nProvide your analysis with a confidence score (0-100) at the end. Include specific citations (PMID, NCT numbers) when referencing papers or trials.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: input.temperature || 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const responseTimeMs = Date.now() - startTime;

    return {
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
      responseText,
      confidenceScore: extractConfidence(responseText),
      sources: extractSources(responseText),
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      responseTimeMs,
    };
  } catch (error: any) {
    return {
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
      responseText: '',
      responseTimeMs: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

export async function queryOpenAI(input: QueryInput): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const systemPrompt = input.systemPrompt || 'You are a helpful biotech research assistant.';
    const fullPrompt = `${input.queryText}\n\nProvide your analysis with a confidence score (0-100) at the end. Include specific citations (PMID, NCT numbers) when referencing papers or trials.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt },
      ],
      temperature: input.temperature || 0.7,
      max_tokens: 4096,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const responseTimeMs = Date.now() - startTime;

    return {
      provider: 'openai',
      model: 'gpt-4o',
      responseText,
      confidenceScore: extractConfidence(responseText),
      sources: extractSources(responseText),
      tokensUsed: completion.usage?.total_tokens,
      responseTimeMs,
    };
  } catch (error: any) {
    return {
      provider: 'openai',
      model: 'gpt-4o',
      responseText: '',
      responseTimeMs: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

export async function queryGemini(input: QueryInput): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const systemPrompt = input.systemPrompt || 'You are a helpful biotech research assistant.';
    const fullPrompt = `${systemPrompt}\n\n${input.queryText}\n\nProvide your analysis with a confidence score (0-100) at the end. Include specific citations (PMID, NCT numbers) when referencing papers or trials.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();
    const responseTimeMs = Date.now() - startTime;

    return {
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      responseText,
      confidenceScore: extractConfidence(responseText),
      sources: extractSources(responseText),
      responseTimeMs,
    };
  } catch (error: any) {
    return {
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      responseText: '',
      responseTimeMs: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

export async function queryGrok(input: QueryInput): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    // Grok uses OpenAI-compatible API
    const grokClient = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    const systemPrompt = input.systemPrompt || 'You are a helpful biotech research assistant.';
    const fullPrompt = `${input.queryText}\n\nProvide your analysis with a confidence score (0-100) at the end. Include specific citations (PMID, NCT numbers) when referencing papers or trials.`;

    const completion = await grokClient.chat.completions.create({
      model: 'grok-2-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt },
      ],
      temperature: input.temperature || 0.7,
      max_tokens: 4096,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const responseTimeMs = Date.now() - startTime;

    return {
      provider: 'grok',
      model: 'grok-2-latest',
      responseText,
      confidenceScore: extractConfidence(responseText),
      sources: extractSources(responseText),
      tokensUsed: completion.usage?.total_tokens,
      responseTimeMs,
    };
  } catch (error: any) {
    return {
      provider: 'grok',
      model: 'grok-2-latest',
      responseText: '',
      responseTimeMs: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

// Query all LLMs in parallel
export async function queryAllLLMs(input: QueryInput): Promise<LLMResponse[]> {
  const results = await Promise.all([
    queryClaude(input),
    queryOpenAI(input),
    queryGemini(input),
    queryGrok(input),
  ]);

  return results;
}
