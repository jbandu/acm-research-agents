'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ContextLevelSelector } from '@/components/ContextLevelSelector';
import { DataSourceSelector } from '@/components/DataSourceSelector';
import { CostEstimator } from '@/components/CostEstimator';
import PatentCard from '@/components/PatentCard';
import OpenAlexCard from '@/components/OpenAlexCard';
import FollowUpQuestions from '@/components/FollowUpQuestions';

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

  // Follow-up questions state
  const [followupQuestions, setFollowupQuestions] = useState<any[]>([]);

  // Patent state
  const [patents, setPatents] = useState<any[]>([]);
  const [patentCount, setPatentCount] = useState(0);

  // OpenAlex state
  const [openAlexResults, setOpenAlexResults] = useState<any[]>([]);
  const [openAlexCount, setOpenAlexCount] = useState(0);

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
      setPatents(data.patents || []);
      setPatentCount(data.patent_count || 0);
      setOpenAlexResults(data.openalex || []);
      setOpenAlexCount(data.openalex_count || 0);

      // Generate summary after responses are received
      if (data.responses && data.responses.length > 0) {
        generateSummary(data.responses, queryText, data.query_id);
      }
    } catch (error: any) {
      console.error('Query error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (llmResponses: LLMResponse[], query: string, query_id?: string) => {
    setSummaryLoading(true);
    setSummary('');
    setFollowupQuestions([]);

    try {
      const response = await fetch('/api/query/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_id,
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

      if (data.followup_questions) {
        setFollowupQuestions(data.followup_questions);
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
      case 'ollama':
        return baseClass + 'llm-card-ollama';
      case 'patents':
        return baseClass + 'llm-card-patents';
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
      case 'ollama':
        return 'text-indigo-600';
      case 'patents':
        return 'text-amber-600';
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
      case 'ollama':
        return 'bg-indigo-500';
      case 'patents':
        return 'bg-amber-500';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">New Research Query</h1>

      {/* Input Section */}
      <div className="bg-dark-surface rounded-lg border border-dark-border p-6 mb-8">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-dark-text mb-2">
            Select Workflow (Optional)
          </label>
          <select
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="w-full px-4 py-2 bg-dark-elevated border border-dark-border text-dark-text rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition-all"
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
          <label className="block text-sm font-semibold text-dark-text mb-2">
            Research Query
          </label>
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-dark-elevated border border-dark-border text-dark-text rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition-all placeholder:text-dark-text-subtle"
            placeholder="Enter your research question here. Example: What is the optimal dosing schedule for combining TLR9 agonists with checkpoint inhibitors in bladder cancer?"
          />
        </div>

        {/* Advanced Options Toggle */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-accent-blue hover:text-accent-cyan font-medium flex items-center gap-2 transition-colors"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options (Context, Data Sources, Cost Estimate)
          </button>
        </div>

        {/* Advanced Options Panel */}
        {showAdvanced && (
          <div className="space-y-6 mb-6 p-6 bg-dark-elevated rounded-lg border border-dark-border">
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
        <div className={`mb-8 p-5 rounded-lg border-l-4 ${
          consensus.hasConsensus
            ? consensus.consensusLevel === 'high'
              ? 'bg-accent-green/10 border-accent-green'
              : 'bg-accent-yellow/10 border-accent-yellow'
            : 'bg-accent-orange/10 border-accent-orange'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">
              {consensus.hasConsensus ? '✅' : '⚠️'}
            </span>
            <div className="flex-1">
              <h3 className={`font-semibold text-lg mb-1 ${
                consensus.hasConsensus
                  ? consensus.consensusLevel === 'high'
                    ? 'text-accent-green'
                    : 'text-accent-yellow'
                  : 'text-accent-orange'
              }`}>
                {consensus.hasConsensus
                  ? `${consensus.consensusLevel === 'high' ? 'High' : 'Medium'} Consensus Detected`
                  : 'Conflict Detected - Human Review Required'}
              </h3>
              <p className={`text-sm ${
                consensus.hasConsensus
                  ? consensus.consensusLevel === 'high'
                    ? 'text-accent-green/80'
                    : 'text-accent-yellow/80'
                  : 'text-accent-orange/80'
              }`}>
                {consensus.hasConsensus
                  ? 'All LLMs agree on the core analysis'
                  : `Conflicting responses detected. Manual review recommended for: ${consensus.conflictingProviders.join(', ')}`}
              </p>
              {cached && (
                <p className="text-sm text-accent-cyan mt-2 flex items-center gap-1">
                  <span>⚡</span> Cached result from previous query (saved API costs)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="response-grid mb-8">
          {['claude', 'openai', 'gemini', 'grok', 'ollama', 'patents'].map((provider) => (
            <div key={provider} className={getLLMCardClass(provider)}>
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full ${getLLMBgColor(provider)} mr-3 animate-pulse`}></div>
                <h3 className={`text-lg font-bold ${getLLMColor(provider)} capitalize`}>
                  {provider === 'ollama' ? 'Llama 3.1 (Local)' : provider === 'patents' ? 'Google Patents' : provider} - Processing...
                </h3>
              </div>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LLM Responses Grid */}
      {!loading && responses.length > 0 && (
        <div className="response-grid mb-8">
          {responses.map((response, index) => (
            <div key={index} className={getLLMCardClass(response.provider)}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${getLLMBgColor(response.provider)} flex items-center justify-center shadow-md`}>
                    <span className="text-white font-bold text-sm uppercase">
                      {response.provider.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${getLLMColor(response.provider)} capitalize`}>
                      {response.provider}
                    </h3>
                    <span className="text-xs text-dark-text-muted font-mono">{response.model}</span>
                  </div>
                </div>
              </div>

              {/* Response Text */}
              {response.error ? (
                <div className="badge badge-error text-sm mb-4">
                  Error: {response.error}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none mb-5">
                  <div className="whitespace-pre-wrap text-dark-text leading-relaxed text-base">
                    {response.responseText}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {!response.error && (
                <div className="border-t border-dark-border pt-4 space-y-3">
                  {response.confidenceScore !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-dark-text-muted font-medium">Confidence Score</span>
                        <span className="font-bold text-dark-text">{response.confidenceScore}%</span>
                      </div>
                      <div className="confidence-bar">
                        <div
                          className={`confidence-fill ${getLLMBgColor(response.provider)}`}
                          style={{ width: `${response.confidenceScore}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-dark-text-muted">Response Time</span>
                    <span className="font-semibold text-dark-text">{(response.responseTimeMs / 1000).toFixed(2)}s</span>
                  </div>

                  {response.tokensUsed && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-text-muted">Tokens Used</span>
                      <span className="font-semibold text-dark-text">{response.tokensUsed.toLocaleString()}</span>
                    </div>
                  )}

                  {response.sources && response.sources.length > 0 && (
                    <div className="text-sm">
                      <span className="text-dark-text-muted font-medium">Sources: </span>
                      <span className="text-accent-blue font-medium">
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
                  className="mt-4 w-full px-4 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Response
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI-Powered Summary Section */}
      {!loading && responses.length > 0 && (
        <div className="info-panel mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mr-4 shadow-md">
                <span className="text-white text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-dark-text">
                  AI-Generated Summary
                </h3>
                <p className="text-sm text-dark-text-muted mt-1">
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
                className="btn-secondary text-sm shrink-0"
              >
                Copy Summary
              </button>
            )}
          </div>

          {summaryLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-accent-blue/20 rounded w-full"></div>
              <div className="h-4 bg-accent-blue/20 rounded w-5/6"></div>
              <div className="h-4 bg-accent-blue/20 rounded w-4/6"></div>
            </div>
          ) : summary ? (
            <div className="prose prose-sm max-w-none">
              <p className="text-dark-text leading-relaxed whitespace-pre-wrap bg-dark-surface p-5 rounded-lg border border-dark-border shadow-sm">
                {summary}
              </p>
            </div>
          ) : (
            <div className="text-dark-text-muted text-sm italic">
              Generating summary...
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-dark-border">
            <div className="flex items-center text-xs text-dark-text-muted">
              <svg className="w-4 h-4 mr-2 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This summary synthesizes key insights and consensus points from Claude, GPT-4, Gemini, and Grok responses using Claude API.
            </div>
          </div>
        </div>
      )}

      {/* Patent Intelligence Section */}
      {!loading && patents.length > 0 && (
        <div className="section-container mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-yellow to-accent-orange flex items-center justify-center mr-4 shadow-md">
                <span className="text-white text-2xl">📜</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-dark-text">
                  Patent Intelligence
                </h3>
                <p className="text-sm text-dark-text-muted mt-1">
                  Relevant patents from Google Patents • {patentCount} results
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge badge-warning">
                <span className="font-bold">{patentCount}</span>
                <span className="ml-1">patents analyzed by all 4 LLMs</span>
              </div>
            </div>
          </div>

          <div className="compact-grid">
            {patents.map((patent, index) => (
              <PatentCard key={patent.patentNumber || index} patent={patent} />
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-dark-border">
            <div className="flex items-center text-xs text-dark-text-muted">
              <svg className="w-4 h-4 mr-2 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Patent data is automatically fetched from Google Patents and provided as context to all LLM models for IP-aware analysis.
            </div>
          </div>
        </div>
      )}

      {/* OpenAlex Academic Literature Section */}
      {!loading && openAlexResults.length > 0 && (
        <div className="section-container mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center mr-4 shadow-md">
                <span className="text-white text-2xl">📚</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-dark-text">
                  Academic Literature
                </h3>
                <p className="text-sm text-dark-text-muted mt-1">
                  Peer-reviewed research from OpenAlex • {openAlexCount} results
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge badge-primary">
                <span className="font-bold">{openAlexCount}</span>
                <span className="ml-1">papers analyzed by all 4 LLMs</span>
              </div>
            </div>
          </div>

          <div className="compact-grid">
            {openAlexResults.map((work, index) => (
              <OpenAlexCard key={work.id || index} work={work} />
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-dark-border">
            <div className="flex items-center text-xs text-dark-text-muted">
              <svg className="w-4 h-4 mr-2 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Academic papers are automatically fetched from OpenAlex (250M+ research works) and provided as context to all LLM models for evidence-based analysis.
            </div>
          </div>
        </div>
      )}

      {/* Follow-Up Questions Section */}
      {!loading && followupQuestions.length > 0 && (
        <div className="mb-8">
          <FollowUpQuestions
            questions={followupQuestions}
            originalQueryId={queryId}
            onQuestionClick={(question) => {
              setQueryText(question.question);
            }}
          />
        </div>
      )}

      {/* Human Decision Panel */}
      {!loading && responses.length > 0 && (
        <div className="section-container">
          <div className="section-header">
            <div>
              <h3 className="text-xl font-bold text-dark-text">
                Human Decision & Approval
              </h3>
              <p className="text-sm text-dark-text-muted mt-1">
                Review all responses and select which LLM's analysis you want to use, or provide your own custom answer.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {responses.filter(r => !r.error).map((response) => (
              <label key={response.provider} className="flex items-start p-4 border-2 border-dark-border rounded-xl hover:bg-dark-elevated hover:border-accent-blue/50 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="selected_llm"
                  value={response.provider}
                  className="mt-1 mr-4 w-4 h-4 text-accent-blue focus:ring-accent-blue accent-accent-blue"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-bold ${getLLMColor(response.provider)} capitalize text-lg`}>
                      {response.provider}
                    </span>
                    {response.confidenceScore && (
                      <span className="badge badge-primary text-xs">
                        {response.confidenceScore}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-dark-text-muted line-clamp-3 leading-relaxed">
                    {response.responseText.substring(0, 250)}...
                  </p>
                </div>
              </label>
            ))}
          </div>

          <textarea
            rows={4}
            className="w-full px-4 py-3 bg-dark-elevated border-2 border-dark-border text-dark-text rounded-xl focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition-all mb-6 placeholder:text-dark-text-subtle"
            placeholder="Optional: Add notes or custom analysis..."
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-primary flex-1 sm:flex-none">
              ✓ Approve & Save Decision
            </button>
            <button
              onClick={() => exportAllResponses()}
              className="btn-secondary flex-1 sm:flex-none"
            >
              📥 Export All Responses
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
          <div className="h-8 bg-dark-elevated rounded w-1/4 mb-8"></div>
          <div className="bg-dark-surface rounded-lg border border-dark-border p-6 mb-8">
            <div className="h-4 bg-dark-elevated rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-dark-elevated rounded mb-4"></div>
          </div>
        </div>
      </div>
    }>
      <QueryPageContent />
    </Suspense>
  );
}
