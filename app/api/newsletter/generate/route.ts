import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

// POST /api/newsletter/generate - Generate weekly newsletter
export async function POST(request: NextRequest) {
  try {
    // Check for authorization
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CRON_SECRET || 'default-cron-secret';

    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting weekly newsletter generation...');

    // Calculate week date range
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStart = weekAgo.toISOString().split('T')[0];
    const weekEnd = today.toISOString().split('T')[0];

    // Get competitors with recent activity
    const competitorsResult = await query(
      `SELECT
        c.*,
        COUNT(DISTINCT cu.id) FILTER (WHERE cu.published_date >= $1) as recent_update_count,
        COUNT(DISTINCT ct.id) as trial_count,
        COUNT(DISTINCT cp.id) as publication_count
       FROM competitors c
       LEFT JOIN competitor_updates cu ON cu.competitor_id = c.id
       LEFT JOIN competitor_trials ct ON ct.competitor_id = c.id
       LEFT JOIN competitor_publications cp ON cp.competitor_id = c.id
       WHERE c.is_active = true
       GROUP BY c.id
       HAVING COUNT(DISTINCT cu.id) FILTER (WHERE cu.published_date >= $1) > 0
          OR c.last_ai_research_date >= $1
       ORDER BY c.threat_level DESC, c.competitive_overlap_score DESC`,
      [weekStart]
    );

    const competitors = competitorsResult.rows;

    // Get recent updates
    const updatesResult = await query(
      `SELECT cu.*, c.name as competitor_name, c.short_name, c.threat_level
       FROM competitor_updates cu
       JOIN competitors c ON c.id = cu.competitor_id
       WHERE cu.published_date >= $1 OR cu.discovered_date >= $1
       ORDER BY cu.impact_level DESC, cu.published_date DESC
       LIMIT 20`,
      [weekStart]
    );

    const updates = updatesResult.rows;

    // Get recent trials
    const trialsResult = await query(
      `SELECT ct.*, c.name as competitor_name, c.short_name, c.threat_level
       FROM competitor_trials ct
       JOIN competitors c ON c.id = ct.competitor_id
       WHERE ct.created_at >= $1 OR ct.updated_at >= $1
       ORDER BY ct.relevance_score DESC
       LIMIT 10`,
      [weekStart]
    );

    const trials = trialsResult.rows;

    // Prepare data summary for Claude
    const dataSummary = {
      week_start: weekStart,
      week_end: weekEnd,
      competitors_with_activity: competitors.length,
      total_updates: updates.length,
      critical_updates: updates.filter((u: any) => u.impact_level === 'critical' || u.impact_level === 'high').length,
      new_trials: trials.length,
      competitors: competitors.slice(0, 10).map((c: any) => ({
        name: c.short_name || c.name,
        threat_level: c.threat_level,
        recent_updates: c.recent_update_count,
        ai_summary: c.ai_summary?.substring(0, 500),
        key_strengths: c.ai_strengths?.slice(0, 2),
        key_threats: c.ai_threats?.slice(0, 2)
      })),
      top_updates: updates.slice(0, 10).map((u: any) => ({
        competitor: u.short_name || u.competitor_name,
        title: u.title,
        description: u.description,
        impact: u.impact_level,
        date: u.published_date
      })),
      key_trials: trials.slice(0, 5).map((t: any) => ({
        competitor: t.short_name || t.competitor_name,
        title: t.trial_title,
        phase: t.phase,
        indication: t.indication,
        relevance: t.relevance_score
      }))
    };

    // Initialize Claude AI
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
    });

    // Generate newsletter content
    const newsletterPrompt = `You are a competitive intelligence analyst for ACM Biolabs. Generate a professional weekly competitive intelligence newsletter for all employees.

**Week:** ${weekStart} to ${weekEnd}

**Data Summary:**
${JSON.stringify(dataSummary, null, 2)}

**Newsletter Requirements:**

1. **Subject Line:** Create an engaging subject line (max 60 chars)

2. **Executive Summary:**
   - Brief overview of the week's key developments (2-3 paragraphs)
   - Highlight critical threats and opportunities
   - Call out any urgent actions needed

3. **Competitor Spotlight:**
   - Feature 3-5 competitors with significant activity
   - For each: brief update, key developments, strategic implications for ACM

4. **Clinical Trial Updates:**
   - Highlight new or updated trials of high relevance
   - Focus on competitive positioning

5. **Strategic Insights:**
   - Key trends emerging in the competitive landscape
   - Recommendations for ACM leadership
   - Areas requiring closer monitoring

6. **Quick Stats:**
   - Number of competitors monitored
   - Critical/high priority updates
   - New trials identified
   - Other relevant metrics

Format the newsletter in **both Markdown and HTML**.

Return your response as a JSON object with this structure:
{
  "subject": "Newsletter subject line",
  "markdown": "Full markdown content",
  "html": "Full HTML content (styled, professional, email-friendly)"
}

Make it concise, actionable, and visually organized. Use emojis sparingly but effectively for section headers.`;

    console.log('Generating newsletter content with Claude AI...');

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      messages: [{ role: 'user', content: newsletterPrompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    let newsletterContent;
    try {
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      newsletterContent = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse newsletter JSON:', parseError);
      // Fallback: create simple structure
      newsletterContent = {
        subject: `ACM Biolabs Competitive Intelligence - Week of ${weekStart}`,
        markdown: responseText,
        html: `<div style="font-family: Arial, sans-serif;">${responseText.replace(/\n/g, '<br>')}</div>`
      };
    }

    // Save newsletter to database
    const newsletterResult = await query(
      `INSERT INTO newsletters (
        subject, content_html, content_markdown,
        week_start_date, week_end_date,
        competitors_covered, updates_included, trials_highlighted,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
      RETURNING *`,
      [
        newsletterContent.subject,
        newsletterContent.html,
        newsletterContent.markdown,
        weekStart,
        weekEnd,
        competitors.length,
        updates.length,
        trials.length
      ]
    );

    const newsletter = newsletterResult.rows[0];

    console.log('Newsletter generated successfully:', newsletter.id);

    return NextResponse.json({
      success: true,
      message: 'Newsletter generated successfully',
      newsletter: {
        id: newsletter.id,
        subject: newsletter.subject,
        week_start: newsletter.week_start_date,
        week_end: newsletter.week_end_date,
        competitors_covered: newsletter.competitors_covered,
        updates_included: newsletter.updates_included,
        trials_highlighted: newsletter.trials_highlighted,
        preview_url: `/newsletter/${newsletter.id}`
      },
      content: newsletterContent
    });
  } catch (error: any) {
    console.error('Newsletter generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/newsletter/generate - List recent newsletters
export async function GET(request: NextRequest) {
  try {
    const result = await query(
      `SELECT
        id, subject, week_start_date, week_end_date,
        competitors_covered, updates_included, trials_highlighted,
        status, sent_at, recipient_count, created_at
       FROM newsletters
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return NextResponse.json({
      success: true,
      newsletters: result.rows
    });
  } catch (error: any) {
    console.error('GET /api/newsletter/generate error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
