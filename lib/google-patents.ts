import { getJson } from 'serpapi';

export interface PatentResult {
  patentNumber: string;
  title: string;
  assignee: string;
  publicationDate: string;
  url: string;
  snippet: string;
  pdfUrl?: string;
  relevanceScore?: number;
}

/**
 * Search Google Patents using SerpAPI
 * @param query - Search query string
 * @param limit - Number of results to return (default: 10)
 * @returns Array of patent results
 */
export async function searchGooglePatents(
  query: string,
  limit: number = 10
): Promise<PatentResult[]> {
  try {
    if (!process.env.SERPAPI_KEY) {
      console.warn('SERPAPI_KEY not configured. Skipping patent search.');
      return [];
    }

    console.log(`Searching Google Patents for: "${query}"`);

    const response = await getJson({
      engine: 'google_patents',
      q: query,
      api_key: process.env.SERPAPI_KEY,
      num: limit,
    });

    if (!response.organic_results || response.organic_results.length === 0) {
      console.log('No patent results found');
      return [];
    }

    const patents: PatentResult[] = response.organic_results.map((result: any, index: number) => ({
      patentNumber: result.patent_id || extractPatentNumber(result.link) || `PATENT-${index + 1}`,
      title: result.title || 'Untitled Patent',
      assignee: result.assignee || 'Unknown',
      publicationDate: result.publication_date || result.filing_date || 'Unknown',
      url: result.link || '',
      snippet: result.snippet || result.pdf_snippet || '',
      pdfUrl: result.pdf || undefined,
      relevanceScore: calculateRelevanceScore(result, query, index)
    }));

    console.log(`Found ${patents.length} patent results`);
    return patents;

  } catch (error: any) {
    console.error('Google Patents search error:', error);
    // Don't fail the entire query if patents fail
    return [];
  }
}

/**
 * Extract patent number from Google Patents URL
 */
function extractPatentNumber(url: string): string | null {
  if (!url) return null;

  // Google Patents URLs: https://patents.google.com/patent/US1234567A/en
  const match = url.match(/patent\/([A-Z]{2}\d+[A-Z]\d*)/i);
  return match ? match[1] : null;
}

/**
 * Calculate relevance score based on position and other factors
 */
function calculateRelevanceScore(result: any, query: string, index: number): number {
  let score = 100 - (index * 10); // Position-based score

  // Boost if assignee is major pharmaceutical company
  const majorCompanies = ['pfizer', 'moderna', 'merck', 'novartis', 'roche', 'genentech', 'bristol-myers', 'biontech'];
  if (majorCompanies.some(company => result.assignee?.toLowerCase().includes(company))) {
    score += 10;
  }

  // Boost if recent (within last 5 years)
  const year = parseInt(result.publication_date?.substring(0, 4) || '0');
  if (year >= new Date().getFullYear() - 5) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Create patent context string for LLM prompts
 */
export function createPatentContext(patents: PatentResult[]): string {
  if (patents.length === 0) {
    return '';
  }

  const contextLines = patents.slice(0, 10).map((patent, index) =>
    `${index + 1}. Patent ${patent.patentNumber} (${patent.assignee}, ${patent.publicationDate}):\n   ${patent.snippet || patent.title}`
  );

  return `\n\n=== RELEVANT PATENT LANDSCAPE ===\nThe following ${patents.length} patents are relevant to this query:\n\n${contextLines.join('\n\n')}\n\n=== END PATENT CONTEXT ===\n\nPlease analyze the query considering this patent landscape. Cite specific patents when relevant using format [Patent: ${patents[0].patentNumber}].`;
}
