'use client';

import { useState, useEffect } from 'react';
import { QueryWithDetails, HistoryFilters as HistoryFiltersType } from '@/types/history';
import HistoryItemCard from './HistoryItemCard';
import HistoryFilters from './HistoryFilters';
import HistoryAnalytics from './HistoryAnalytics';

export default function HistoryTab() {
  const [queries, setQueries] = useState<QueryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<HistoryFiltersType>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [page, filters, searchQuery]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      if (filters.categories && filters.categories.length > 0) {
        params.append('categories', filters.categories.join(','));
      }

      if (filters.consensusLevels && filters.consensusLevels.length > 0) {
        params.append('consensusLevels', filters.consensusLevels.join(','));
      }

      if (filters.llmProviders && filters.llmProviders.length > 0) {
        params.append('llmProviders', filters.llmProviders.join(','));
      }

      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (filters.dateRange?.start) {
        params.append('dateFrom', filters.dateRange.start.toISOString());
      }

      if (filters.dateRange?.end) {
        params.append('dateTo', filters.dateRange.end.toISOString());
      }

      const response = await fetch(`/api/history?${params.toString()}`);
      const data = await response.json();

      setQueries(data.queries || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  const handleFilterChange = (newFilters: HistoryFiltersType) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const handleDelete = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this query and all its responses?')) {
      return;
    }

    try {
      const response = await fetch(`/api/history/${queryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the list
        fetchHistory();
      } else {
        alert('Failed to delete query');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting query');
    }
  };

  const handleReRun = async (queryId: string) => {
    if (!confirm('Re-run this query with all 4 LLMs?')) {
      return;
    }

    try {
      const response = await fetch(`/api/history/${queryId}/re-run`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.query_id) {
        // Refresh and show new query
        fetchHistory();
        alert('Query re-run successfully! Check the top of the list.');
      } else {
        alert('Failed to re-run query');
      }
    } catch (error) {
      console.error('Re-run error:', error);
      alert('Error re-running query');
    }
  };

  if (loading && queries.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Query History</h1>
        <p className="text-gray-600">
          View and manage all your past research queries and results
        </p>
      </div>

      {/* Analytics Dashboard */}
      <HistoryAnalytics />

      {/* Search and Filters */}
      <div className="mb-6">
        <HistoryFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
        />
      </div>

      {/* Stats */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{queries.length}</span> of{' '}
            <span className="font-medium text-gray-900">{total}</span> queries
          </div>
          {loading && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* Query List */}
      {queries.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No queries found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || Object.keys(filters).length > 0
              ? 'Try adjusting your filters or search'
              : 'Get started by running your first query'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queries.map((query) => (
            <HistoryItemCard
              key={query.id}
              query={query}
              isExpanded={expandedId === query.id}
              onToggleExpand={() => setExpandedId(expandedId === query.id ? null : query.id)}
              onDelete={handleDelete}
              onReRun={handleReRun}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
