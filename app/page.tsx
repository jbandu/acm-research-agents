'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Workflow {
  id: string;
  name: string;
  description: string;
  domain: string;
  subdomain: string;
}

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ACM Research Agents
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Multi-LLM Research Intelligence Platform for Cancer Research
        </p>
        <p className="text-sm text-gray-500">
          By Jayaprakash Bandu - Precision AI Architect
        </p>
        <div className="mt-8">
          <Link href="/query" className="btn-primary text-lg">
            Start New Query
          </Link>
        </div>
      </div>

      {/* LLM Comparison Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <div className="llm-card llm-card-claude">
          <h3 className="text-lg font-semibold text-claude mb-2">Claude Sonnet 4.5</h3>
          <p className="text-sm text-gray-600">Deep mechanistic analysis & safety assessment</p>
        </div>
        <div className="llm-card llm-card-openai">
          <h3 className="text-lg font-semibold text-openai mb-2">GPT-4o</h3>
          <p className="text-sm text-gray-600">Broad pattern recognition across literature</p>
        </div>
        <div className="llm-card llm-card-gemini">
          <h3 className="text-lg font-semibold text-gemini mb-2">Gemini 1.5 Pro</h3>
          <p className="text-sm text-gray-600">Cross-validation & contradiction detection</p>
        </div>
        <div className="llm-card llm-card-grok">
          <h3 className="text-lg font-semibold text-grok mb-2">Grok 2</h3>
          <p className="text-sm text-gray-600">Real-time competitive intelligence</p>
        </div>
      </div>

      {/* Workflows Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Research Workflows</h2>
          <Link href="/workflows" className="text-blue-600 hover:text-blue-700 font-medium">
            Manage Workflows →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No workflows found. Run the database schema to create default workflows.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="llm-card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {workflow.domain}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{workflow.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{workflow.subdomain}</span>
                  <Link 
                    href={`/query?workflow=${workflow.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Use →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🔄 Parallel LLM Orchestration</h3>
            <p className="text-sm text-gray-600">
              Query Claude, GPT-4, Gemini, and Grok simultaneously for comprehensive analysis
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Consensus Detection</h3>
            <p className="text-sm text-gray-600">
              Automatically identify when all LLMs agree or flag conflicts for human review
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">👤 Human-in-the-Loop</h3>
            <p className="text-sm text-gray-600">
              Every decision approved by researchers with complete audit trail
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💾 Smart Caching</h3>
            <p className="text-sm text-gray-600">
              Reuse recent results to minimize API costs and speed up research
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📚 Direct API Integration</h3>
            <p className="text-sm text-gray-600">
              Connect to PubMed, ClinicalTrials.gov, and patent databases
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Analytics & History</h3>
            <p className="text-sm text-gray-600">
              Track performance, costs, and decision patterns over time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
