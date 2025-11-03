'use client';

import { useState, useEffect } from 'react';
import { QueryWithDetails, LLMResponse } from '@/types/history';

interface HistoryItemCardProps {
  query: QueryWithDetails;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: (queryId: string) => void;
  onReRun: (queryId: string) => void;
}

const LLM_CONFIGS = {
  claude: {
    name: 'Claude',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    icon: '🤖',
  },
  openai: {
    name: 'GPT-4',
    color: 'from-green-500 to-teal-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    icon: '🧠',
  },
  gemini: {
    name: 'Gemini',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: '💎',
  },
  grok: {
    name: 'Grok',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    icon: '⚡',
  },
  ollama: {
    name: 'Llama (Local)',
    color: 'from-indigo-500 to-violet-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    icon: '🦙',
  },
};

export default function HistoryItemCard({
  query,
  isExpanded,
  onToggleExpand,
  onDelete,
  onReRun,
}: HistoryItemCardProps) {
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [patents, setPatents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [followupQuestions, setFollowupQuestions] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded && responses.length === 0) {
      fetchDetails();
    }
  }, [isExpanded]);

  const fetchDetails = async () => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/history/${query.id}`);
      const data = await response.json();
      setResponses(data.responses || []);
      setPatents(data.patents || []);
      setSummary(data.summary || null);
      setFollowupQuestions(data.followup_questions || []);
    } catch (error) {
      console.error('Error fetching query details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getConsensusColor = (level?: string) => {
    switch (level) {
      case 'high':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'low':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportQuery = () => {
    if (responses.length === 0) {
      alert('No responses to export. Expand the query first to load responses.');
      return;
    }

    const exportData = {
      query_id: query.id,
      query_text: query.query_text,
      workflow: query.workflow?.name || 'Generic',
      created_at: query.created_at,
      status: query.status,
      consensus: query.consensus,
      execution_time_seconds: query.execution?.execution_time_seconds,
      responses: responses.map(r => ({
        provider: r.llm_provider,
        model: r.model_name,
        response: r.response_text,
        confidence_score: r.confidence_score,
        sources: r.sources,
        tokens_used: r.tokens_used,
        response_time_ms: r.response_time_ms,
        error: r.error
      }))
    };

    // Export format selection
    const format = prompt('Export format?\n1. JSON (full data)\n2. Markdown (readable)\n3. CSV (tabular)\n\nEnter 1, 2, or 3:');

    if (!format) return;

    let blob: Blob;
    let filename: string;

    switch(format) {
      case '1': // JSON
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `query-${query.id}.json`;
        break;

      case '2': // Markdown
        let markdown = `# Research Query Results\n\n`;
        markdown += `**Query:** ${query.query_text}\n\n`;
        markdown += `**Workflow:** ${exportData.workflow}\n`;
        markdown += `**Created:** ${formatDate(query.created_at)}\n`;
        markdown += `**Status:** ${query.status}\n\n`;

        if (query.consensus) {
          markdown += `## Consensus\n\n`;
          markdown += `- **Level:** ${query.consensus.consensus_level}\n\n`;
        }

        markdown += `## Responses\n\n`;
        responses.forEach(r => {
          markdown += `### ${r.llm_provider.toUpperCase()} - ${r.model_name}\n\n`;
          if (r.error) {
            markdown += `**Error:** ${r.error}\n\n`;
          } else {
            markdown += `${r.response_text}\n\n`;
            markdown += `**Metadata:**\n`;
            if (r.confidence_score) markdown += `- Confidence: ${r.confidence_score}%\n`;
            markdown += `- Response Time: ${(r.response_time_ms / 1000).toFixed(2)}s\n`;
            if (r.tokens_used) markdown += `- Tokens: ${r.tokens_used.toLocaleString()}\n`;
            markdown += `\n`;
          }
          markdown += `---\n\n`;
        });

        blob = new Blob([markdown], { type: 'text/markdown' });
        filename = `query-${query.id}.md`;
        break;

      case '3': // CSV
        let csv = 'Provider,Model,Confidence,ResponseTime(s),Tokens,Response,Error\n';
        responses.forEach(r => {
          const row = [
            r.llm_provider,
            r.model_name,
            r.confidence_score || '',
            (r.response_time_ms / 1000).toFixed(2),
            r.tokens_used || '',
            `"${(r.response_text || '').replace(/"/g, '""').substring(0, 500)}..."`,
            r.error || ''
          ];
          csv += row.join(',') + '\n';
        });

        blob = new Blob([csv], { type: 'text/csv' });
        filename = `query-${query.id}.csv`;
        break;

      default:
        alert('Invalid format selected');
        return;
    }

    // Download
    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Exported to ${filename}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Compact View - Header */}
      <div
        onClick={onToggleExpand}
        className="px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Query info */}
          <div className="flex-1 min-w-0">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Workflow Badge */}
              {query.workflow && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                  <span className="mr-1">{query.workflow.icon}</span>
                  {query.workflow.name}
                </span>
              )}

              {/* Consensus Badge */}
              {query.consensus && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm ${getConsensusColor(query.consensus.consensus_level)}`}>
                  {query.consensus.consensus_level === 'high' && '✅'}
                  {query.consensus.consensus_level === 'medium' && '⚠️'}
                  {query.consensus.consensus_level === 'low' && '❌'}
                  <span className="ml-1 capitalize">{query.consensus.consensus_level} Consensus</span>
                </span>
              )}

              {/* Status Badge */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                query.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : query.status === 'processing'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {query.status === 'completed' && '✓'}
                {query.status === 'processing' && '⏳'}
                {query.status === 'failed' && '✗'}
                <span className="ml-1 capitalize">{query.status}</span>
              </span>

              {/* Response Count Badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                💬 {query.response_count || 0} Responses
              </span>
            </div>

            {/* Query Text */}
            <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 leading-relaxed">
              {query.query_text}
            </h3>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(query.created_at)}
              </span>

              {query.execution && query.execution.execution_time_seconds && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {query.execution.execution_time_seconds.toFixed(1)}s
                </span>
              )}
            </div>
          </div>

          {/* Right side - Expand button */}
          <button className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 transition-colors">
            <svg
              className={`w-5 h-5 text-gray-600 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          {loadingDetails ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-600 font-medium">Loading responses...</p>
            </div>
          ) : (
            <>
              {/* Full Query Text */}
              <div className="px-6 py-5 bg-white border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  Full Query
                </h4>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {query.query_text}
                </p>
              </div>

              {/* LLM Responses Grid */}
              <div className="px-6 py-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="text-lg">🤝</span>
                  AI Model Responses ({responses.length})
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {responses.map((response) => {
                    const config = LLM_CONFIGS[response.llm_provider as keyof typeof LLM_CONFIGS];
                    const isResponseExpanded = expandedResponse === response.id;

                    return (
                      <div
                        key={response.id}
                        className={`${config.bgColor} border-2 ${config.borderColor} rounded-xl p-5 transition-all duration-300 hover:shadow-md`}
                      >
                        {/* Response Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{config.icon}</span>
                            <div>
                              <h5 className={`text-sm font-bold ${config.textColor}`}>
                                {config.name}
                              </h5>
                              <p className="text-xs text-gray-600">{response.model_name}</p>
                            </div>
                          </div>

                          {response.confidence_score && (
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-600 mb-1">Confidence</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${config.color} transition-all duration-500`}
                                    style={{ width: `${response.confidence_score}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${config.textColor}`}>
                                  {response.confidence_score}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Error or Response */}
                        {response.error ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs text-red-700 font-medium">❌ Error: {response.error}</p>
                          </div>
                        ) : (
                          <>
                            {/* Response Text */}
                            <div className={`text-sm text-gray-800 leading-relaxed ${isResponseExpanded ? '' : 'line-clamp-4'} mb-3`}>
                              {response.response_text}
                            </div>

                            {/* Expand/Collapse Button */}
                            {response.response_text.length > 200 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedResponse(isResponseExpanded ? null : response.id);
                                }}
                                className={`text-xs font-medium ${config.textColor} hover:underline flex items-center gap-1`}
                              >
                                {isResponseExpanded ? '▼ Show Less' : '▶ Read More'}
                              </button>
                            )}

                            {/* Response Stats */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                {response.tokens_used && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                    {response.tokens_used.toLocaleString()} tokens
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {(response.response_time_ms / 1000).toFixed(2)}s
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI-Generated Summary */}
              {summary && (
                <div className="px-6 py-6 bg-gradient-to-br from-acm-blue-lightest to-white border-t border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-acm-brand to-acm-brand-dark flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-white text-2xl">🤖</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">AI-Generated Summary</h4>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{summary.summary_text}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {summary.models_analyzed} models analyzed
                        </span>
                        {summary.confidence_level && (
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            summary.confidence_level === 'high' ? 'bg-green-100 text-green-800' :
                            summary.confidence_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {summary.confidence_level} confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Follow-Up Questions (Perplexity-style) */}
              {followupQuestions && followupQuestions.length > 0 && (
                <div className="px-6 py-6 bg-white border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">💡</span>
                    <h4 className="text-sm font-semibold text-gray-700">Suggested Follow-Up Questions</h4>
                  </div>
                  <div className="space-y-3">
                    {followupQuestions.map((fq, index) => (
                      <button
                        key={fq.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof window !== 'undefined') {
                            window.location.href = `/query?prefill=${encodeURIComponent(fq.question_text)}&source=followup&original_query=${query.id}&followup_id=${fq.id}`;
                          }
                        }}
                        className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-acm-brand hover:bg-acm-blue-lightest transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-acm-brand text-white text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-acm-brand mb-1">
                              {fq.question_text}
                            </p>
                            {fq.rationale && (
                              <p className="text-xs text-gray-600">{fq.rationale}</p>
                            )}
                            {fq.category && (
                              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                fq.category === 'deep-dive' ? 'bg-blue-100 text-blue-700' :
                                fq.category === 'clarification' ? 'bg-purple-100 text-purple-700' :
                                fq.category === 'alternative' ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {fq.category}
                              </span>
                            )}
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-acm-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Patent Intelligence */}
              {patents && patents.length > 0 && (
                <div className="px-6 py-6 bg-gradient-to-br from-amber-50 to-white border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">📄</span>
                    <h4 className="text-sm font-semibold text-gray-700">Relevant Patents ({patents.length})</h4>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {patents.slice(0, 6).map((patent) => (
                      <a
                        key={patent.id}
                        href={patent.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-white rounded-lg border-2 border-amber-200 hover:border-acm-gold hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-mono font-semibold text-acm-gold group-hover:text-acm-gold">
                            {patent.patent_number}
                          </span>
                          {patent.relevance_score && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">
                              {patent.relevance_score}% match
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-acm-gold">
                          {patent.title}
                        </h5>
                        {patent.abstract && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{patent.abstract}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{patent.assignee || 'Unknown'}</span>
                          {patent.publication_date && (
                            <span>{new Date(patent.publication_date).getFullYear()}</span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                  {patents.length > 6 && (
                    <p className="text-xs text-gray-600 mt-3 text-center">
                      + {patents.length - 6} more patents
                    </p>
                  )}
                </div>
              )}

              {/* Actions Bar */}
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReRun(query.id);
                    }}
                    className="inline-flex items-center px-4 py-2 border-2 border-purple-300 rounded-lg text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-run Query
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof window !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(query.query_text);
                        alert('Query copied to clipboard!');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this query?')) {
                      onDelete(query.id);
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border-2 border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
