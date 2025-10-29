'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  employee_count?: number;
  market_cap_usd?: number;
  last_funding_round_usd?: number;
  total_funding_usd?: number;
  annual_revenue_usd?: number;
  primary_focus?: string[];
  technology_platforms?: string[];
  pipeline_stage?: Record<string, number>;
  threat_level: string;
  competitive_overlap_score: number;
  strategic_notes?: string;
  ai_summary?: string;
  ai_strengths?: string[];
  ai_weaknesses?: string[];
  ai_opportunities?: string[];
  ai_threats?: string[];
  last_ai_research_date?: string;
  research_data?: any;
  created_at: string;
  updated_at: string;
  updates?: any[];
  trials?: any[];
  publications?: any[];
}

export default function CompetitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trials' | 'publications' | 'updates'>('overview');

  useEffect(() => {
    async function fetchCompetitor() {
      try {
        const response = await fetch(`/api/competitors/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setCompetitor(data.competitor);
        }
      } catch (error) {
        console.error('Failed to fetch competitor:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchCompetitor();
    }
  }, [params.id]);

  const triggerResearch = async () => {
    if (!competitor) return;

    setResearching(true);
    try {
      const response = await fetch(`/api/competitors/${competitor.id}/research`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setCompetitor(data.competitor);
        alert('Research completed successfully!');
      } else {
        alert(`Research failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Research failed:', error);
      alert('Research failed. Please try again.');
    } finally {
      setResearching(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading competitor details...</div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Competitor not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link
                href="/competitors"
                className="text-purple-400 hover:text-purple-300 text-sm font-semibold mb-3 inline-block"
              >
                ← Back to Competitors
              </Link>

              <h1 className="text-4xl font-bold text-white mb-2">
                {competitor.short_name || competitor.name}
              </h1>
              {competitor.short_name && competitor.name !== competitor.short_name && (
                <p className="text-gray-400 mb-3">{competitor.name}</p>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${getThreatColor(competitor.threat_level)}`}>
                  {competitor.threat_level.toUpperCase()} THREAT
                </div>

                {competitor.ticker_symbol && (
                  <div className="px-4 py-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-white font-mono">
                    {competitor.ticker_symbol}
                  </div>
                )}

                {competitor.company_type && (
                  <div className="px-4 py-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-gray-400">
                    {competitor.company_type}
                  </div>
                )}

                {competitor.website_url && (
                  <a
                    href={competitor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-purple-400 hover:bg-white/10 transition-all"
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>

            <button
              onClick={triggerResearch}
              disabled={researching}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {researching ? '🔄 Researching...' : '🤖 Run AI Research'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-gray-400 text-sm mb-1">Competitive Overlap</div>
            <div className="text-3xl font-bold text-white mb-2">{competitor.competitive_overlap_score}%</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                style={{ width: `${competitor.competitive_overlap_score}%` }}
              />
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-gray-400 text-sm mb-1">Location</div>
            <div className="text-xl font-bold text-white mb-1">
              {competitor.headquarters_city && `${competitor.headquarters_city}, `}
              {competitor.headquarters_country}
            </div>
            {competitor.founded_year && (
              <div className="text-sm text-gray-400">Founded {competitor.founded_year}</div>
            )}
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-gray-400 text-sm mb-1">Market Cap</div>
            <div className="text-3xl font-bold text-white">{formatCurrency(competitor.market_cap_usd)}</div>
            {competitor.annual_revenue_usd && (
              <div className="text-sm text-gray-400">Revenue: {formatCurrency(competitor.annual_revenue_usd)}</div>
            )}
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-gray-400 text-sm mb-1">Intelligence</div>
            <div className="text-sm text-white mb-1">
              {competitor.trials?.length || 0} trials tracked
            </div>
            <div className="text-sm text-white mb-1">
              {competitor.publications?.length || 0} publications
            </div>
            <div className="text-sm text-white">
              {competitor.updates?.length || 0} updates
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-t-2xl">
          <div className="flex gap-1 p-2">
            {(['overview', 'trials', 'publications', 'updates'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-b-2xl p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* AI Summary */}
              {competitor.ai_summary && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    🤖 AI-Generated Summary
                    {competitor.last_ai_research_date && (
                      <span className="text-sm text-gray-400 font-normal">
                        (Updated {new Date(competitor.last_ai_research_date).toLocaleDateString()})
                      </span>
                    )}
                  </h3>
                  <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-gray-300 whitespace-pre-wrap">{competitor.ai_summary}</p>
                  </div>
                </div>
              )}

              {/* SWOT Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competitor.ai_strengths && competitor.ai_strengths.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-green-400 mb-3">💪 Strengths</h4>
                    <div className="backdrop-blur-md bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <ul className="space-y-2">
                        {competitor.ai_strengths.map((strength, idx) => (
                          <li key={idx} className="text-gray-300 text-sm">• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {competitor.ai_weaknesses && competitor.ai_weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-red-400 mb-3">⚠️ Weaknesses</h4>
                    <div className="backdrop-blur-md bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <ul className="space-y-2">
                        {competitor.ai_weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-gray-300 text-sm">• {weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {competitor.ai_opportunities && competitor.ai_opportunities.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-blue-400 mb-3">🎯 Opportunities for ACM</h4>
                    <div className="backdrop-blur-md bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <ul className="space-y-2">
                        {competitor.ai_opportunities.map((opp, idx) => (
                          <li key={idx} className="text-gray-300 text-sm">• {opp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {competitor.ai_threats && competitor.ai_threats.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-orange-400 mb-3">🚨 Threats to ACM</h4>
                    <div className="backdrop-blur-md bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                      <ul className="space-y-2">
                        {competitor.ai_threats.map((threat, idx) => (
                          <li key={idx} className="text-gray-300 text-sm">• {threat}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Focus Areas & Technology */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competitor.primary_focus && competitor.primary_focus.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3">🎯 Primary Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {competitor.primary_focus.map((focus, idx) => (
                        <span key={idx} className="px-4 py-2 backdrop-blur-md bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300">
                          {focus}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {competitor.technology_platforms && competitor.technology_platforms.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3">🔬 Technology Platforms</h4>
                    <div className="flex flex-wrap gap-2">
                      {competitor.technology_platforms.map((tech, idx) => (
                        <span key={idx} className="px-4 py-2 backdrop-blur-md bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pipeline Stage */}
              {competitor.pipeline_stage && (
                <div>
                  <h4 className="text-lg font-bold text-white mb-4">🧪 Pipeline Overview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(competitor.pipeline_stage).map(([stage, count]) => (
                      <div key={stage} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-white mb-1">{count}</div>
                        <div className="text-sm text-gray-400 capitalize">{stage.replace('phase', 'Phase ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Notes */}
              {competitor.strategic_notes && (
                <div>
                  <h4 className="text-lg font-bold text-white mb-3">📝 Strategic Notes</h4>
                  <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-gray-300 whitespace-pre-wrap">{competitor.strategic_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trials' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Clinical Trials ({competitor.trials?.length || 0})</h3>
              {competitor.trials && competitor.trials.length > 0 ? (
                <div className="space-y-4">
                  {competitor.trials.map((trial) => (
                    <div key={trial.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-lg font-bold text-white flex-1">{trial.trial_title}</h4>
                        {trial.nct_id && (
                          <a
                            href={`https://clinicaltrials.gov/study/${trial.nct_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            {trial.nct_id}
                          </a>
                        )}
                      </div>

                      <div className="flex gap-4 mb-3">
                        {trial.phase && (
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-semibold">
                            {trial.phase}
                          </span>
                        )}
                        {trial.status && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm">
                            {trial.status}
                          </span>
                        )}
                        {trial.relevance_score && (
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg text-sm">
                            Relevance: {trial.relevance_score}/100
                          </span>
                        )}
                      </div>

                      {trial.indication && (
                        <div className="text-sm text-gray-300 mb-2">
                          <span className="font-semibold">Indication:</span> {trial.indication}
                        </div>
                      )}

                      {trial.intervention && (
                        <div className="text-sm text-gray-300 mb-2">
                          <span className="font-semibold">Intervention:</span> {trial.intervention}
                        </div>
                      )}

                      {trial.competitive_notes && (
                        <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-400">
                          <span className="font-semibold text-gray-300">Competitive Notes:</span> {trial.competitive_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No clinical trials tracked yet. Run AI research to discover trials.
                </div>
              )}
            </div>
          )}

          {activeTab === 'publications' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Publications ({competitor.publications?.length || 0})</h3>
              {competitor.publications && competitor.publications.length > 0 ? (
                <div className="space-y-4">
                  {competitor.publications.map((pub) => (
                    <div key={pub.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-white mb-2">{pub.title}</h4>

                      {pub.authors && pub.authors.length > 0 && (
                        <div className="text-sm text-gray-400 mb-2">
                          {pub.authors.slice(0, 3).join(', ')}
                          {pub.authors.length > 3 && ` et al.`}
                        </div>
                      )}

                      <div className="flex gap-4 mb-3 text-sm">
                        {pub.journal && <span className="text-gray-300">{pub.journal}</span>}
                        {pub.publication_date && (
                          <span className="text-gray-400">
                            {new Date(pub.publication_date).toLocaleDateString()}
                          </span>
                        )}
                        {pub.citation_count && (
                          <span className="text-purple-400">{pub.citation_count} citations</span>
                        )}
                      </div>

                      {pub.abstract && (
                        <p className="text-sm text-gray-300 mb-3 line-clamp-3">{pub.abstract}</p>
                      )}

                      {pub.key_findings && (
                        <div className="text-sm text-gray-300 mb-3">
                          <span className="font-semibold">Key Findings:</span> {pub.key_findings}
                        </div>
                      )}

                      {pub.relevance_to_acm && (
                        <div className="mt-3 pt-3 border-t border-white/10 text-sm">
                          <span className="font-semibold text-orange-400">Relevance to ACM:</span>
                          <span className="text-gray-300 ml-2">{pub.relevance_to_acm}</span>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        {pub.pubmed_id && (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pubmed_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            PubMed
                          </a>
                        )}
                        {pub.doi && (
                          <a
                            href={`https://doi.org/${pub.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          >
                            DOI
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No publications tracked yet. Run AI research to discover publications.
                </div>
              )}
            </div>
          )}

          {activeTab === 'updates' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Recent Updates ({competitor.updates?.length || 0})</h3>
              {competitor.updates && competitor.updates.length > 0 ? (
                <div className="space-y-4">
                  {competitor.updates.map((update) => (
                    <div key={update.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-1">{update.title}</h4>
                          <div className="flex gap-3 text-sm">
                            <span className="text-gray-400">
                              {update.published_date ? new Date(update.published_date).toLocaleDateString() : 'Date unknown'}
                            </span>
                            {update.source_name && (
                              <span className="text-purple-400">{update.source_name}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            update.impact_level === 'critical' ? 'bg-red-500/20 text-red-400' :
                            update.impact_level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            update.impact_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {update.impact_level} impact
                          </span>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs">
                            {update.update_type}
                          </span>
                        </div>
                      </div>

                      {update.description && (
                        <p className="text-gray-300 text-sm mb-3">{update.description}</p>
                      )}

                      {update.source_url && (
                        <a
                          href={update.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center gap-1"
                        >
                          View Source →
                        </a>
                      )}

                      {update.requires_action && update.action_notes && (
                        <div className="mt-3 pt-3 border-t border-white/10 bg-red-500/10 -m-6 mt-3 p-6 rounded-b-xl">
                          <div className="text-red-400 font-semibold text-sm mb-1">⚠️ Action Required</div>
                          <div className="text-gray-300 text-sm">{update.action_notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No updates tracked yet. Run AI research to discover recent updates.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
