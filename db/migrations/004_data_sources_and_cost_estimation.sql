-- Data Sources Catalog and Cost Estimation System
-- Migration: 004_data_sources_and_cost_estimation.sql

-- ============================================
-- PART 1: Data Sources Catalog
-- ============================================

-- Research data sources (PubMed, Elsevier, etc.)
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'literature', 'clinical_trials', 'patents', 'genomics', 'regulatory'
  provider VARCHAR(255), -- 'PubMed', 'Elsevier', 'Nature', 'ClinicalTrials.gov'
  access_type VARCHAR(50) NOT NULL, -- 'free', 'institutional', 'paid_api', 'paid_per_article'
  mcp_server_available BOOLEAN DEFAULT false,
  mcp_server_name VARCHAR(255), -- 'semantic-scholar-mcp', 'pubmed-mcp'
  api_endpoint VARCHAR(500),
  requires_api_key BOOLEAN DEFAULT false,

  -- Pricing structure
  pricing_model VARCHAR(50) NOT NULL, -- 'free', 'per_query', 'per_article', 'subscription', 'tiered'
  cost_per_query DECIMAL(10,4) DEFAULT 0, -- USD
  cost_per_article DECIMAL(10,4) DEFAULT 0, -- USD
  monthly_subscription DECIMAL(10,2) DEFAULT 0, -- USD
  query_rate_limit INTEGER, -- queries per hour/second
  rate_limit_unit VARCHAR(20) DEFAULT 'hour', -- 'second', 'minute', 'hour', 'day'

  -- Quality indicators
  coverage_description TEXT,
  typical_result_count INTEGER,
  avg_response_time_ms INTEGER,
  data_freshness VARCHAR(50), -- 'real-time', 'daily', 'weekly', 'monthly'

  -- Display
  display_order INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_sources_category ON data_sources(category);
CREATE INDEX IF NOT EXISTS idx_data_sources_access_type ON data_sources(access_type);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(is_active);

