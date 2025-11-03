'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Workflow {
  id: string;
  name: string;
  description: string;
  domain: string;
  subdomain: string;
  icon?: string;
  use_count?: number;
}

interface Stats {
  totalQueries: number;
  totalWorkflows: number;
  avgConsensusRate: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<Stats>({ totalQueries: 0, totalWorkflows: 0, avgConsensusRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (status === 'authenticated') {
      fetchData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
    // If status is 'loading', keep loading state true
  }, [status]);

  const fetchData = async () => {
    try {
      const [workflowsRes, statsRes] = await Promise.all([
        fetch('/api/workflows').catch(err => {
          console.error('Failed to fetch workflows:', err);
          return { ok: false, json: async () => ({ workflows: [] }) };
        }),
        fetch('/api/history?limit=1000').catch(err => {
          console.error('Failed to fetch history:', err);
          return { ok: false, json: async () => ({ queries: [] }) };
        }),
      ]);

      // Check if responses are OK before parsing JSON
      if (!workflowsRes.ok || !statsRes.ok) {
        console.error('Failed to fetch data');
        setLoading(false);
        return;
      }

      const workflowsData = await workflowsRes.json().catch((err) => {
        console.error('Failed to parse workflows JSON:', err);
        return { workflows: [] };
      });
      const historyData = await statsRes.json().catch((err) => {
        console.error('Failed to parse history JSON:', err);
        return { queries: [] };
      });

      console.log('Workflows data:', JSON.stringify(workflowsData, null, 2));
      console.log('History data:', JSON.stringify(historyData, null, 2));

      const workflowsList = Array.isArray(workflowsData.workflows) ? workflowsData.workflows : [];
      setWorkflows(workflowsList);

      // Calculate stats
      const queries = Array.isArray(historyData.queries) ? historyData.queries : [];
      const consensusQueries = queries.filter((q: any) =>
        q.consensus_level === 'high' || q.consensus_level === 'medium'
      );

      setStats({
        totalQueries: queries.length,
        totalWorkflows: Array.isArray(workflowsData.workflows) ? workflowsData.workflows.length : 0,
        avgConsensusRate: queries.length > 0 ? Math.round((consensusQueries.length / queries.length) * 100) : 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set safe defaults on error
      setWorkflows([]);
      setStats({ totalQueries: 0, totalWorkflows: 0, avgConsensusRate: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
              AI-Powered Research Intelligence Platform
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                ACM Research Agents
              </span>
            </h1>

            <p className="text-2xl text-gray-700 mb-4 font-medium">
              Multi-LLM Research Intelligence Platform
            </p>

            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Query 4 frontier AI models simultaneously. Get consensus-driven insights for cancer research.
              Make confident decisions backed by multiple perspectives.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {session ? (
                <>
                  <Link
                    href="/query"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Start New Query →
                  </Link>
                  <Link
                    href="/workflows"
                    className="px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold text-lg border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all duration-200"
                  >
                    Explore Workflows
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Sign In to Get Started →
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold text-lg border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all duration-200"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {loading ? '...' : String(stats.totalQueries || 0)}
                </div>
                <div className="text-sm text-gray-600 font-medium">Research Queries</div>
                <div className="text-xs text-gray-500 mt-1">Analyzed across 4 LLMs</div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {loading ? '...' : `${String(stats.avgConsensusRate || 0)}%`}
                </div>
                <div className="text-sm text-gray-600 font-medium">Consensus Rate</div>
                <div className="text-xs text-gray-500 mt-1">High agreement on insights</div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {loading ? '...' : String(stats.totalWorkflows || 0)}
                </div>
                <div className="text-sm text-gray-600 font-medium">Research Workflows</div>
                <div className="text-xs text-gray-500 mt-1">Domain-optimized templates</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">From question to consensus in 4 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Ask Your Question</h3>
              <p className="text-sm text-blue-100">
                Enter your research query or select from pre-built workflow templates
              </p>
            </div>
            {/* Connecting Arrow */}
            <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300"></div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Parallel Analysis</h3>
              <p className="text-sm text-purple-100">
                4 frontier LLMs analyze your query simultaneously in real-time
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300"></div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Consensus Detection</h3>
              <p className="text-sm text-indigo-100">
                AI identifies agreements, conflicts, and confidence levels automatically
              </p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300"></div>
          </div>

          {/* Step 4 */}
          <div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl font-bold mb-4">4</div>
              <h3 className="text-xl font-semibold mb-2">Human Decision</h3>
              <p className="text-sm text-green-100">
                Review all responses and make informed decisions with full audit trail
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LLM Models Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powered by 4 Frontier AI Models</h2>
            <p className="text-lg text-gray-600">Each model brings unique strengths to your research</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Claude */}
            <div className="llm-card llm-card-claude hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-claude flex items-center justify-center text-white text-xl font-bold">
                  C
                </div>
                <div className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  Anthropic
                </div>
              </div>
              <h3 className="text-lg font-semibold text-claude mb-2">Claude Sonnet 4.5</h3>
              <p className="text-sm text-gray-600 mb-4">
                Deep mechanistic analysis, safety assessment, and nuanced scientific reasoning
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-2">✓</span> Best for complex analysis
              </div>
            </div>

            {/* OpenAI */}
            <div className="llm-card llm-card-openai hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-openai flex items-center justify-center text-white text-xl font-bold">
                  O
                </div>
                <div className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded">
                  OpenAI
                </div>
              </div>
              <h3 className="text-lg font-semibold text-openai mb-2">GPT-4o</h3>
              <p className="text-sm text-gray-600 mb-4">
                Broad pattern recognition across medical literature with multimodal capabilities
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-2">✓</span> Best for literature synthesis
              </div>
            </div>

            {/* Gemini */}
            <div className="llm-card llm-card-gemini hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gemini flex items-center justify-center text-white text-xl font-bold">
                  G
                </div>
                <div className="text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded">
                  Google
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gemini mb-2">Gemini 2.0 Flash</h3>
              <p className="text-sm text-gray-600 mb-4">
                Cross-validation, contradiction detection, and rapid information processing
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-2">✓</span> Best for verification
              </div>
            </div>

            {/* Grok */}
            <div className="llm-card llm-card-grok hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-grok flex items-center justify-center text-white text-xl font-bold">
                  X
                </div>
                <div className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  xAI
                </div>
              </div>
              <h3 className="text-lg font-semibold text-grok mb-2">Grok 2</h3>
              <p className="text-sm text-gray-600 mb-4">
                Real-time competitive intelligence and emerging research trend analysis
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-2">✓</span> Best for trends
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Research Platform</h2>
          <p className="text-lg text-gray-600">Everything you need for AI-powered cancer research</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              🔄
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Parallel LLM Orchestration</h3>
            <p className="text-gray-600">
              Query all 4 models simultaneously with a single request. Compare responses, confidence scores, and reasoning approaches in real-time.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              ✅
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatic Consensus Detection</h3>
            <p className="text-gray-600">
              AI-powered analysis identifies when models agree (high/medium consensus) or flags conflicts that need human review.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              🎯
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Domain-Optimized Workflows</h3>
            <p className="text-gray-600">
              Pre-built templates for specific research areas with optimized prompts and parameters tailored to cancer research domains.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-yellow-500 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              👤
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Human-in-the-Loop</h3>
            <p className="text-gray-600">
              Every AI recommendation requires human approval. Complete audit trail of decisions, selections, and custom modifications.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              💾
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Caching & Re-run</h3>
            <p className="text-gray-600">
              24-hour cache minimizes API costs. Full query history with one-click re-run capability for updated analysis.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-red-500 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
            <p className="text-gray-600">
              Track performance metrics, token usage, response times, and consensus patterns. Filter and search complete query history.
            </p>
          </div>

          {/* Feature 7 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-pink-500 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              🔐
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Authentication</h3>
            <p className="text-gray-600">
              Role-based access control with secure authentication. Protect sensitive research data with enterprise-grade security.
            </p>
          </div>

          {/* Feature 8 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-teal-500 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              🗂️
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Query Collections</h3>
            <p className="text-gray-600">
              Organize related queries into collections. Track research projects, share with team members, and maintain research context.
            </p>
          </div>

          {/* Feature 9 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              ⚡
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Processing</h3>
            <p className="text-gray-600">
              Watch as all 4 models process your query in parallel. See confidence scores, response times, and token usage as they happen.
            </p>
          </div>

          {/* Feature 10 - Competitor Intelligence */}
          <Link href="/competitors" className="bg-white rounded-lg p-6 border border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all duration-300 block">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-4">
              🎯
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Competitor Intelligence</h3>
            <p className="text-gray-600">
              Interactive world map of competitors. AI-powered weekly research and automated competitive intelligence newsletters.
            </p>
            <div className="mt-4 text-purple-600 font-semibold flex items-center gap-2">
              View Competitors →
            </div>
          </Link>
        </div>
      </div>

      {/* Research Workflows Preview */}
      {workflows.length > 0 && (
        <div className="bg-gradient-to-b from-gray-50 to-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Research Workflows</h2>
                <p className="text-lg text-gray-600">Pre-optimized templates for common research scenarios</p>
              </div>
              <Link
                href={session ? '/workflows' : '/auth/signin'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {session ? 'View All Workflows →' : 'Sign In to View Workflows →'}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.slice(0, 6).map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{String(workflow.icon || '🔬')}</div>
                    <span className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {String(workflow.domain || 'General')}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{String(workflow.name || 'Workflow')}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{String(workflow.description || '')}</p>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {String(workflow.use_count || 0)} uses
                    </span>
                    <Link
                      href={session ? `/query?workflow=${workflow.id}` : '/auth/signin'}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      Use Workflow
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Use Cases Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for Cancer Research</h2>
          <p className="text-lg text-gray-600">Accelerate discovery across multiple research domains</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Use Case 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Preclinical Research</h3>
            <p className="text-gray-700 mb-4">
              Target identification, mechanism of action analysis, dosing optimization, and safety profiling with multi-model consensus.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Compare drug-target interactions across models
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Identify potential safety concerns early
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Validate mechanistic hypotheses
              </li>
            </ul>
          </div>

          {/* Use Case 2 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-8 border border-purple-200">
            <div className="text-4xl mb-4">⚕️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Clinical Development</h3>
            <p className="text-gray-700 mb-4">
              Trial design optimization, patient stratification, endpoint selection, and competitive landscape analysis.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Design optimal trial protocols
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Identify biomarker strategies
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                Assess competitive positioning
              </li>
            </ul>
          </div>

          {/* Use Case 3 */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-8 border border-green-200">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Literature Analysis</h3>
            <p className="text-gray-700 mb-4">
              Comprehensive evidence synthesis, contradiction detection, and emerging trend identification across research domains.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Synthesize insights from multiple papers
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Detect conflicting evidence
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Track emerging research trends
              </li>
            </ul>
          </div>

          {/* Use Case 4 */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-8 border border-orange-200">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Regulatory Strategy</h3>
            <p className="text-gray-700 mb-4">
              Regulatory pathway analysis, risk assessment, submission strategy optimization, and post-market surveillance planning.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">•</span>
                Evaluate regulatory pathways
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">•</span>
                Assess submission readiness
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 mr-2">•</span>
                Plan risk mitigation strategies
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Research?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the next generation of AI-powered cancer research. Query multiple frontier models.
            Get consensus-driven insights. Make confident decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {session ? (
              <>
                <Link
                  href="/query"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Start Your First Query
                </Link>
                <Link
                  href="/history"
                  className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold text-lg border-2 border-blue-400 hover:bg-blue-800 transition-all duration-200"
                >
                  View Query History
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Sign In Now
                </Link>
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold text-lg border-2 border-blue-400 hover:bg-blue-800 transition-all duration-200"
                >
                  Create Free Account
                </Link>
              </>
            )}
          </div>

          {session && session.user && (
            <p className="mt-6 text-blue-200 text-sm">
              Welcome back, {String(session.user?.name || session.user?.email || 'User')}!
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">
                <span className="text-white font-semibold">ACM Research Agents</span> - AI-Powered Research Intelligence
              </p>
              <p className="text-xs mt-1">
                Built by Jayaprakash Bandu - Precision AI Architect
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/query" className="hover:text-white transition-colors">Query</Link>
              <Link href="/workflows" className="hover:text-white transition-colors">Workflows</Link>
              <Link href="/history" className="hover:text-white transition-colors">History</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
