'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalQueries: number;
  completedQueries: number;
  failedQueries: number;
  avgResponseTime: number;
  consensusBreakdown: {
    high: number;
    medium: number;
    low: number;
    none: number;
  };
  workflowBreakdown: {
    name: string;
    count: number;
    icon?: string;
  }[];
  llmPerformance: {
    provider: string;
    avgConfidence: number;
    avgResponseTime: number;
    errorRate: number;
  }[];
  recentActivity: {
    date: string;
    count: number;
  }[];
}

export default function HistoryAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">Total Queries</div>
          <div className="text-3xl font-bold text-blue-900">{analytics.totalQueries}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-900">{analytics.completedQueries}</div>
          <div className="text-xs text-green-600 mt-1">
            {analytics.totalQueries > 0 ? Math.round((analytics.completedQueries / analytics.totalQueries) * 100) : 0}% success
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm text-orange-600 font-medium mb-1">Avg Response</div>
          <div className="text-3xl font-bold text-orange-900">
            {analytics.avgResponseTime.toFixed(1)}s
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium mb-1">High Consensus</div>
          <div className="text-3xl font-bold text-purple-900">
            {analytics.consensusBreakdown.high}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            {analytics.totalQueries > 0 ? Math.round((analytics.consensusBreakdown.high / analytics.totalQueries) * 100) : 0}% of queries
          </div>
        </div>
      </div>

      {/* Expanded Analytics */}
      {expanded && (
        <>
          {/* Consensus Breakdown */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Consensus Distribution</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-green-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-800">{analytics.consensusBreakdown.high}</div>
                <div className="text-xs text-green-600">High</div>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-800">{analytics.consensusBreakdown.medium}</div>
                <div className="text-xs text-yellow-600">Medium</div>
              </div>
              <div className="bg-orange-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-800">{analytics.consensusBreakdown.low}</div>
                <div className="text-xs text-orange-600">Low</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">{analytics.consensusBreakdown.none}</div>
                <div className="text-xs text-gray-600">None</div>
              </div>
            </div>
          </div>

          {/* Workflow Usage */}
          {analytics.workflowBreakdown.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Workflows</h3>
              <div className="space-y-2">
                {analytics.workflowBreakdown.slice(0, 5).map((workflow, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center">
                      {workflow.icon && <span className="mr-2">{workflow.icon}</span>}
                      <span className="text-sm text-gray-700">{workflow.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-semibold text-gray-900">{workflow.count} queries</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(workflow.count / analytics.totalQueries) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LLM Performance */}
          {analytics.llmPerformance.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">LLM Performance Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Confidence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Response Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.llmPerformance.map((llm, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{llm.provider}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex items-center">
                            <span className="mr-2">{llm.avgConfidence.toFixed(1)}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${llm.avgConfidence}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{llm.avgResponseTime.toFixed(2)}s</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span className={`${llm.errorRate > 10 ? 'text-red-600' : 'text-green-600'} font-medium`}>
                            {llm.errorRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Activity Chart (Simple Bar Chart) */}
          {analytics.recentActivity.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity (Last 7 Days)</h3>
              <div className="flex items-end justify-between h-32 space-x-2">
                {analytics.recentActivity.map((day, idx) => {
                  const maxCount = Math.max(...analytics.recentActivity.map(d => d.count));
                  const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col justify-end h-24">
                        <div
                          className="bg-blue-500 rounded-t"
                          style={{ height: `${heightPercent}%` }}
                          title={`${day.count} queries`}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-xs font-medium text-gray-700">{day.count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
