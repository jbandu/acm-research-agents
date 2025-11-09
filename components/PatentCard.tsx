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
    if (!score) return 'bg-dark-elevated text-dark-text-muted border border-dark-border';
    if (score >= 80) return 'bg-accent-green/10 text-accent-green border border-accent-green/30';
    if (score >= 60) return 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30';
    if (score >= 40) return 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30';
    return 'bg-dark-elevated text-dark-text-muted border border-dark-border';
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
    <div className="bg-dark-surface border border-dark-border rounded-lg p-5 hover:shadow-lg hover:border-accent-purple/50 transition-all duration-200 group">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold text-accent-purple bg-accent-purple/10 px-2 py-1 rounded border border-accent-purple/30">
              {patent.patentNumber}
            </span>
            {patent.relevanceScore !== undefined && (
              <span className={`text-xs font-medium px-2 py-1 rounded ${getRelevanceColor(patent.relevanceScore)}`}>
                {patent.relevanceScore}% relevant
              </span>
            )}
          </div>
          <div className="text-sm text-dark-text-muted font-medium">
            {patent.assignee}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-dark-text mb-2 leading-snug group-hover:text-accent-purple transition-colors">
        {patent.title}
      </h3>

      {/* Snippet */}
      <p className="text-sm text-dark-text-muted leading-relaxed mb-4 line-clamp-3">
        {patent.snippet}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-dark-border">
        <div className="text-xs text-dark-text-subtle">
          📅 {formatDate(patent.publicationDate)}
        </div>
        <div className="flex gap-2">
          <a
            href={patent.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium px-3 py-1.5 bg-gradient-to-br from-accent-purple to-accent-purple/80 text-white rounded hover:from-accent-purple/90 hover:to-accent-purple/70 transition-all flex items-center gap-1 shadow-sm"
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
              className="text-xs font-medium px-3 py-1.5 bg-dark-elevated border border-dark-border text-dark-text rounded hover:bg-dark-surface transition-colors flex items-center gap-1"
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
