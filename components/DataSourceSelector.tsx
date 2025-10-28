'use client';

import React, { useState, useEffect } from 'react';

// Types
interface DataSource {
  id: string;
  name: string;
  provider: string;
  category: string;
  access_type: 'free' | 'institutional' | 'paid_api' | 'paid_per_article';
  pricing_model: string;
  cost_per_query: number;
  cost_per_article: number;
  coverage_description: string;
  mcp_server_available: boolean;
  is_default: boolean;
  is_recommended: boolean;
  query_rate_limit: number;
  rate_limit_unit: string;
}

interface DataSourceSelectorProps {
  workflowId: string;
  selectedSources: string[];
  onChange: (sources: string[]) => void;
}

export function DataSourceSelector({
  workflowId,
  selectedSources,
  onChange
}: DataSourceSelectorProps) {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadDataSources();
  }, [workflowId]);

  const loadDataSources = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/data-sources`);
      const data = await response.json();
      if (data.success) {
        setSources(data.sources);
        // Auto-select default sources
        const defaultIds = data.sources
          .filter((s: DataSource) => s.is_default)
          .map((s: DataSource) => s.id);
        onChange(defaultIds);
      }
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccessBadge = (type: string) => {
    const badges = {
      free: { color: 'bg-green-100 text-green-800 border-green-200', icon: '✓', text: 'Free' },
      institutional: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🏛️', text: 'Institutional' },
      paid_api: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '💳', text: 'Paid API' },
      paid_per_article: { color: 'bg-red-100 text-red-800 border-red-200', icon: '💰', text: 'Pay Per Article' }
    };
    return badges[type] || badges.free;
  };

  const formatCost = (source: DataSource) => {
    if (source.access_type === 'free') return 'Free';
    if (source.cost_per_query > 0) return `$${source.cost_per_query.toFixed(2)}/query`;
    if (source.cost_per_article > 0) return `$${source.cost_per_article.toFixed(2)}/article`;
    return 'Subscription Required';
  };

  const toggleExpanded = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onChange(selectedSources.filter(id => id !== sourceId));
    } else {
      onChange([...selectedSources, sourceId]);
    }
  };

  const selectRecommended = () => {
    const recommendedIds = sources
      .filter(s => s.is_recommended || s.is_default)
      .map(s => s.id);
    onChange(recommendedIds);
  };

  const selectOnlyFree = () => {
    const freeIds = sources
      .filter(s => s.access_type === 'free')
      .map(s => s.id);
    onChange(freeIds);
  };

  const categories = ['all', ...new Set(sources.map(s => s.category))];
  const filteredSources = filterCategory === 'all'
    ? sources
    : sources.filter(s => s.category === filterCategory);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 text-sm mt-2">Loading data sources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Data Sources</h3>
          <p className="text-sm text-gray-600">
            Select which databases to search ({selectedSources.length} selected)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectOnlyFree}
            className="text-sm px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
          >
            ✓ Free Only
          </button>
          <button
            onClick={selectRecommended}
            className="text-sm px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            ⭐ Recommended
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap transition-colors ${
              filterCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat === 'all' ? 'All Sources' : cat.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Data Sources List */}
      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {filteredSources.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No data sources available for this workflow
          </div>
        )}

        {filteredSources.map(source => {
          const badge = getAccessBadge(source.access_type);
          const isSelected = selectedSources.includes(source.id);
          const isExpanded = expandedSources.has(source.id);

          return (
            <div
              key={source.id}
              className={`border-2 rounded-lg p-4 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSource(source.id)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{source.name}</span>
                        {source.is_recommended && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            ⭐ Recommended
                          </span>
                        )}
                        {source.mcp_server_available && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                            ⚡ Fast API
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${badge.color}`}>
                          {badge.icon} {badge.text}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCost(source)}
                        </span>
                        <span className="text-xs text-gray-500">• {source.provider}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description (always visible when not expanded) */}
                  {!isExpanded && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {source.coverage_description}
                    </p>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-gray-700">
                        {source.coverage_description}
                      </p>

                      {/* Warnings for paid sources */}
                      {source.access_type === 'institutional' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800">
                            <strong>💡 Institutional Access:</strong> Free if ACM Biolabs has a subscription.
                            Otherwise, usage fees of {formatCost(source)} apply.
                          </p>
                        </div>
                      )}

                      {source.access_type === 'paid_per_article' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs text-red-800">
                            <strong>⚠️ Cost Warning:</strong> Each full-text article retrieved costs{' '}
                            ${source.cost_per_article.toFixed(2)}. Consider using free abstract databases first
                            to identify the most relevant papers.
                          </p>
                        </div>
                      )}

                      {/* Rate limits */}
                      {source.query_rate_limit && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <strong>Rate Limit:</strong> {source.query_rate_limit} queries per{' '}
                          {source.rate_limit_unit}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpanded(source.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-2 font-medium"
                  >
                    {isExpanded ? '▲ Show less' : '▼ Show more'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              <strong>{selectedSources.length}</strong> sources selected
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-700">
              <strong>
                {selectedSources.filter(id => {
                  const src = sources.find(s => s.id === id);
                  return src?.access_type === 'free';
                }).length}
              </strong>{' '}
              free
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-700">
              <strong>
                {selectedSources.filter(id => {
                  const src = sources.find(s => s.id === id);
                  return src?.access_type !== 'free';
                }).length}
              </strong>{' '}
              paid
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact badge component for displaying selected sources
export function DataSourceBadges({ sourceIds }: { sourceIds: string[] }) {
  const [sources, setSources] = useState<DataSource[]>([]);

  useEffect(() => {
    if (sourceIds.length > 0) {
      fetch(`/api/data-sources?ids=${sourceIds.join(',')}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setSources(data.sources);
        });
    }
  }, [sourceIds]);

  if (sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {sources.map(source => (
        <span
          key={source.id}
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            source.access_type === 'free'
              ? 'bg-green-100 text-green-800'
              : 'bg-orange-100 text-orange-800'
          }`}
        >
          {source.name}
        </span>
      ))}
    </div>
  );
}
