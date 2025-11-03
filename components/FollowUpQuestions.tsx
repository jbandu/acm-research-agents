'use client';

import { useRouter } from 'next/navigation';

interface FollowUpQuestion {
  id?: string;
  question: string;
  rationale: string;
  category: 'clarification' | 'deep-dive' | 'alternative' | 'validation';
}

interface FollowUpQuestionsProps {
  questions: FollowUpQuestion[];
  originalQueryId?: string;
  onQuestionClick?: (question: FollowUpQuestion, index: number) => void;
}

export default function FollowUpQuestions({
  questions,
  originalQueryId,
  onQuestionClick
}: FollowUpQuestionsProps) {
  const router = useRouter();

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleQuestionClick = async (question: FollowUpQuestion, index: number) => {
    // Track usage if originalQueryId and question.id are provided
    if (originalQueryId && question.id) {
      try {
        await fetch('/api/followup/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            followup_question_id: question.id,
            original_query_id: originalQueryId,
          }),
        });
      } catch (error) {
        console.error('Failed to track follow-up question usage:', error);
      }
    }

    // Call custom handler if provided
    if (onQuestionClick) {
      onQuestionClick(question, index);
    }

    // Navigate to query page with prefilled question
    const params = new URLSearchParams({
      prefill: question.question,
      source: 'followup',
    });

    if (originalQueryId) {
      params.append('original_query', originalQueryId);
    }

    if (question.id) {
      params.append('followup_id', question.id);
    }

    router.push(`/query?${params.toString()}`);
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'deep-dive':
        return 'bg-blue-100 text-blue-700';
      case 'clarification':
        return 'bg-purple-100 text-purple-700';
      case 'alternative':
        return 'bg-green-100 text-green-700';
      case 'validation':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'deep-dive':
        return '🔍';
      case 'clarification':
        return '❓';
      case 'alternative':
        return '🔄';
      case 'validation':
        return '✓';
      default:
        return '💡';
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-acm-brand-light shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-acm-brand to-acm-brand-dark flex items-center justify-center shadow-sm">
          <span className="text-white text-xl">💡</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Suggested Follow-Up Questions</h3>
          <p className="text-sm text-gray-600">Deepen your research with these AI-generated questions</p>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => (
          <button
            key={question.id || index}
            onClick={() => handleQuestionClick(question, index)}
            className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-acm-brand hover:bg-acm-blue-lightest transition-all group"
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-acm-brand to-acm-brand-dark text-white text-sm font-bold flex items-center justify-center shadow-sm">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-acm-brand mb-2 leading-relaxed">
                  {question.question}
                </p>
                {question.rationale && (
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">{question.rationale}</p>
                )}
                {question.category && (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(question.category)}`}>
                      <span>{getCategoryIcon(question.category)}</span>
                      {question.category}
                    </span>
                  </div>
                )}
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-acm-brand flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Click any question to start a new query with that context
        </p>
      </div>
    </div>
  );
}