-- Which data sources are available for which workflows
CREATE TABLE IF NOT EXISTS workflow_data_sources (
  workflow_template_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  data_source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  is_recommended BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 50, -- 1-100, display order
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (workflow_template_id, data_source_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_data_sources_workflow ON workflow_data_sources(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_data_sources_default ON workflow_data_sources(is_default);

-- User's API credentials for paid sources (future use)
CREATE TABLE IF NOT EXISTS user_data_source_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255), -- for future auth integration
  data_source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
  api_key_encrypted TEXT,
  institutional_token_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PART 2: Cost Estimation & Tracking
-- ============================================

-- Cost estimation before query execution
CREATE TABLE IF NOT EXISTS query_cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  data_source_id UUID REFERENCES data_sources(id),

  -- Estimates (before execution)
  estimated_queries INTEGER DEFAULT 0,
  estimated_articles INTEGER DEFAULT 0,
  estimated_cost_usd DECIMAL(10,4) DEFAULT 0,

  -- Actuals (after execution)
  actual_queries INTEGER DEFAULT 0,
  actual_articles INTEGER DEFAULT 0,
  actual_cost_usd DECIMAL(10,4) DEFAULT 0,

  -- LLM costs
  llm_input_tokens INTEGER DEFAULT 0,
  llm_output_tokens INTEGER DEFAULT 0,
  llm_cost_usd DECIMAL(10,4) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_estimates_query ON query_cost_estimates(query_id);
CREATE INDEX IF NOT EXISTS idx_cost_estimates_source ON query_cost_estimates(data_source_id);

-- Overall query cost summary
CREATE TABLE IF NOT EXISTS query_cost_summary (
  query_id UUID PRIMARY KEY REFERENCES queries(id) ON DELETE CASCADE,

  total_estimated_cost_usd DECIMAL(10,4) DEFAULT 0,
  total_actual_cost_usd DECIMAL(10,4) DEFAULT 0,

  llm_costs_usd DECIMAL(10,4) DEFAULT 0,
  data_source_costs_usd DECIMAL(10,4) DEFAULT 0,

  estimated_duration_minutes INTEGER DEFAULT 0,
  actual_duration_seconds INTEGER DEFAULT 0,

  cost_variance_percent DECIMAL(5,2), -- (actual - estimated) / estimated * 100

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SEED DATA: Research Databases
-- ============================================

-- FREE SOURCES
INSERT INTO data_sources (name, category, provider, access_type, mcp_server_available, mcp_server_name, pricing_model, cost_per_query, cost_per_article, coverage_description, query_rate_limit, rate_limit_unit, display_order) VALUES

('PubMed/PubMed Central', 'literature', 'NCBI', 'free', true, 'pubmed-mcp',
 'free', 0, 0,
 'Free access to 36M+ biomedical citations and 8M+ full-text articles. Comprehensive coverage of life sciences and biomedical topics.',
 10, 'second', 100),

('Semantic Scholar', 'literature', 'Allen Institute', 'free', true, 'semantic-scholar-mcp',
 'free', 0, 0,
 'Free access to 200M+ papers across all sciences with AI-powered insights, citation analysis, and influence metrics.',
 100, 'second', 95),

('arXiv', 'literature', 'Cornell University', 'free', true, 'arxiv-mcp',
 'free', 0, 0,
 'Free access to 2M+ preprints in physics, mathematics, computer science, quantitative biology, and statistics.',
 NULL, 'hour', 90),

('bioRxiv/medRxiv', 'literature', 'Cold Spring Harbor Lab', 'free', true, 'biorxiv-mcp',
 'free', 0, 0,
 'Free access to 200K+ biology and medicine preprints. Latest research before peer review.',
 NULL, 'hour', 85),

('ClinicalTrials.gov', 'clinical_trials', 'NIH', 'free', true, 'clinicaltrials-mcp',
 'free', 0, 0,
 'Free access to 480K+ clinical trial records worldwide. Essential for clinical development and competitive intelligence.',
 NULL, 'hour', 100),

('PubChem', 'genomics', 'NCBI', 'free', true, 'pubchem-mcp',
 'free', 0, 0,
 'Free chemical compound and bioassay database with 111M+ compounds. Essential for drug discovery.',
 5, 'second', 80),

('Europe PMC', 'literature', 'EMBL-EBI', 'free', true, 'europepmc-mcp',
 'free', 0, 0,
 'Free full-text access to 41M+ life science publications including preprints and open access articles.',
 NULL, 'hour', 85),

-- INSTITUTIONAL ACCESS (Free if user has institutional subscription)
('Scopus', 'literature', 'Elsevier', 'institutional', true, 'scopus-mcp',
 'per_query', 0.05, 0,
 'Abstract and citation database covering 26K+ journals, 8M+ conference papers. Best-in-class citation tracking. Requires institutional subscription or API license ($0.05/query without subscription).',
 2, 'second', 70),

('Web of Science', 'literature', 'Clarivate', 'institutional', false, NULL,
 'per_query', 0.10, 0,
 'Citation database covering 21K+ journals with 1.9B cited references. Strong coverage of high-impact journals. Requires institutional subscription ($0.10/query without).',
 5, 'second', 65),

('Embase', 'literature', 'Elsevier', 'institutional', false, NULL,
 'per_query', 0.10, 0,
 'Biomedical and pharmaceutical database with 32M+ records. Superior drug and disease coverage. Requires institutional subscription ($0.10/query without).',
 2, 'second', 60),

-- PAID PER ARTICLE
('ScienceDirect', 'literature', 'Elsevier', 'paid_api', true, 'sciencedirect-mcp',
 'per_article', 0, 35.00,
 'Full-text access to 16M+ articles from Elsevier journals including Cell, Lancet, and 2,500+ journals. Free API for institutional subscribers, $35/article otherwise.',
 2, 'second', 50),

('Nature Portfolio', 'literature', 'Nature', 'paid_per_article', false, NULL,
 'per_article', 0, 32.00,
 'Access to Nature journals (Nature, Nature Medicine, Nature Biotechnology, etc.). Top-tier research. $32/article for non-subscribers.',
 NULL, 'hour', 45),

('New England Journal of Medicine', 'literature', 'NEJM', 'paid_per_article', false, NULL,
 'per_article', 0, 15.00,
 'Top-tier medical journal with clinical studies and reviews. $15/article for non-subscribers.',
 NULL, 'hour', 40),

('The Lancet', 'literature', 'Elsevier', 'paid_per_article', false, NULL,
 'per_article', 0, 35.00,
 'Leading medical journal with global health focus. $35/article for non-subscribers.',
 NULL, 'hour', 40),

-- PATENTS & REGULATORY
('Google Patents', 'patents', 'Google', 'free', true, 'google-patents-mcp',
 'free', 0, 0,
 'Free access to 120M+ patents from 100+ patent offices worldwide. Essential for IP landscape analysis.',
 NULL, 'hour', 75),

('FDA Drugs Database', 'regulatory', 'FDA', 'free', true, 'fda-drugs-mcp',
 'free', 0, 0,
 'Free access to FDA-approved drugs, clinical reviews, and approval histories. Critical for regulatory strategy.',
 NULL, 'hour', 80),

('EMA Clinical Trials', 'regulatory', 'EMA', 'free', false, NULL,
 'free', 0, 0,
 'Free access to European Medicines Agency clinical trial data and regulatory decisions.',
 NULL, 'hour', 75)

ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View for data source summary
CREATE OR REPLACE VIEW vw_data_source_summary AS
SELECT
  ds.id,
  ds.name,
  ds.category,
  ds.provider,
  ds.access_type,
  ds.pricing_model,
  ds.cost_per_query,
  ds.cost_per_article,
  ds.mcp_server_available,
  COUNT(DISTINCT wds.workflow_template_id) as workflow_count,
  COUNT(DISTINCT qce.query_id) as times_used,
  AVG(qce.actual_cost_usd) as avg_cost_per_use
FROM data_sources ds
LEFT JOIN workflow_data_sources wds ON ds.id = wds.data_source_id
LEFT JOIN query_cost_estimates qce ON ds.id = qce.data_source_id
WHERE ds.is_active = true
GROUP BY ds.id, ds.name, ds.category, ds.provider, ds.access_type, ds.pricing_model, ds.cost_per_query, ds.cost_per_article, ds.mcp_server_available
ORDER BY ds.display_order DESC, ds.name;

-- View for cost tracking analytics
CREATE OR REPLACE VIEW vw_cost_analytics AS
SELECT
  DATE_TRUNC('day', qcs.created_at) as date,
  COUNT(DISTINCT qcs.query_id) as total_queries,
  SUM(qcs.total_estimated_cost_usd) as total_estimated_cost,
  SUM(qcs.total_actual_cost_usd) as total_actual_cost,
  SUM(qcs.llm_costs_usd) as total_llm_costs,
  SUM(qcs.data_source_costs_usd) as total_data_source_costs,
  AVG(qcs.cost_variance_percent) as avg_cost_variance_percent
FROM query_cost_summary qcs
GROUP BY DATE_TRUNC('day', qcs.created_at)
ORDER BY date DESC;
