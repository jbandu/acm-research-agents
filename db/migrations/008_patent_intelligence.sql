-- Migration 008: Patent Intelligence System
-- Add patent search tracking and results storage for IP landscape analysis

-- Patent searches table - tracks each patent search performed
CREATE TABLE IF NOT EXISTS patent_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  search_timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Patent results table - stores individual patent details
CREATE TABLE IF NOT EXISTS patent_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES patent_searches(id) ON DELETE CASCADE,
  patent_number VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  assignee TEXT,
  publication_date VARCHAR(50),
  url TEXT,
  snippet TEXT,
  pdf_url TEXT,
  relevance_score FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(search_id, patent_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patent_searches_query ON patent_searches(query_id);
CREATE INDEX IF NOT EXISTS idx_patent_searches_timestamp ON patent_searches(search_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_patent_results_search ON patent_results(search_id);
CREATE INDEX IF NOT EXISTS idx_patent_results_number ON patent_results(patent_number);
CREATE INDEX IF NOT EXISTS idx_patent_results_assignee ON patent_results(assignee);
CREATE INDEX IF NOT EXISTS idx_patent_results_relevance ON patent_results(relevance_score DESC);

-- Comments
COMMENT ON TABLE patent_searches IS 'Tracks Google Patents searches performed for each query';
COMMENT ON TABLE patent_results IS 'Stores individual patent results with metadata and relevance scoring';
COMMENT ON COLUMN patent_results.relevance_score IS 'Calculated relevance score (0-100) based on position and metadata';
