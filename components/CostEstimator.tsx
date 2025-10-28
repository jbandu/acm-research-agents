'use client';

import React, { useState } from 'react';

// Types
interface LLMCosts {
  claude: number;
  openai: number;
  gemini: number;
  grok: number;
  total: number;
}

interface DataSourceCost {
  source_id: string;
  source_name: string;
  estimated_queries: number;
  estimated_articles: number;
  cost: number;
  is_free: boolean;
}

interface CostBreakdown {
  llm_costs: LLMCosts;
  data_source_costs: DataSourceCost[];
  total_estimated_cost: number;
  estimated_duration_minutes: number;
  context_tokens: number;
  query_tokens: number;
}

interface CostEstimatorProps {
  workflowId: string;
  userQuery: string;
  selectedDataSources: string[];
  contextLevel: 'minimal' | 'standard' | 'deep';
  onConfirm?: () => void;
}

export function CostEstimator({
  workflowId,
  userQuery,
  selectedDataSources,
  contextLevel,
  onConfirm
}: CostEstimatorProps) {
  const [estimating, setEstimating] = useState(false);
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const estimateCost = async () => {
    if (!userQuery || selectedDataSources.length === 0) {
      setError('Please enter a query and select at least one data source');
      return;
    }

    setEstimating(true);
    setError(null);

    try {
      const response = await fetch('/api/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: workflowId,
          query: userQuery,
          data_sources: selectedDataSources,
          context_level: contextLevel
        })
      });

      const data = await response.json();

      if (data.success) {
        setBreakdown(data.breakdown);
      } else {
        setError(data.error || 'Failed to estimate cost');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setEstimating(false);
    }
  };

  // Before estimation - show button
  if (!breakdown && !error) {
    return (
      <div className="space-y-2">
        <button
          onClick={estimateCost}
          disabled={estimating || !userQuery || selectedDataSources.length === 0}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
        >
          {estimating ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Calculating...
            </>
          ) : (
            <>
              💵 Estimate Cost Before Running
            </>
          )}
        </button>
        <p className="text-xs text-center text-gray-500">
          Get a detailed breakdown of LLM and data source costs
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">Error Estimating Cost</h4>
            <p className="text-sm text-red-800 mt-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                estimateCost();
              }}
              className="mt-3 text-sm text-red-700 hover:text-red-900 font-medium"
            >
              Try Again →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show breakdown
  const totalDataSourceCost = breakdown!.data_source_costs.reduce((sum, ds) => sum + ds.cost, 0);
  const paidSources = breakdown!.data_source_costs.filter(ds => !ds.is_free);
  const isHighCost = breakdown!.total_estimated_cost > 10;
  const isVeryHighCost = breakdown!.total_estimated_cost > 50;

  return (
    <div className={`border-2 rounded-lg p-6 ${
      isVeryHighCost ? 'border-red-300 bg-red-50' :
      isHighCost ? 'border-yellow-300 bg-yellow-50' :
      'border-purple-200 bg-purple-50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>💰 Cost Estimate</span>
        </h3>
        <button
          onClick={() => setBreakdown(null)}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          ✕ Close
        </button>
      </div>

      {/* LLM Costs */}
      <div className="mb-4">
        <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center justify-between">
          <span>LLM API Costs (4 models)</span>
          <span className="text-xs text-gray-500">
            {breakdown!.query_tokens + breakdown!.context_tokens} total tokens
          </span>
        </h4>
        <div className="grid grid-cols-4 gap-2 text-sm mb-2">
          <div className="bg-white p-2 rounded shadow-sm">
            <div className="text-xs text-gray-600">Claude</div>
            <div className="font-semibold text-gray-900">
              ${breakdown!.llm_costs.claude.toFixed(3)}
            </div>
          </div>
          <div className="bg-white p-2 rounded shadow-sm">
            <div className="text-xs text-gray-600">OpenAI</div>
            <div className="font-semibold text-gray-900">
              ${breakdown!.llm_costs.openai.toFixed(3)}
            </div>
          </div>
          <div className="bg-white p-2 rounded shadow-sm">
            <div className="text-xs text-gray-600">Gemini</div>
            <div className="font-semibold text-gray-900">
              ${breakdown!.llm_costs.gemini.toFixed(3)}
            </div>
          </div>
          <div className="bg-white p-2 rounded shadow-sm">
            <div className="text-xs text-gray-600">Grok</div>
            <div className="font-semibold text-gray-900">
              ${breakdown!.llm_costs.grok.toFixed(3)}
            </div>
          </div>
        </div>
        <div className="text-right text-sm font-medium text-gray-700">
          LLM Subtotal: ${breakdown!.llm_costs.total.toFixed(3)}
        </div>
      </div>

      {/* Data Source Costs */}
      <div className="mb-4">
        <h4 className="font-medium text-sm text-gray-700 mb-2">
          Data Source Costs ({breakdown!.data_source_costs.length} sources)
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {breakdown!.data_source_costs.map((source, idx) => (
            <div key={idx} className="bg-white p-3 rounded shadow-sm text-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{source.source_name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    ~{source.estimated_queries} queries
                    {source.estimated_articles > 0 && `, ${source.estimated_articles} articles`}
                  </div>
                </div>
                <div className="font-semibold">
                  {source.is_free ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span className="text-orange-600">${source.cost.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalDataSourceCost > 0 && (
          <div className="text-right text-sm font-medium text-gray-700 mt-2">
            Data Subtotal: ${totalDataSourceCost.toFixed(2)}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t-2 border-gray-300 pt-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold text-gray-900">Total Estimated Cost</span>
          <span className={`text-2xl font-bold ${
            isVeryHighCost ? 'text-red-600' :
            isHighCost ? 'text-yellow-600' :
            'text-purple-700'
          }`}>
            ${breakdown!.total_estimated_cost.toFixed(2)}
          </span>
        </div>
        <div className="text-sm text-gray-600 flex items-center justify-between">
          <span>⏱️ Estimated time: ~{breakdown!.estimated_duration_minutes} minutes</span>
          {breakdown!.total_estimated_cost === 0 && (
            <span className="text-green-600 font-medium">✓ Free Query</span>
          )}
        </div>
      </div>

      {/* High Cost Warning */}
      {isVeryHighCost && (
        <div className="mb-4 bg-red-100 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h5 className="font-semibold text-red-900 mb-1">Very High Cost Alert!</h5>
              <p className="text-sm text-red-800">
                This research will cost over <strong>${breakdown!.total_estimated_cost.toFixed(2)}</strong>.
                This is unusually expensive. Consider:
              </p>
              <ul className="text-sm text-red-800 list-disc ml-5 mt-2 space-y-1">
                <li>Using only free data sources first</li>
                <li>Narrowing your query scope</li>
                <li>Reducing the number of paid sources</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {isHighCost && !isVeryHighCost && (
        <div className="mb-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h5 className="font-semibold text-yellow-900 mb-1">High Cost Alert</h5>
              <p className="text-sm text-yellow-800">
                This research will cost over $10. Consider using free sources first or narrowing your query.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Paid Sources Breakdown */}
      {paidSources.length > 0 && (
        <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3">
          <h5 className="text-sm font-semibold text-gray-900 mb-2">💳 Paid Sources Impact:</h5>
          <ul className="text-xs text-gray-700 space-y-1">
            {paidSources.map((source, idx) => (
              <li key={idx}>
                • <strong>{source.source_name}</strong> will add ${source.cost.toFixed(2)} to your cost
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-600 mt-2">
            💡 Tip: Remove paid sources to reduce cost, or confirm if they're essential for your research.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setBreakdown(null)}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium transition-colors"
        >
          ← Modify Query
        </button>
        <button
          onClick={() => {
            if (onConfirm) {
              onConfirm();
            }
          }}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            isVeryHighCost
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : isHighCost
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isVeryHighCost ? '⚠️ ' : ''}Confirm & Run Research →
        </button>
      </div>

      {/* Cost Breakdown Toggle */}
      <details className="mt-4">
        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
          📊 Show detailed calculation
        </summary>
        <div className="mt-2 bg-gray-50 rounded p-3 text-xs text-gray-700 space-y-1">
          <div><strong>Query Tokens:</strong> {breakdown!.query_tokens}</div>
          <div><strong>Context Tokens ({contextLevel}):</strong> {breakdown!.context_tokens}</div>
          <div><strong>Estimated Output:</strong> ~2,000 tokens per model</div>
          <div className="pt-2 border-t border-gray-300">
            <strong>LLM Pricing:</strong>
            <ul className="ml-4 mt-1">
              <li>Claude: $3/$15 per M tokens (input/output)</li>
              <li>OpenAI: $5/$15 per M tokens</li>
              <li>Gemini: $1.25/$5 per M tokens</li>
              <li>Grok: $2/$10 per M tokens</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}

// Compact cost badge for displaying in lists
export function CostBadge({ cost }: { cost: number }) {
  if (cost === 0) {
    return (
      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
        Free
      </span>
    );
  }

  if (cost > 50) {
    return (
      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
        ${cost.toFixed(2)} - Very High
      </span>
    );
  }

  if (cost > 10) {
    return (
      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
        ${cost.toFixed(2)} - High
      </span>
    );
  }

  return (
    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
      ${cost.toFixed(2)}
    </span>
  );
}
