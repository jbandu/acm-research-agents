import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Total queries
    const totalResult = await query('SELECT COUNT(*) as count FROM queries');
    const totalQueries = parseInt(totalResult.rows[0]?.count || '0');

    // Completed queries
    const completedResult = await query(
      "SELECT COUNT(*) as count FROM queries WHERE status = 'completed'"
    );
    const completedQueries = parseInt(completedResult.rows[0]?.count || '0');

    // Failed queries
    const failedResult = await query(
      "SELECT COUNT(*) as count FROM queries WHERE status = 'failed'"
    );
    const failedQueries = parseInt(failedResult.rows[0]?.count || '0');

    // Average response time
    const avgTimeResult = await query(`
      SELECT AVG(response_time_ms) as avg_time
      FROM llm_responses
      WHERE error IS NULL
    `);
    const avgResponseTime = parseFloat(avgTimeResult.rows[0]?.avg_time || '0') / 1000;

    // Consensus breakdown
    const consensusResult = await query(`
      SELECT
        COALESCE(cr.consensus_level, 'none') as level,
        COUNT(*) as count
      FROM queries q
      LEFT JOIN consensus_results cr ON cr.query_id = q.id
      GROUP BY cr.consensus_level
    `);

    const consensusBreakdown = {
      high: 0,
      medium: 0,
      low: 0,
      none: 0
    };

    consensusResult.rows.forEach(row => {
      const level = row.level || 'none';
      consensusBreakdown[level as keyof typeof consensusBreakdown] = parseInt(row.count);
    });

    // Workflow breakdown
    const workflowResult = await query(`
      SELECT
        w.name,
        w.icon,
        COUNT(q.id) as count
      FROM queries q
      LEFT JOIN workflows w ON w.id = q.workflow_id
      WHERE q.workflow_id IS NOT NULL
      GROUP BY w.id, w.name, w.icon
      ORDER BY count DESC
      LIMIT 10
    `);

    const workflowBreakdown = workflowResult.rows.map(row => ({
      name: row.name,
      icon: row.icon,
      count: parseInt(row.count)
    }));

    // LLM Performance
    const llmPerformanceResult = await query(`
      SELECT
        llm_provider,
        AVG(CASE WHEN confidence_score IS NOT NULL THEN confidence_score ELSE 0 END) as avg_confidence,
        AVG(response_time_ms) as avg_time,
        (COUNT(CASE WHEN error IS NOT NULL THEN 1 END)::float / COUNT(*)::float * 100) as error_rate
      FROM llm_responses
      GROUP BY llm_provider
      ORDER BY llm_provider
    `);

    const llmPerformance = llmPerformanceResult.rows.map(row => ({
      provider: row.llm_provider,
      avgConfidence: parseFloat(row.avg_confidence || '0'),
      avgResponseTime: parseFloat(row.avg_time || '0') / 1000,
      errorRate: parseFloat(row.error_rate || '0')
    }));

    // Recent activity (last 7 days)
    const recentActivityResult = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM queries
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Fill in missing dates with 0
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = recentActivityResult.rows.find(
        row => row.date && new Date(row.date).toISOString().split('T')[0] === dateStr
      );

      recentActivity.push({
        date: dateStr,
        count: dayData ? parseInt(dayData.count) : 0
      });
    }

    return NextResponse.json({
      totalQueries,
      completedQueries,
      failedQueries,
      avgResponseTime,
      consensusBreakdown,
      workflowBreakdown,
      llmPerformance,
      recentActivity
    });
  } catch (error: any) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
