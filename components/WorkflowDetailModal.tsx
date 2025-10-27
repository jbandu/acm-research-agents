'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowTemplate } from '@/types/workflow';

interface WorkflowDetailModalProps {
  workflow: WorkflowTemplate;
  onClose: () => void;
}

export default function WorkflowDetailModal({ workflow, onClose }: WorkflowDetailModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [parameters, setParameters] = useState<Record<string, any>>({});

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectExample = (example: string) => {
    setQueryText(example);
  };

  const handleRunWorkflow = async () => {
    if (!queryText.trim()) {
      alert('Please enter a research question');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_text: queryText,
          parameters,
          created_by: 'current_user', // TODO: Replace with actual user auth
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
        return;
      }

      // Close modal and redirect to query results
      onClose();
      router.push(`/query?id=${data.query_id}`);
    } catch (error: any) {
      console.error('Workflow execution error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderParameterInput = (key: string, paramDef: any) => {
    const { type, label, required, options, placeholder, default: defaultValue } = paramDef;

    switch (type) {
      case 'select':
        return (
          <select
            value={parameters[key] || defaultValue || ''}
            onChange={(e) => handleParameterChange(key, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {options?.map((option: string) => (
              <key key={option} value={option}>
                {option}
              </key>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={parameters[key] || defaultValue || ''}
            onChange={(e) => handleParameterChange(key, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={parameters[key] || defaultValue || ''}
            onChange={(e) => handleParameterChange(key, parseInt(e.target.value))}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      default:
        return (
          <input
            type="text"
            value={parameters[key] || defaultValue || ''}
            onChange={(e) => handleParameterChange(key, e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{workflow.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{workflow.name}</h2>
                <p className="text-sm text-gray-600">{workflow.category}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">About This Workflow</h3>
              <p className="text-gray-600">{workflow.description}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estimated duration: {workflow.estimated_duration_minutes} minutes
              </div>
            </div>

            {/* Example Questions */}
            {workflow.example_questions && workflow.example_questions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Example Questions</h3>
                <div className="space-y-2">
                  {workflow.example_questions.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectExample(example)}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm text-gray-700"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Parameters */}
            {workflow.required_parameters && Object.keys(workflow.required_parameters).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Parameters</h3>
                <div className="space-y-4">
                  {Object.entries(workflow.required_parameters).map(([key, paramDef]: [string, any]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {paramDef.label || key}
                        {paramDef.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderParameterInput(key, paramDef)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Question *
              </label>
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your research question here..."
              />
              <p className="mt-2 text-xs text-gray-500">
                This question will be analyzed by all 4 LLMs using the optimized workflow prompt
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRunWorkflow}
                disabled={loading || !queryText.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running Workflow...
                  </>
                ) : (
                  'Run Workflow'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
