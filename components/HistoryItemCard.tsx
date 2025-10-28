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

export default function HistoryItemCard({
  query,
  isExpanded,
  onToggleExpand,
  onDelete,
  onReRun,
}: HistoryItemCardProps) {
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
    } catch (error) {
      console.error('Error fetching query details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getConsensusColor = (level?: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConsensusIcon = (level?: string) => {
    switch (level) {
      case 'high':
        return '✅';
      case 'medium':
        return '⚠️';
      case 'low':
        return '❌';
      default:
        return '❔';
    }
  };

  const getLLMColor = (provider: string) => {
    switch (provider) {
      case 'claude':
        return 'text-claude';
      case 'openai':
        return 'text-openai';
      case 'gemini':
        return 'text-gemini';
      case 'grok':
        return 'text-grok';
      default:
        return 'text-gray-900';
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Exported to ${filename}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Compact View */}
      <div
        onClick={onToggleExpand}
        className="px-6 py-4 cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-start justify-between">
          {/* Left: Query Text and Metadata */}
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center space-x-2 mb-2">
              {/* Workflow Badge */}
              {query.workflow && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {query.workflow.icon} {query.workflow.name}
                </span>
              )}

              {/* Consensus Badge */}
              {query.consensus && (
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getConsensusColor(query.consensus.consensus_level)}`}>
                  {getConsensusIcon(query.consensus.consensus_level)} {query.consensus.consensus_level} consensus
                </span>
              )}

              {/* Status Badge */}
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                query.status === 'completed' ? 'bg-green-100 text-green-800' :
                query.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {query.status}
              </span>
            </div>

            {/* Query Text */}
            <p className="text-gray-900 text-sm line-clamp-2 mb-2">
              {query.query_text}
            </p>

            {/* Metadata */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(query.created_at)}
              </span>

              {query.execution && query.execution.execution_time_seconds && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {query.execution.execution_time_seconds}s
                </span>
              )}

              <span>
                {query.response_count || 0} responses
              </span>
            </div>
          </div>

          {/* Right: Expand Icon */}
          <button className="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
        <div className="border-t border-gray-200 bg-gray-50">
          {loadingDetails ? (
            <div className="px-6 py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading responses...</p>
            </div>
          ) : (
            <>
              {/* Full Query Text */}
              <div className="px-6 py-4 bg-white border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Full Query</h4>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{query.query_text}</p>
              </div>

              {/* LLM Responses */}
              <div className="px-6 py-4">
                <h4 className="text-sm font-medium text-gray-700 mb-4">LLM Responses</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {responses.map((response) => (
                    <div
                      key={response.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h5 className={`text-sm font-semibold capitalize ${getLLMColor(response.llm_provider)}`}>
                          {response.llm_provider}
                        </h5>
                        <span className="text-xs text-gray-500">{response.model_name}</span>
                      </div>

                      {/* Response or Error */}
                      {response.error ? (
                        <div className="text-xs text-red-600 bg-red-50 rounded p-2">
                          Error: {response.error}
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-700 line-clamp-4 mb-3">
                            {response.response_text}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                            {response.confidence_score && (
                              <span>Confidence: {response.confidence_score}%</span>
                            )}
                            <span>{(response.response_time_ms / 1000).toFixed(2)}s</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReRun(query.id);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-run Query
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(query.query_text);
                      alert('Query copied to clipboard!');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Query
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportQuery();
                    }}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(query.id);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
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
