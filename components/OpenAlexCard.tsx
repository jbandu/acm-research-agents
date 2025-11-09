'use client';

interface OpenAlexWork {
  id: string;
  doi?: string;
  title: string;
  publication_date: string;
  cited_by_count: number;
  authorships: Array<{
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    institutions: Array<{
      id: string;
      display_name: string;
      country_code?: string;
    }>;
  }>;
  abstract_inverted_index?: Record<string, number[]>;
  concepts: Array<{
    id: string;
    display_name: string;
    score: number;
    level: number;
  }>;
  primary_location?: {
    source?: {
      id: string;
      display_name: string;
      type: string;
    };
    is_oa: boolean;
    pdf_url?: string;
    landing_page_url?: string;
  };
  open_access?: {
    is_oa: boolean;
    oa_status: string;
    oa_url?: string;
  };
}

interface OpenAlexCardProps {
  work: OpenAlexWork;
}

export default function OpenAlexCard({ work }: OpenAlexCardProps) {
  const getCitationColor = (count: number) => {
    if (count >= 100) return 'bg-green-100 text-green-800 border-green-300';
    if (count >= 50) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (count >= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Get first 3 authors
  const authors = work.authorships
    .slice(0, 3)
    .map(a => a.author.display_name)
    .join(', ');
  const authorSuffix = work.authorships.length > 3 ? ' et al.' : '';

  // Reconstruct abstract from inverted index
  const reconstructAbstract = (invertedIndex?: Record<string, number[]>): string => {
    if (!invertedIndex) return '';
    const words: Array<{ word: string; position: number }> = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        words.push({ word, position: pos });
      }
    }
    words.sort((a, b) => a.position - b.position);
    return words.map(w => w.word).join(' ');
  };

  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const abstractSnippet = abstract ? abstract.substring(0, 200) + '...' : 'No abstract available';

  // Get primary URL for the paper
  const paperUrl = work.primary_location?.landing_page_url ||
                   (work.doi ? `https://doi.org/${work.doi}` :
                   `https://openalex.org/${work.id}`);

  const pdfUrl = work.primary_location?.pdf_url || work.open_access?.oa_url;

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-5 hover:shadow-lg hover:border-accent-blue/50 transition-all duration-200 group">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {work.cited_by_count > 0 && (
              <span className={`text-xs font-medium px-2 py-1 rounded border ${getCitationColor(work.cited_by_count)}`}>
                📊 {work.cited_by_count} citations
              </span>
            )}
            {work.open_access?.is_oa && (
              <span className="text-xs font-medium px-2 py-1 rounded bg-accent-green/10 text-accent-green border border-accent-green/30">
                🔓 Open Access
              </span>
            )}
            <span className="text-xs text-dark-text-muted font-medium">
              📅 {formatDate(work.publication_date)}
            </span>
          </div>
          {work.doi && (
            <div className="text-xs font-mono text-dark-text-muted mb-1">
              DOI: {work.doi}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-dark-text mb-2 leading-snug group-hover:text-accent-blue transition-colors">
        {work.title}
      </h3>

      {/* Authors */}
      <div className="text-sm text-dark-text-muted mb-3">
        <span className="font-medium">Authors:</span> {authors}{authorSuffix}
      </div>

      {/* Abstract Snippet */}
      <p className="text-sm text-dark-text-muted leading-relaxed mb-4 line-clamp-3">
        {abstractSnippet}
      </p>

      {/* Research Concepts */}
      {work.concepts && work.concepts.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {work.concepts.slice(0, 3).map((concept) => (
            <span
              key={concept.id}
              className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/30"
            >
              {concept.display_name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-dark-border">
        <div className="text-xs text-dark-text-subtle">
          {work.primary_location?.source?.display_name || 'OpenAlex'}
        </div>
        <div className="flex gap-2">
          <a
            href={paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium px-3 py-1.5 bg-gradient-to-br from-accent-blue to-accent-blue-dim text-white rounded hover:from-accent-blue-dim hover:to-accent-blue transition-all flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Paper
          </a>
          {pdfUrl && (
            <a
              href={pdfUrl}
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
