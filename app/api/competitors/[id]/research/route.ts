import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

// POST /api/competitors/[id]/research - Trigger AI research on a competitor
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get competitor details
    const competitorResult = await query(
      'SELECT * FROM competitors WHERE id = $1',
      [id]
    );

    if (competitorResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Competitor not found' },
        { status: 404 }
      );
    }

    const competitor = competitorResult.rows[0];

    // Initialize Claude AI
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
    });

    // Create research prompt
    const researchPrompt = `You are a competitive intelligence analyst for ACM Biolabs, a biotech company developing mRNA-based cancer immunotherapies, particularly TLR9 agonists delivered intramuscularly.

Your task is to research and provide a comprehensive competitive intelligence report on:

**Company:** ${competitor.name}
**Website:** ${competitor.website_url || 'N/A'}
**Current Focus Areas:** ${competitor.primary_focus?.join(', ') || 'Unknown'}
**Technology Platforms:** ${competitor.technology_platforms?.join(', ') || 'Unknown'}
**Strategic Notes:** ${competitor.strategic_notes || 'None'}

Please provide a detailed analysis in the following JSON format:

{
  "summary": "2-3 paragraph executive summary of the company's current status, recent developments, and strategic direction",
  "strengths": ["strength 1", "strength 2", "strength 3", "..."],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3", "..."],
  "opportunities": ["opportunity for ACM (partnership, differentiation, etc.) 1", "opportunity 2", "..."],
  "threats": ["competitive threat to ACM 1", "threat 2", "..."],
  "recent_developments": [
    {
      "title": "Recent development title",
      "description": "Description of the development",
      "date": "YYYY-MM-DD",
      "impact": "high|medium|low",
      "source": "Source of information"
    }
  ],
  "pipeline_updates": {
    "preclinical": number,
    "phase1": number,
    "phase2": number,
    "phase3": number,
    "approved": number
  },
  "key_trials": [
    {
      "trial_name": "Trial name or identifier",
      "phase": "Phase X",
      "indication": "Disease/indication",
      "status": "Active/Recruiting/Completed/etc",
      "relevance": "Why this matters to ACM"
    }
  ],
  "strategic_recommendations": "What should ACM monitor, consider, or do in response to this competitor"
}

Focus on:
1. Recent clinical trial results and new trial initiations
2. FDA approvals or regulatory milestones
3. Partnerships, collaborations, or M&A activity
4. Publications or conference presentations
5. Technology advancements
6. Financial health and funding
7. Market positioning and strategy
8. Direct competitive overlap with ACM's TLR9 agonist and mRNA platforms

Be thorough, objective, and provide actionable intelligence. Use your knowledge cutoff date as reference, but note that you're analyzing based on available information up to that point.`;

    console.log(`Starting AI research for competitor: ${competitor.name}`);

    // Call Claude AI
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: researchPrompt
        }
      ]
    });

    // Extract the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the JSON response
    let researchData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      researchData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: store raw response
      researchData = {
        summary: responseText,
        raw_response: true
      };
    }

    // Update competitor with AI research
    const updateResult = await query(
      `UPDATE competitors
       SET
         ai_summary = $1,
         ai_strengths = $2,
         ai_weaknesses = $3,
         ai_opportunities = $4,
         ai_threats = $5,
         pipeline_stage = COALESCE($6, pipeline_stage),
         research_data = $7,
         last_ai_research_date = NOW(),
         updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        researchData.summary || null,
        researchData.strengths || null,
        researchData.weaknesses || null,
        researchData.opportunities || null,
        researchData.threats || null,
        researchData.pipeline_updates ? JSON.stringify(researchData.pipeline_updates) : null,
        JSON.stringify(researchData),
        id
      ]
    );

    // Optionally add recent developments as competitor updates
    if (researchData.recent_developments && Array.isArray(researchData.recent_developments)) {
      for (const dev of researchData.recent_developments.slice(0, 5)) { // Limit to 5 most important
        await query(
          `INSERT INTO competitor_updates
           (competitor_id, update_type, title, description, impact_level, published_date, source_name)
           VALUES ($1, 'other', $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [
            id,
            dev.title,
            dev.description,
            dev.impact || 'medium',
            dev.date || null,
            dev.source || 'AI Research'
          ]
        );
      }
    }

    // Optionally add key trials
    if (researchData.key_trials && Array.isArray(researchData.key_trials)) {
      for (const trial of researchData.key_trials.slice(0, 5)) { // Limit to 5 most relevant
        await query(
          `INSERT INTO competitor_trials
           (competitor_id, trial_title, phase, status, indication, competitive_notes, relevance_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
          [
            id,
            trial.trial_name,
            trial.phase,
            trial.status,
            trial.indication,
            trial.relevance,
            85 // High relevance since AI selected it
          ]
        );
      }
    }

    console.log(`AI research completed for competitor: ${competitor.name}`);

    return NextResponse.json({
      success: true,
      competitor: updateResult.rows[0],
      research_data: researchData,
      tokens_used: message.usage
    });
  } catch (error: any) {
    console.error('POST /api/competitors/[id]/research error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
