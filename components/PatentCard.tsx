'use client';

interface Patent {
  patentNumber: string;
  title: string;
  assignee: string;
  publicationDate: string;
  url: string;
  snippet: string;
  pdfUrl?: string;
  relevanceScore?: number;
}

interface PatentCardProps {
  patent: Patent;
}

export default function PatentCard({ patent }: PatentCardProps) {
  const getRelevanceColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    try {
      // Handle various date formats
      if (dateStr.includes('-')) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg hover:border-purple-300 transition-all duration-200 group">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">
              {patent.patentNumber}
            </span>
            {patent.relevanceScore !== undefined && (
              <span className={`text-xs font-medium px-2 py-1 rounded ${getRelevanceColor(patent.relevanceScore)}`}>
                {patent.relevanceScore}% relevant
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {patent.assignee}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 leading-snug group-hover:text-purple-700 transition-colors">
        {patent.title}
      </h3>

      {/* Snippet */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
        {patent.snippet}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          📅 {formatDate(patent.publicationDate)}
        </div>
        <div className="flex gap-2">
          <a
            href={patent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Patent
          </a>
          {patent.pdfUrl && (
            <a
              href={patent.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
