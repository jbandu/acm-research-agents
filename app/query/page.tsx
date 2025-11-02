'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ContextLevelSelector } from '@/components/ContextLevelSelector';
import { DataSourceSelector } from '@/components/DataSourceSelector';
import { CostEstimator } from '@/components/CostEstimator';

interface LLMResponse {
  provider: 'claude' | 'openai' | 'gemini' | 'grok';
  model: string;
  responseText: string;
  confidenceScore?: number;
  sources?: string[];
  tokensUsed?: number;
  responseTimeMs: number;
  error?: string;
}

interface Workflow {
  id: string;
  name: string;
  system_prompt?: string;
}

function QueryPageContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams?.get('workflow');

  const [queryText, setQueryText] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>(workflowId || '');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [queryId, setQueryId] = useState<string>('');
  const [consensus, setConsensus] = useState<any>(null);
  const [cached, setCached] = useState(false);

  // New features state
  const [contextLevel, setContextLevel] = useState<'minimal' | 'standard' | 'deep'>('standard');
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Summary state
  const [summary, setSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const handleQuery = async () => {
    if (!queryText.trim()) {
      alert('Please enter a query');
      return;
    }

    setLoading(true);
    setResponses([]);
    setConsensus(null);
    setCached(false);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_text: queryText,
          workflow_id: selectedWorkflow || null,
          context_level: contextLevel,
          data_sources: selectedDataSources.length > 0 ? selectedDataSources : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
        return;
      }

      setQueryId(data.query_id);
      setResponses(data.responses || []);
      setConsensus(data.consensus || null);
      setCached(data.cached || false);

      // Generate summary after responses are received
      if (data.responses && data.responses.length > 0) {
        generateSummary(data.responses, queryText);
      }
    } catch (error: any) {
      console.error('Query error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (llmResponses: LLMResponse[], query: string) => {
    setSummaryLoading(true);
    setSummary('');

    try {
      const response = await fetch('/api/query/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_text: query,
          responses: llmResponses.filter(r => !r.error).map(r => ({
            provider: r.provider,
            model: r.model,
            response: r.responseText,
            confidence: r.confidenceScore
          }))
        }),
      });

      const data = await response.json();

      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (error: any) {
      console.error('Summary generation error:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const getLLMCardClass = (provider: string) => {
    const baseClass = 'llm-card ';
    switch (provider) {
      case 'claude':
        return baseClass + 'llm-card-claude';
      case 'openai':
        return baseClass + 'llm-card-openai';
      case 'gemini':
        return baseClass + 'llm-card-gemini';
      case 'grok':
        return baseClass + 'llm-card-grok';
      default:
        return baseClass;
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

  const getLLMBgColor = (provider: string) => {
    switch (provider) {
      case 'claude':
        return 'bg-claude';
      case 'openai':
        return 'bg-openai';
      case 'gemini':
        return 'bg-gemini';
      case 'grok':
        return 'bg-grok';
      default:
        return 'bg-gray-500';
    }
  };

  const exportAllResponses = () => {
    if (responses.length === 0) {
      alert('No responses to export');
      return;
    }

    const exportData = {
      query_id: queryId,
      query_text: queryText,
      workflow: selectedWorkflow ? workflows.find(w => w.id === selectedWorkflow)?.name : 'Generic',
      context_level: contextLevel,
      exported_at: new Date().toISOString(),
      consensus: consensus,
      responses: responses.map(r => ({
        provider: r.provider,
        model: r.model,
        response: r.responseText,
        confidence_score: r.confidenceScore,
        sources: r.sources,
        tokens_used: r.tokensUsed,
        response_time_seconds: (r.responseTimeMs / 1000).toFixed(2),
        error: r.error
      }))
    };

    // Create download options menu
    const format = prompt('Export format?\n1. JSON (full data)\n2. Markdown (readable)\n3. CSV (tabular)\n\nEnter 1, 2, or 3:');

    if (!format) return;

    let blob: Blob;
    let filename: string;

    switch(format) {
      case '1': // JSON
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `query-${queryId || 'export'}.json`;
        break;

      case '2': // Markdown
        let markdown = `# Research Query Results\n\n`;
        markdown += `**Query:** ${queryText}\n\n`;
        markdown += `**Workflow:** ${exportData.workflow}\n`;
        markdown += `**Context Level:** ${contextLevel}\n`;
        markdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;

        if (consensus) {
          markdown += `## Consensus\n\n`;
          markdown += `- **Level:** ${consensus.consensusLevel}\n`;
          markdown += `- **Has Consensus:** ${consensus.hasConsensus ? 'Yes' : 'No'}\n`;
          if (consensus.conflictingProviders?.length > 0) {
            markdown += `- **Conflicting:** ${consensus.conflictingProviders.join(', ')}\n`;
          }
          markdown += `\n`;
        }

        markdown += `## Responses\n\n`;
        responses.forEach(r => {
          markdown += `### ${r.provider.toUpperCase()} - ${r.model}\n\n`;
          if (r.error) {
            markdown += `**Error:** ${r.error}\n\n`;
          } else {
            markdown += `${r.responseText}\n\n`;
            markdown += `**Metadata:**\n`;
            if (r.confidenceScore) markdown += `- Confidence: ${r.confidenceScore}%\n`;
            markdown += `- Response Time: ${(r.responseTimeMs / 1000).toFixed(2)}s\n`;
            if (r.tokensUsed) markdown += `- Tokens: ${r.tokensUsed.toLocaleString()}\n`;
            if (r.sources && r.sources.length > 0) markdown += `- Sources: ${r.sources.join(', ')}\n`;
            markdown += `\n`;
          }
          markdown += `---\n\n`;
        });

        blob = new Blob([markdown], { type: 'text/markdown' });
        filename = `query-${queryId || 'export'}.md`;
        break;

      case '3': // CSV
        let csv = 'Provider,Model,Confidence,ResponseTime(s),Tokens,Response,Error\n';
        responses.forEach(r => {
          const row = [
            r.provider,
            r.model,
            r.confidenceScore || '',
            (r.responseTimeMs / 1000).toFixed(2),
            r.tokensUsed || '',
            `"${(r.responseText || '').replace(/"/g, '""').substring(0, 500)}..."`,
            r.error || ''
          ];
          csv += row.join(',') + '\n';
        });

        blob = new Blob([csv], { type: 'text/csv' });
        filename = `query-${queryId || 'export'}.csv`;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">New Research Query</h1>

      {/* Input Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Workflow (Optional)
          </label>
          <select
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- No workflow (generic query) --</option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Query
          </label>
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your research question here. Example: What is the optimal dosing schedule for combining TLR9 agonists with checkpoint inhibitors in bladder cancer?"
          />
        </div>

        {/* Advanced Options Toggle */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options (Context, Data Sources, Cost Estimate)
          </button>
        </div>

        {/* Advanced Options Panel */}
        {showAdvanced && (
          <div className="space-y-6 mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            {/* Context Level Selector */}
            <div>
              <ContextLevelSelector
                selectedLevel={contextLevel}
                onChange={setContextLevel}
                showPreview={true}
              />
            </div>

            {/* Data Source Selector - Only show if workflow is selected */}
            {selectedWorkflow && (
              <div>
                <DataSourceSelector
                  workflowId={selectedWorkflow}
                  selectedSources={selectedDataSources}
                  onChange={setSelectedDataSources}
                />
              </div>
            )}

            {/* Cost Estimator - Show if we have query + (workflow with sources OR no workflow) */}
            {queryText && (selectedWorkflow ? selectedDataSources.length > 0 : true) && (
              <div>
                <CostEstimator
                  workflowId={selectedWorkflow || 'generic'}
                  userQuery={queryText}
                  selectedDataSources={selectedDataSources}
                  contextLevel={contextLevel}
                  onConfirm={handleQuery}
                />
              </div>
            )}
          </div>
        )}

        {/* Run Query Button - Show if advanced options are hidden */}
        {!showAdvanced && (
          <button
            onClick={handleQuery}
            disabled={loading || !queryText.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Querying All LLMs...' : 'Run Query'}
          </button>
        )}
      </div>

      {/* Consensus Indicator */}
      {consensus && !loading && (
        <div className={`mb-8 p-4 rounded-lg ${
          consensus.hasConsensus
            ? consensus.consensusLevel === 'high'
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
            : 'bg-orange-50 border border-orange-200'
        }`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {consensus.hasConsensus ? '✅' : '⚠️'}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900">
                {consensus.hasConsensus
                  ? `${consensus.consensusLevel === 'high' ? 'High' : 'Medium'} Consensus Detected`
                  : 'Conflict Detected - Human Review Required'}
              </h3>
              <p className="text-sm text-gray-600">
                {consensus.hasConsensus
                  ? 'All LLMs agree on the core analysis'
                  : `Conflicting responses from: ${consensus.conflictingProviders.join(', ')}`}
              </p>
              {cached && (
                <p className="text-sm text-blue-600 mt-1">
                  ⚡ Cached result from previous query (saved API costs)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {['claude', 'openai', 'gemini', 'grok'].map((provider) => (
            <div key={provider} className={getLLMCardClass(provider)}>
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full ${getLLMBgColor(provider)} mr-3 animate-pulse`}></div>
                <h3 className={`text-lg font-semibold ${getLLMColor(provider)} capitalize`}>
                  {provider} - Processing...
                </h3>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LLM Responses Grid */}
      {!loading && responses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {responses.map((response, index) => (
            <div key={index} className={getLLMCardClass(response.provider)}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${getLLMColor(response.provider)} capitalize`}>
                  {response.provider}
                </h3>
                <span className="text-xs text-gray-500">{response.model}</span>
              </div>

              {/* Response Text */}
              {response.error ? (
                <div className="text-red-600 text-sm mb-4">
                  Error: {response.error}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none mb-4">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {response.responseText}
                  </p>
                </div>
              )}

              {/* Metadata */}
              {!response.error && (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  {response.confidenceScore !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Confidence</span>
                        <span className="font-medium">{response.confidenceScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${getLLMBgColor(response.provider)} h-2 rounded-full`}
                          style={{ width: `${response.confidenceScore}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Response Time</span>
                    <span>{(response.responseTimeMs / 1000).toFixed(2)}s</span>
                  </div>

                  {response.tokensUsed && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tokens</span>
                      <span>{response.tokensUsed.toLocaleString()}</span>
                    </div>
                  )}

                  {response.sources && response.sources.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-600">Sources: </span>
                      <span className="text-blue-600">
                        {response.sources.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Copy Button */}
              {!response.error && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(response.responseText);
                    alert('Response copied to clipboard!');
                  }}
                  className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Copy Response
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI-Powered Summary Section */}
      {!loading && responses.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mr-3">
                <span className="text-white text-xl">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  AI-Generated Summary
                </h3>
                <p className="text-sm text-gray-600">
                  Condensed analysis from all {responses.filter(r => !r.error).length} model responses
                </p>
              </div>
            </div>
            {summary && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(summary);
                  alert('Summary copied to clipboard!');
                }}
                className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
              >
                Copy Summary
              </button>
            )}
          </div>

          {summaryLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-purple-200 rounded w-full"></div>
              <div className="h-4 bg-purple-200 rounded w-5/6"></div>
              <div className="h-4 bg-purple-200 rounded w-4/6"></div>
            </div>
          ) : summary ? (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap bg-white/70 p-4 rounded-lg border border-purple-100">
                {summary}
              </p>
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">
              Generating summary...
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This summary synthesizes key insights and consensus points from Claude, GPT-4, Gemini, and Grok responses using Claude API.
            </div>
          </div>
        </div>
      )}

      {/* Human Decision Panel */}
      {!loading && responses.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Human Decision & Approval
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Review all responses and select which LLM's analysis you want to use, or provide your own custom answer.
          </p>

          <div className="space-y-3 mb-4">
            {responses.filter(r => !r.error).map((response) => (
              <label key={response.provider} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="selected_llm"
                  value={response.provider}
                  className="mt-1 mr-3"
                />
                <div>
                  <span className={`font-medium ${getLLMColor(response.provider)} capitalize`}>
                    {response.provider}
                  </span>
                  {response.confidenceScore && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({response.confidenceScore}% confidence)
                    </span>
                  )}
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {response.responseText.substring(0, 200)}...
                  </p>
                </div>
              </label>
            ))}
          </div>

          <textarea
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            placeholder="Optional: Add notes or custom analysis..."
          />

          <div className="flex gap-4">
            <button className="btn-primary">
              Approve & Save Decision
            </button>
            <button
              onClick={() => exportAllResponses()}
              className="btn-secondary"
            >
              Export All Responses
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QueryPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    }>
      <QueryPageContent />
    </Suspense>
  );
}
