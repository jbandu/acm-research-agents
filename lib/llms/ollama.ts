/**
 * Ollama Local LLM Integration
 *
 * Connects to Ollama running locally (default: http://localhost:11434)
 * Supports all Ollama models: Llama 3.1, Mistral, DeepSeek, etc.
 */

export interface OllamaResponse {
  provider: 'ollama';
  model: string;
  responseText: string;
  confidenceScore?: number;
  tokensUsed?: number;
  responseTimeMs: number;
  error?: string;
  sources: string[];
}

interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Query Ollama local LLM
 */
export async function queryOllama(
  prompt: string,
  systemPrompt?: string
): Promise<OllamaResponse> {
  const startTime = Date.now();

  // Get configuration from environment
  const config: OllamaConfig = {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    temperature: 0.7,
    maxTokens: 4096,
  };

  try {
    // Check if Ollama is running
    try {
      const healthCheck = await fetch(`${config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout for health check
      });

      if (!healthCheck.ok) {
        throw new Error('Ollama server not responding');
      }
    } catch (healthError) {
      throw new Error(
        `Ollama not available at ${config.baseUrl}. ` +
        `Please start Ollama: 'ollama serve' or install from https://ollama.ai`
      );
    }

    // Prepare messages
    const messages = [];
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    messages.push({
      role: 'user',
      content: prompt,
    });

    // Call Ollama API
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
        },
      }),
      signal: AbortSignal.timeout(300000), // 5 minute timeout for complex queries
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseTimeMs = Date.now() - startTime;

    // Extract response
    const responseText = data.message?.content || '';

    if (!responseText) {
      throw new Error('Empty response from Ollama');
    }

    // Calculate confidence score based on response quality
    const confidenceScore = calculateConfidence(responseText, data);

    return {
      provider: 'ollama',
      model: data.model || config.model,
      responseText,
      confidenceScore,
      tokensUsed: (data.eval_count || 0) + (data.prompt_eval_count || 0),
      responseTimeMs,
      sources: ['Ollama Local LLM'],
    };
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;

    console.error('Ollama query error:', error);

    return {
      provider: 'ollama',
      model: config.model,
      responseText: '',
      responseTimeMs,
      error: error.message || 'Unknown error querying Ollama',
      sources: [],
    };
  }
}

/**
 * Calculate confidence score based on response characteristics
 */
function calculateConfidence(responseText: string, data: any): number {
  let confidence = 70; // Base confidence for local models

  // Adjust based on response length (longer = more detailed = higher confidence)
  if (responseText.length > 1000) confidence += 10;
  else if (responseText.length < 200) confidence -= 10;

  // Adjust based on token evaluation metrics if available
  if (data.eval_count && data.prompt_eval_count) {
    const ratio = data.eval_count / (data.prompt_eval_count + data.eval_count);
    if (ratio > 0.7) confidence += 5; // Generated substantial response
  }

  // Check for uncertainty markers
  const uncertaintyMarkers = [
    'I am not sure',
    'I cannot',
    'I do not have',
    'unclear',
    'uncertain',
  ];
  const hasUncertainty = uncertaintyMarkers.some(marker =>
    responseText.toLowerCase().includes(marker.toLowerCase())
  );
  if (hasUncertainty) confidence -= 15;

  // Check for structured response (citations, bullet points, etc.)
  const hasStructure = /\n\s*[-*•]/.test(responseText) || /\d+\.\s/.test(responseText);
  if (hasStructure) confidence += 10;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Get available Ollama models
 */
export async function getOllamaModels(): Promise<string[]> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.models || []).map((m: any) => m.name);
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [];
  }
}

/**
 * Check if Ollama is running and available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
