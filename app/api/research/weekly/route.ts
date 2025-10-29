import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

// POST /api/research/weekly - Trigger weekly research for all competitors
export async function POST(request: NextRequest) {
  try {
    // Check for authorization (simple API key check)
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CRON_SECRET || 'default-cron-secret';

    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting weekly competitor research job...');

    // Get all active competitors
    const competitorsResult = await query(
      `SELECT id, name, short_name, website_url, primary_focus, technology_platforms, strategic_notes, last_ai_research_date
       FROM competitors
       WHERE is_active = true
       ORDER BY threat_level DESC, competitive_overlap_score DESC`
    );

    const competitors = competitorsResult.rows;
    console.log(`Found ${competitors.length} active competitors to research`);

    // Initialize Claude AI
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
    });

    const results = {
      total: competitors.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      researched: [] as string[]
    };

    // Research each competitor (limit concurrent requests)
    for (const comp of competitors) {
      try {
        console.log(`Researching ${comp.name}...`);

        // Create research prompt
        const researchPrompt = `You are a competitive intelligence analyst for ACM Biolabs, a biotech company developing mRNA-based cancer immunotherapies, particularly TLR9 agonists delivered intramuscularly.

Your task is to research and provide a comprehensive competitive intelligence report on:

**Company:** ${comp.name}
**Website:** ${comp.website_url || 'N/A'}
**Current Focus Areas:** ${comp.primary_focus?.join(', ') || 'Unknown'}
**Technology Platforms:** ${comp.technology_platforms?.join(', ') || 'Unknown'}
**Strategic Notes:** ${comp.strategic_notes || 'None'}
**Last Research:** ${comp.last_ai_research_date ? new Date(comp.last_ai_research_date).toLocaleDateString() : 'Never'}

Please provide a detailed analysis in the following JSON format:

{
  "summary": "2-3 paragraph executive summary of the company's current status, recent developments, and strategic direction",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "opportunities": ["opportunity for ACM 1", "opportunity 2"],
  "threats": ["competitive threat to ACM 1", "threat 2"],
  "recent_developments": [
    {
      "title": "Development title",
      "description": "Description",
      "date": "YYYY-MM-DD",
      "impact": "high|medium|low",
      "source": "Source"
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
      "trial_name": "Trial name",
      "phase": "Phase X",
      "indication": "Disease",
      "status": "Status",
      "relevance": "Why this matters to ACM"
    }
  ],
  "strategic_recommendations": "What should ACM monitor, consider, or do in response"
}

Focus on developments since the last research date if available. Be thorough and provide actionable intelligence.`;

        // Call Claude AI
        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{ role: 'user', content: researchPrompt }]
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

        // Parse JSON response
        let researchData;
        try {
          const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/);
          const jsonText = jsonMatch ? jsonMatch[1] : responseText;
          researchData = JSON.parse(jsonText);
        } catch (parseError) {
          researchData = {
            summary: responseText,
            raw_response: true
          };
        }

        // Update competitor with AI research
        await query(
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
           WHERE id = $8`,
          [
            researchData.summary || null,
            researchData.strengths || null,
            researchData.weaknesses || null,
            researchData.opportunities || null,
            researchData.threats || null,
            researchData.pipeline_updates ? JSON.stringify(researchData.pipeline_updates) : null,
            JSON.stringify(researchData),
            comp.id
          ]
        );

        // Add recent developments as competitor updates
        if (researchData.recent_developments && Array.isArray(researchData.recent_developments)) {
          for (const dev of researchData.recent_developments.slice(0, 3)) {
            await query(
              `INSERT INTO competitor_updates
               (competitor_id, update_type, title, description, impact_level, published_date, source_name)
               VALUES ($1, 'other', $2, $3, $4, $5, $6)
               ON CONFLICT DO NOTHING`,
              [
                comp.id,
                dev.title,
                dev.description,
                dev.impact || 'medium',
                dev.date || null,
                dev.source || 'AI Research'
              ]
            );
          }
        }

        results.successful++;
        results.researched.push(comp.name);
        console.log(`✓ Successfully researched ${comp.name}`);

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        console.error(`✗ Failed to research ${comp.name}:`, error.message);
        results.failed++;
        results.errors.push(`${comp.name}: ${error.message}`);
      }
    }

    // Create a research job record
    await query(
      `INSERT INTO research_jobs (job_type, status, results, completed_at, scheduled_for)
       VALUES ('competitor_research', 'completed', $1, NOW(), NOW())`,
      [JSON.stringify(results)]
    );

    console.log('Weekly competitor research job completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Weekly research completed',
      results
    });
  } catch (error: any) {
    console.error('Weekly research job error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/research/weekly - Get status of weekly research jobs
export async function GET(request: NextRequest) {
  try {
    const result = await query(
      `SELECT *
       FROM research_jobs
       WHERE job_type = 'competitor_research'
       ORDER BY created_at DESC
       LIMIT 10`
    );

    return NextResponse.json({
      success: true,
      jobs: result.rows
    });
  } catch (error: any) {
    console.error('GET /api/research/weekly error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
