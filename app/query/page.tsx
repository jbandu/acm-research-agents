'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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
    } catch (error: any) {
      console.error('Query error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
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

        <button
          onClick={handleQuery}
          disabled={loading || !queryText.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Querying All LLMs...' : 'Run Query'}
        </button>
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
            <button className="btn-secondary">
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
