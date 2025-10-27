'use client';

import { useState, useEffect } from 'react';
import { WorkflowTemplate } from '@/types/workflow';
import WorkflowDetailModal from './WorkflowDetailModal';

export default function WorkflowsTab() {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows?is_template=true');
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowClick = (workflow: WorkflowTemplate) => {
    setSelectedWorkflow(workflow);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedWorkflow(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Workflows</h1>
        <p className="text-gray-600">
          Pre-built workflows optimized for biotech research tasks. Each workflow includes specialized prompts
          and parameters to help you get the best results from all 4 LLMs.
        </p>
      </div>

      {/* Workflow Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            onClick={() => handleWorkflowClick(workflow)}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
          >
            {/* Icon and Name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="text-4xl mr-3">{workflow.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {workflow.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {workflow.estimated_duration_minutes} min
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {workflow.description}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {workflow.use_count} uses
              </div>
              <button className="text-sm text-blue-600 font-medium group-hover:underline">
                View Details →
              </button>
            </div>

            {/* Example Questions Preview */}
            {workflow.example_questions && workflow.example_questions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">EXAMPLE QUESTIONS</p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  "{workflow.example_questions[0]}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Custom Workflow Button */}
      <div className="text-center">
        <button
          onClick={() => {
            // TODO: Implement custom workflow builder
            alert('Custom workflow builder coming soon!');
          }}
          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Custom Workflow
        </button>
      </div>

      {/* Workflow Detail Modal */}
      {showModal && selectedWorkflow && (
        <WorkflowDetailModal
          workflow={selectedWorkflow}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
