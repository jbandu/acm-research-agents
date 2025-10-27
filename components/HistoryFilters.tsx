'use client';

import { useState, useEffect } from 'react';
import { HistoryFilters as HistoryFiltersType } from '@/types/history';

interface HistoryFiltersProps {
  filters: HistoryFiltersType;
  onFilterChange: (filters: HistoryFiltersType) => void;
  onSearch: (query: string) => void;
}

export default function HistoryFilters({ filters, onFilterChange, onSearch }: HistoryFiltersProps) {
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<HistoryFiltersType>(filters);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleToggleFilter = (
    key: keyof HistoryFiltersType,
    value: string
  ) => {
    const currentValues = (localFilters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    const newFilters = { ...localFilters, [key]: newValues };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (preset: string) => {
    const now = new Date();
    let start: Date | undefined;
    let end: Date = now;

    switch (preset) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        start = undefined;
        end = now;
        break;
    }

    const newFilters = {
      ...localFilters,
      dateRange: start ? { start, end } : undefined,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onFilterChange({});
    setSearchInput('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.categories?.length) count += localFilters.categories.length;
    if (localFilters.consensusLevels?.length) count += localFilters.consensusLevels.length;
    if (localFilters.llmProviders?.length) count += localFilters.llmProviders.length;
    if (localFilters.status?.length) count += localFilters.status.length;
    if (localFilters.dateRange) count += 1;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search queries..."
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center px-4 py-3 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* Date Range */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Last 7 days', value: '7d' },
                { label: 'Last 30 days', value: '30d' },
                { label: 'Last 90 days', value: '90d' },
                { label: 'All time', value: 'all' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDateRangeChange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localFilters.dateRange || option.value === 'all'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Workflow Categories */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Workflow Type</h3>
            <div className="flex flex-wrap gap-2">
              {[
                'Literature Mining & Synthesis',
                'Target Identification & Validation',
                'Clinical Trial Design',
                'Regulatory Documentation',
                'Competitive Intelligence',
              ].map((category) => (
                <button
                  key={category}
                  onClick={() => handleToggleFilter('categories', category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localFilters.categories?.includes(category)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Consensus Level */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Consensus Level</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'High', value: 'high', icon: '✅' },
                { label: 'Medium', value: 'medium', icon: '⚠️' },
                { label: 'Low', value: 'low', icon: '❌' },
                { label: 'None', value: 'none', icon: '❔' },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleToggleFilter('consensusLevels', level.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localFilters.consensusLevels?.includes(level.value)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.icon} {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* LLM Providers */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">LLM Provider</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Claude', value: 'claude' },
                { label: 'OpenAI', value: 'openai' },
                { label: 'Gemini', value: 'gemini' },
                { label: 'Grok', value: 'grok' },
              ].map((provider) => (
                <button
                  key={provider.value}
                  onClick={() => handleToggleFilter('llmProviders', provider.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localFilters.llmProviders?.includes(provider.value)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Completed', value: 'completed' },
                { label: 'Processing', value: 'processing' },
                { label: 'Failed', value: 'failed' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleToggleFilter('status', status.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localFilters.status?.includes(status.value)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
