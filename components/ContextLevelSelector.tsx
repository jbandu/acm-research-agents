'use client';

import React, { useState, useEffect } from 'react';
import { CONTEXT_STRATEGIES, type ContextLevel } from '@/lib/contextLoader';

interface ContextPreview {
  entryCount: number;
  totalTokens: number;
  entries: Array<{
    title: string;
    category: string;
    importance: number;
    tokens: number;
  }>;
}

interface ContextLevelSelectorProps {
  selectedLevel: ContextLevel;
  onChange: (level: ContextLevel) => void;
  showPreview?: boolean;
}

export function ContextLevelSelector({
  selectedLevel,
  onChange,
  showPreview = true
}: ContextLevelSelectorProps) {
  const [preview, setPreview] = useState<ContextPreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showPreview && selectedLevel !== 'minimal') {
      loadPreview(selectedLevel);
    }
  }, [selectedLevel, showPreview]);

  const loadPreview = async (level: ContextLevel) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/context/preview?level=${level}`);
      const data = await response.json();
      if (data.success) {
        setPreview(data.preview);
      }
    } catch (error) {
      console.error('Failed to load context preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContextIcon = (level: ContextLevel) => {
    switch (level) {
      case 'minimal':
        return '⚡';
      case 'standard':
        return '🎯';
      case 'deep':
        return '🧠';
    }
  };

  const getContextColor = (level: ContextLevel) => {
    switch (level) {
      case 'minimal':
        return 'border-green-500 bg-green-50 text-green-900';
      case 'standard':
        return 'border-blue-500 bg-blue-50 text-blue-900';
      case 'deep':
        return 'border-purple-500 bg-purple-50 text-purple-900';
    }
  };

  const getContextBadgeColor = (level: ContextLevel) => {
    switch (level) {
      case 'minimal':
        return 'text-green-600';
      case 'standard':
        return 'text-blue-600';
      case 'deep':
        return 'text-purple-600';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Context Depth
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(CONTEXT_STRATEGIES).map(([level, strategy]) => {
            const isSelected = selectedLevel === level;
            return (
              <button
                key={level}
                className={`
                  relative border-2 rounded-lg p-4 transition-all
                  hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isSelected
                    ? getContextColor(level as ContextLevel) + ' border-2'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
                onClick={() => onChange(level as ContextLevel)}
              >
                <div className="text-2xl mb-2">{getContextIcon(level as ContextLevel)}</div>
                <div className="font-semibold capitalize mb-1">{level}</div>
                <div className="text-xs opacity-75 mb-2 min-h-[2.5rem]">
                  {strategy.description.split('(')[0].trim()}
                </div>
                <div className={`text-xs font-medium ${getContextBadgeColor(level as ContextLevel)}`}>
                  {strategy.maxTokens === 0
                    ? 'Fastest • Cheapest'
                    : `~${(strategy.maxTokens / 1000).toFixed(0)}K tokens • Cached`
                  }
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-current rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showPreview && selectedLevel !== 'minimal' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Context Preview</h4>
            {loading && (
              <div className="flex items-center text-xs text-gray-500">
                <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </div>
            )}
          </div>

          {preview && !loading && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Entries:</span>
                  <span className="ml-2 font-semibold text-gray-900">{preview.entryCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Tokens:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    ~{preview.totalTokens.toLocaleString()}
                  </span>
                </div>
              </div>

              {preview.entries.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">Included Knowledge:</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {preview.entries.map((entry, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 bg-white rounded border border-gray-200 flex justify-between items-center"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{entry.title}</div>
                          <div className="text-gray-500 truncate">{entry.category}</div>
                        </div>
                        <div className="ml-2 text-gray-400 text-xs whitespace-nowrap">
                          ~{entry.tokens} tokens
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <span className="mr-2">💡</span>
          <div>
            <strong className="text-blue-900">Recommendation:</strong>
            <span className="text-blue-800">
              {' '}Use <strong>Standard</strong> for most queries. Switch to <strong>Deep</strong> for
              complex research requiring competitive intelligence and clinical trial details.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for inline use in workflow forms
export function ContextLevelBadge({ level }: { level: ContextLevel }) {
  const getContextIcon = (level: ContextLevel) => {
    switch (level) {
      case 'minimal':
        return '⚡';
      case 'standard':
        return '🎯';
      case 'deep':
        return '🧠';
    }
  };

  const getBadgeColor = (level: ContextLevel) => {
    switch (level) {
      case 'minimal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'standard':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deep':
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(level)}`}
    >
      <span className="mr-1">{getContextIcon(level)}</span>
      {level.charAt(0).toUpperCase() + level.slice(1)} Context
    </span>
  );
}
