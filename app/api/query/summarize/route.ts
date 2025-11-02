import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query_text, responses } = await request.json();

    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses provided' },
        { status: 400 }
      );
    }

    // Build the prompt for Claude to summarize all responses
    const responsesText = responses.map((r: any) =>
      `**${r.provider.toUpperCase()} (${r.model})**${r.confidence ? ` - Confidence: ${r.confidence}%` : ''}\n${r.response}`
    ).join('\n\n---\n\n');

    const summaryPrompt = `You are a research synthesis expert. You have received responses from multiple AI models (Claude, GPT-4, Gemini, and Grok) for the following research query:

**Original Query:** ${query_text}

**Responses from all models:**

${responsesText}

**Your task:**
Synthesize these responses into a single, concise paragraph (3-5 sentences) that:
1. Captures the key consensus points across all models
2. Highlights any unique insights or differing perspectives
3. Presents the most actionable and scientifically sound recommendations
4. Uses clear, professional language suitable for cancer research professionals

Write ONLY the summary paragraph, nothing else. Be direct and factual.`;

    // Call Claude API for summary generation
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: summaryPrompt
        }
      ]
    });

    const summaryText = message.content[0].type === 'text'
      ? message.content[0].text
      : 'Unable to generate summary';

    return NextResponse.json({
      success: true,
      summary: summaryText,
      models_analyzed: responses.length,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens
    });

  } catch (error: any) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate summary',
        details: error.message
      },
      { status: 500 }
    );
  }
}
