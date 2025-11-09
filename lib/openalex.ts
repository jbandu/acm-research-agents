/**
 * OpenAlex API Service
 *
 * Free, open alternative to Web of Science providing:
 * - Academic papers (works)
 * - Author profiles
 * - Institutions
 * - Research concepts/topics
 * - Venues (journals/conferences)
 *
 * API Docs: https://docs.openalex.org/
 * No API key required - 100k requests/day (polite pool with email)
 * Rate limit: 10 requests/second
 */

const OPENALEX_BASE_URL = 'https://api.openalex.org';
const OPENALEX_EMAIL = process.env.OPENALEX_EMAIL || 'madhavan@acmbiolabs.com';
const MAX_RESULTS_DEFAULT = parseInt(process.env.OPENALEX_MAX_RESULTS_DEFAULT || '20', 10);
const CACHE_ENABLED = process.env.OPENALEX_CACHE_ENABLED === 'true';

// Simple in-memory cache (can be replaced with Redis for production)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Rate limiting
let requestCount = 0;
let rateLimitWindow = Date.now();
const MAX_REQUESTS_PER_SECOND = 10;

/**
 * OpenAlex Work (Research Paper) Interface
 */
export interface OpenAlexWork {
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
  type?: string;
  referenced_works?: string[];
  related_works?: string[];
}

/**
 * Standardized result format matching other sources
 */
export interface OpenAlexResult {
  source: 'OpenAlex';
  query: string;
  results: OpenAlexWork[];
  count: number;
  metadata: {
    page: number;
    per_page: number;
    total_results?: number;
    execution_time_ms: number;
    filters_applied?: any;
    error?: string;
  };
}

/**
 * Search filters
 */
export interface SearchFilters {
  from_publication_date?: string; // YYYY-MM-DD
  to_publication_date?: string;
  is_oa?: boolean; // Open access only
  type?: string; // article, book-chapter, etc
  institutions?: string[];
  concepts?: string[];
  cited_by_count_min?: number;
}

/**
 * Rate limiting with exponential backoff
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();

  // Reset counter every second
  if (now - rateLimitWindow > 1000) {
    requestCount = 0;
    rateLimitWindow = now;
  }

  if (requestCount >= MAX_REQUESTS_PER_SECOND) {
    const waitTime = 1000 - (now - rateLimitWindow);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCount = 0;
    rateLimitWindow = Date.now();
  }

  requestCount++;
}

/**
 * Fetch with caching and error handling
 */
async function fetchWithCache(url: string, cacheKey?: string): Promise<any> {
  // Check cache first
  if (CACHE_ENABLED && cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`OpenAlex: Cache hit for ${cacheKey}`);
      return cached.data;
    }
  }

  // Rate limiting
  await rateLimit();

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': `ACM-Research-Agents (mailto:${OPENALEX_EMAIL})`,
      },
    });

    if (response.status === 429) {
      // Rate limit exceeded
      console.warn('OpenAlex: Rate limit exceeded, retrying after delay...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchWithCache(url, cacheKey); // Retry
    }

    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the result
    if (CACHE_ENABLED && cacheKey) {
      cache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  } catch (error: any) {
    console.error('OpenAlex API error:', error.message);
    throw error;
  }
}

/**
 * Reconstruct abstract from inverted index
 */
function reconstructAbstract(invertedIndex: Record<string, number[]> | undefined): string {
  if (!invertedIndex) return '';

  const words: Array<{ word: string; position: number }> = [];

  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push({ word, position: pos });
    }
  }

  words.sort((a, b) => a.position - b.position);
  return words.map(w => w.word).join(' ');
}

/**
 * Build filter string for API query
 */
function buildFilterString(filters?: SearchFilters): string {
  if (!filters) return '';

  const parts: string[] = [];

  if (filters.from_publication_date) {
    parts.push(`from_publication_date:${filters.from_publication_date}`);
  }
  if (filters.to_publication_date) {
    parts.push(`to_publication_date:${filters.to_publication_date}`);
  }
  if (filters.is_oa !== undefined) {
    parts.push(`is_oa:${filters.is_oa}`);
  }
  if (filters.type) {
    parts.push(`type:${filters.type}`);
  }
  if (filters.cited_by_count_min) {
    parts.push(`cited_by_count:>${filters.cited_by_count_min}`);
  }
  if (filters.institutions && filters.institutions.length > 0) {
    parts.push(`institutions.id:${filters.institutions.join('|')}`);
  }
  if (filters.concepts && filters.concepts.length > 0) {
    parts.push(`concepts.id:${filters.concepts.join('|')}`);
  }

  return parts.join(',');
}

/**
 * Search works (research papers)
 */
export async function searchWorks(
  query: string,
  maxResults: number = MAX_RESULTS_DEFAULT,
  filters?: SearchFilters
): Promise<OpenAlexResult> {
  const startTime = Date.now();

  try {
    const params = new URLSearchParams({
      search: query,
      mailto: OPENALEX_EMAIL,
      per_page: Math.min(maxResults, 200).toString(), // OpenAlex max is 200
      page: '1',
    });

    const filterString = buildFilterString(filters);
    if (filterString) {
      params.append('filter', filterString);
    }

    const url = `${OPENALEX_BASE_URL}/works?${params.toString()}`;
    const cacheKey = `works:${query}:${filterString}:${maxResults}`;

    const data = await fetchWithCache(url, cacheKey);

    const executionTime = Date.now() - startTime;

    return {
      source: 'OpenAlex',
      query,
      results: data.results || [],
      count: data.results?.length || 0,
      metadata: {
        page: 1,
        per_page: maxResults,
        total_results: data.meta?.count,
        execution_time_ms: executionTime,
        filters_applied: filters,
      },
    };
  } catch (error: any) {
    console.error('searchWorks error:', error);
    return {
      source: 'OpenAlex',
      query,
      results: [],
      count: 0,
      metadata: {
        page: 1,
        per_page: maxResults,
        execution_time_ms: Date.now() - startTime,
        error: error.message,
      },
    };
  }
}

