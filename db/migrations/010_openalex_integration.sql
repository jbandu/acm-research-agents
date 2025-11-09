-- Migration 010: OpenAlex Academic Literature Integration
-- Add OpenAlex search tracking and results storage for academic research analysis

-- OpenAlex searches table - tracks each academic literature search performed
CREATE TABLE IF NOT EXISTS openalex_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  search_timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- OpenAlex results table - stores individual work (paper) details
CREATE TABLE IF NOT EXISTS openalex_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES openalex_searches(id) ON DELETE CASCADE,
  work_id VARCHAR(255) NOT NULL, -- OpenAlex work ID (e.g., W2741809807)
  doi VARCHAR(255), -- DOI if available
  title TEXT NOT NULL,
  publication_date DATE,
  cited_by_count INTEGER DEFAULT 0,
  is_open_access BOOLEAN DEFAULT false,
  abstract TEXT, -- Reconstructed from inverted index
  authors JSONB, -- Array of author names
  concepts JSONB, -- Array of research concepts with scores
  pdf_url TEXT, -- Link to full text PDF if available
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(search_id, work_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_openalex_searches_query ON openalex_searches(query_id);
CREATE INDEX IF NOT EXISTS idx_openalex_searches_timestamp ON openalex_searches(search_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_openalex_results_search ON openalex_results(search_id);
CREATE INDEX IF NOT EXISTS idx_openalex_results_work_id ON openalex_results(work_id);
CREATE INDEX IF NOT EXISTS idx_openalex_results_doi ON openalex_results(doi);
CREATE INDEX IF NOT EXISTS idx_openalex_results_citations ON openalex_results(cited_by_count DESC);
CREATE INDEX IF NOT EXISTS idx_openalex_results_open_access ON openalex_results(is_open_access);
CREATE INDEX IF NOT EXISTS idx_openalex_results_publication_date ON openalex_results(publication_date DESC);

-- Add OpenAlex to provider_settings
INSERT INTO provider_settings (provider_key, provider_type, display_name, description, enabled, display_order, icon, config) VALUES
  ('openalex', 'search', 'OpenAlex', 'Free academic search engine providing access to 250M+ research papers, authors, institutions, and citation networks', true, 2, '📚', '{"enabled": true, "costPerSearch": 0, "rateLimit": "10 req/s", "dailyLimit": "100k requests"}')
ON CONFLICT (provider_key) DO UPDATE SET
  description = EXCLUDED.description,
  config = EXCLUDED.config;

-- Comments
COMMENT ON TABLE openalex_searches IS 'Tracks OpenAlex academic literature searches performed for each query';
COMMENT ON TABLE openalex_results IS 'Stores individual research paper results from OpenAlex with metadata and citation counts';
COMMENT ON COLUMN openalex_results.work_id IS 'OpenAlex unique work identifier (format: W followed by numbers)';
COMMENT ON COLUMN openalex_results.cited_by_count IS 'Number of times this work has been cited by other papers';
COMMENT ON COLUMN openalex_results.is_open_access IS 'Whether the work is available as open access';
COMMENT ON COLUMN openalex_results.concepts IS 'Research topics/concepts associated with this work (array of {name, score})';
