'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import map component to avoid SSR issues
const CompetitorMap = dynamic(() => import('@/components/CompetitorMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      <div className="text-white">Loading map...</div>
    </div>
  )
});

interface Competitor {
  id: string;
  name: string;
  short_name: string;
  logo_url?: string;
  website_url?: string;
  headquarters_city?: string;
  headquarters_state?: string;
  headquarters_country: string;
  latitude?: number;
  longitude?: number;
  company_type?: string;
  ticker_symbol?: string;
  founded_year?: number;
  primary_focus?: string[];
  technology_platforms?: string[];
  threat_level: string;
  competitive_overlap_score: number;
  strategic_notes?: string;
  ai_summary?: string;
  last_ai_research_date?: string;
  update_count?: number;
  trial_count?: number;
  publication_count?: number;
  latest_update_date?: string;
}

type ViewMode = 'map' | 'grid' | 'list';

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedThreatLevel, setSelectedThreatLevel] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch competitors
  useEffect(() => {
    async function fetchCompetitors() {
      try {
        const response = await fetch('/api/competitors');
        const data = await response.json();
        if (data.success) {
          setCompetitors(data.competitors);
        }
      } catch (error) {
        console.error('Failed to fetch competitors:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompetitors();
  }, []);

  // Filter competitors
  const filteredCompetitors = useMemo(() => {
    return competitors.filter(comp => {
      if (selectedThreatLevel !== 'all' && comp.threat_level !== selectedThreatLevel) {
        return false;
      }
      if (selectedCountry !== 'all' && comp.headquarters_country !== selectedCountry) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          comp.name.toLowerCase().includes(query) ||
          comp.short_name?.toLowerCase().includes(query) ||
          comp.primary_focus?.some(f => f.toLowerCase().includes(query)) ||
          comp.technology_platforms?.some(t => t.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [competitors, selectedThreatLevel, selectedCountry, searchQuery]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const countrySet = new Set(competitors.map(c => c.headquarters_country));
    return Array.from(countrySet).sort();
  }, [competitors]);

  // Threat level colors
  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading competitors...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-[2000px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                🎯 Competitive Intelligence
              </h1>
              <p className="text-gray-400">
                Tracking {filteredCompetitors.length} of {competitors.length} competitors worldwide
              </p>
            </div>

            <Link
              href="/"
              className="px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Toggle */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1 flex">
              {(['map', 'grid', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === mode
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {mode === 'map' && '🗺️ Map'}
                  {mode === 'grid' && '📊 Grid'}
                  {mode === 'list' && '📋 List'}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search competitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Threat Level Filter */}
            <select
              value={selectedThreatLevel}
              onChange={(e) => setSelectedThreatLevel(e.target.value)}
              className="px-4 py-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Threats</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>

            {/* Country Filter */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            {/* Stats */}
            <div className="ml-auto flex gap-6 text-sm">
              <div className="text-center">
                <div className="text-red-400 font-bold text-lg">
                  {competitors.filter(c => c.threat_level === 'critical').length}
                </div>
                <div className="text-gray-400">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-orange-400 font-bold text-lg">
                  {competitors.filter(c => c.threat_level === 'high').length}
                </div>
                <div className="text-gray-400">High</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-400 font-bold text-lg">
                  {competitors.filter(c => c.threat_level === 'medium').length}
                </div>
                <div className="text-gray-400">Medium</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[2000px] mx-auto px-6 py-6">
        {viewMode === 'map' && (
          <div className="h-[calc(100vh-240px)] rounded-2xl overflow-hidden backdrop-blur-md bg-white/5 border border-white/10">
            <CompetitorMap competitors={filteredCompetitors} />
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCompetitors.map(comp => (
              <Link
                key={comp.id}
                href={`/competitors/${comp.id}`}
                className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                      {comp.short_name || comp.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {comp.headquarters_city}, {comp.headquarters_country}
                    </p>
                  </div>
                  <div className="text-2xl">{getThreatIcon(comp.threat_level)}</div>
                </div>

                <div className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border mb-4 ${getThreatColor(comp.threat_level)}`}>
                  {comp.threat_level.toUpperCase()} THREAT
                </div>

                <div className="space-y-2 mb-4">
                  {comp.primary_focus && comp.primary_focus.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {comp.primary_focus.slice(0, 2).map((focus, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-300">
                          {focus}
                        </span>
                      ))}
                      {comp.primary_focus.length > 2 && (
                        <span className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-300">
                          +{comp.primary_focus.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 text-sm text-gray-400">
                  <div>📊 {comp.trial_count || 0} trials</div>
                  <div>📄 {comp.publication_count || 0} pubs</div>
                </div>

                {comp.last_ai_research_date && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
                    Last researched: {new Date(comp.last_ai_research_date).toLocaleDateString()}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Threat</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Overlap</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Focus Areas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Trials</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredCompetitors.map(comp => (
                  <tr key={comp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{comp.short_name || comp.name}</div>
                      {comp.ticker_symbol && (
                        <div className="text-sm text-gray-400">{comp.ticker_symbol}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {comp.headquarters_city}, {comp.headquarters_country}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${getThreatColor(comp.threat_level)}`}>
                        {getThreatIcon(comp.threat_level)} {comp.threat_level}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                            style={{ width: `${comp.competitive_overlap_score}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{comp.competitive_overlap_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {comp.primary_focus?.slice(0, 2).map((focus, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-300">
                            {focus}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {comp.trial_count || 0}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/competitors/${comp.id}`}
                        className="text-purple-400 hover:text-purple-300 text-sm font-semibold"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredCompetitors.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            No competitors match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