/**
 * Get work by DOI
 */
export async function getWorkByDOI(doi: string): Promise<OpenAlexWork | null> {
  try {
    // Normalize DOI
    const normalizedDOI = doi.replace(/^https?:\/\/doi\.org\//, '');
    const url = `${OPENALEX_BASE_URL}/works/doi:${normalizedDOI}?mailto=${OPENALEX_EMAIL}`;

    const data = await fetchWithCache(url, `work:doi:${normalizedDOI}`);
    return data;
  } catch (error: any) {
    console.error('getWorkByDOI error:', error);
    return null;
  }
}

/**
 * Get work by OpenAlex ID
 */
export async function getWorkById(workId: string): Promise<OpenAlexWork | null> {
  try {
    const url = `${OPENALEX_BASE_URL}/works/${workId}?mailto=${OPENALEX_EMAIL}`;
    const data = await fetchWithCache(url, `work:${workId}`);
    return data;
  } catch (error: any) {
    console.error('getWorkById error:', error);
    return null;
  }
}

/**
 * Search works by author
 */
export async function searchByAuthor(
  authorName: string,
  maxResults: number = MAX_RESULTS_DEFAULT
): Promise<OpenAlexResult> {
  return searchWorks(authorName, maxResults, {});
}

/**
 * Get trending topics in a field
 */
export async function getTrendingTopics(
  field: string = 'cancer',
  maxResults: number = 20
): Promise<OpenAlexResult> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return searchWorks(field, maxResults, {
    from_publication_date: oneYearAgo.toISOString().split('T')[0],
    cited_by_count_min: 10,
  });
}

/**
 * Get citation network for a work
 */
export async function getCitationNetwork(
  workId: string,
  depth: number = 2
): Promise<{ work: OpenAlexWork | null; references: OpenAlexWork[]; citations: OpenAlexWork[] }> {
  try {
    const work = await getWorkById(workId);
    if (!work) {
      return { work: null, references: [], citations: [] };
    }

    // Get referenced works (what this paper cites)
    const references: OpenAlexWork[] = [];
    if (work.referenced_works && work.referenced_works.length > 0 && depth > 0) {
      const refPromises = work.referenced_works.slice(0, 10).map(id => getWorkById(id.split('/').pop() || ''));
      const refResults = await Promise.all(refPromises);
      references.push(...refResults.filter(Boolean) as OpenAlexWork[]);
    }

    // Get works that cite this paper
    const citations: OpenAlexWork[] = [];
    if (depth > 0) {
      const citationsResult = await searchWorks(`cites:${workId}`, 10);
      citations.push(...citationsResult.results);
    }

    return { work, references, citations };
  } catch (error: any) {
    console.error('getCitationNetwork error:', error);
    return { work: null, references: [], citations: [] };
  }
}

/**
 * Get related works
 */
export async function getRelatedWorks(workId: string, maxResults: number = 10): Promise<OpenAlexWork[]> {
  try {
    const work = await getWorkById(workId);
    if (!work || !work.related_works) {
      return [];
    }

    const relatedPromises = work.related_works.slice(0, maxResults).map(id =>
      getWorkById(id.split('/').pop() || '')
    );
    const results = await Promise.all(relatedPromises);
    return results.filter(Boolean) as OpenAlexWork[];
  } catch (error: any) {
    console.error('getRelatedWorks error:', error);
    return [];
  }
}

/**
 * Get works by institution
 */
export async function getWorksByInstitution(
  institutionName: string,
  maxResults: number = MAX_RESULTS_DEFAULT
): Promise<OpenAlexResult> {
  return searchWorks(institutionName, maxResults, {});
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
  console.log('OpenAlex cache cleared');
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

/**
 * Create OpenAlex context string for LLM prompts
 * Formats academic papers into structured context for research analysis
 */
export function createOpenAlexContext(works: OpenAlexWork[]): string {
  if (works.length === 0) {
    return '';
  }

  const contextLines = works.slice(0, 10).map((work, index) => {
    // Extract author names
    const authors = work.authorships
      .slice(0, 3)
      .map(a => a.author.display_name)
      .join(', ');
    const authorSuffix = work.authorships.length > 3 ? ' et al.' : '';
    const authorString = authors + authorSuffix;

    // Get abstract snippet (first 200 chars)
    const abstract = reconstructAbstract(work.abstract_inverted_index);
    const abstractSnippet = abstract ? abstract.substring(0, 200) + '...' : '';

    // Format citation count and open access status
    const citations = work.cited_by_count > 0 ? ` [${work.cited_by_count} citations]` : '';
    const openAccess = work.open_access?.is_oa ? ' [Open Access]' : '';
    const doi = work.doi ? ` DOI: ${work.doi}` : '';

    return `${index + 1}. "${work.title}" by ${authorString} (${work.publication_date.substring(0, 4)})${citations}${openAccess}
   ${doi}
   ${abstractSnippet}`;
  });

  return `\n\n=== RELEVANT ACADEMIC LITERATURE ===\nThe following ${works.length} peer-reviewed papers from OpenAlex are relevant to this query:\n\n${contextLines.join('\n\n')}\n\n=== END LITERATURE CONTEXT ===\n\nPlease analyze the query considering this academic literature. When citing papers, use format [Author et al., Year] or [DOI: ${works[0].doi || 'ID'}].`;
}
