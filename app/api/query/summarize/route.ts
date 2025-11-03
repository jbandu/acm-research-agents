import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '@/lib/db';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query_id, query_text, responses, workflow_name, company_context } = await request.json();

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
    const summaryMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: summaryPrompt
        }
      ]
    });

    const summaryText = summaryMessage.content[0].type === 'text'
      ? summaryMessage.content[0].text
      : 'Unable to generate summary';

    // Generate follow-up questions (similar to Perplexity)
    const followupPrompt = `You are a research strategy expert. Based on the original query and all AI responses, generate 4-5 high-value follow-up questions that would deepen the researcher's understanding.

**Original Query:** ${query_text}
${workflow_name ? `**Workflow Context:** ${workflow_name}` : ''}
${company_context ? `**Company Context:** ${company_context}` : ''}

**AI Responses Summary:**
${summaryText}

**Your task:**
Generate 4-5 follow-up questions that:
1. Explore critical aspects not fully addressed in the responses
2. Challenge assumptions or request validation
3. Dive deeper into promising areas
4. Consider alternative perspectives or approaches
5. Are specific, actionable, and directly relevant to cancer research

Format your response as a JSON array with this structure:
[
  {
    "question": "The specific follow-up question text",
    "rationale": "Why this question is valuable (1 sentence)",
    "category": "clarification|deep-dive|alternative|validation"
  }
]

Return ONLY valid JSON, no other text.`;

    const followupMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: followupPrompt
        }
      ]
    });

    const followupText = followupMessage.content[0].type === 'text'
      ? followupMessage.content[0].text
      : '[]';

    let followupQuestions = [];
    try {
      followupQuestions = JSON.parse(followupText);
    } catch (parseError) {
      console.error('Failed to parse follow-up questions JSON:', parseError);
      followupQuestions = [];
    }

    // Store summary in database if query_id provided
    if (query_id) {
      try {
        await query(
          `INSERT INTO ai_summaries (query_id, summary_text, models_analyzed, tokens_used, confidence_level)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (query_id) DO UPDATE
           SET summary_text = EXCLUDED.summary_text,
               models_analyzed = EXCLUDED.models_analyzed,
               tokens_used = EXCLUDED.tokens_used,
               confidence_level = EXCLUDED.confidence_level`,
          [
            query_id,
            summaryText,
            responses.length,
            summaryMessage.usage.input_tokens + summaryMessage.usage.output_tokens + followupMessage.usage.input_tokens + followupMessage.usage.output_tokens,
            responses.length >= 3 ? 'high' : responses.length >= 2 ? 'medium' : 'low'
          ]
        );

        // Store follow-up questions
        for (let i = 0; i < followupQuestions.length; i++) {
          const fq = followupQuestions[i];
          await query(
            `INSERT INTO followup_questions (query_id, question_text, rationale, category, position)
             VALUES ($1, $2, $3, $4, $5)`,
            [query_id, fq.question, fq.rationale, fq.category, i + 1]
          );
        }
      } catch (dbError) {
        console.error('Database storage error:', dbError);
        // Continue even if DB storage fails
      }
    }

    return NextResponse.json({
      success: true,
      summary: summaryText,
      followup_questions: followupQuestions,
      models_analyzed: responses.length,
      tokens_used: summaryMessage.usage.input_tokens + summaryMessage.usage.output_tokens + followupMessage.usage.input_tokens + followupMessage.usage.output_tokens
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
