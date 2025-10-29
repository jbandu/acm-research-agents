-- Competitor Intelligence System
-- Migration: 006_competitors_intelligence.sql

-- ============================================
-- Competitors Table
-- ============================================

CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  short_name VARCHAR(100), -- e.g., "Moderna" vs "Moderna, Inc."
  logo_url TEXT,
  website_url TEXT,

  -- Geographic Information for World Map
  headquarters_city VARCHAR(100),
  headquarters_state VARCHAR(100),
  headquarters_country VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Company Details
  company_type VARCHAR(50), -- 'public', 'private', 'subsidiary'
  ticker_symbol VARCHAR(20),
  founded_year INTEGER,
  employee_count INTEGER,

  -- Financial Information
  market_cap_usd BIGINT,
  last_funding_round_usd BIGINT,
  total_funding_usd BIGINT,
  annual_revenue_usd BIGINT,

  -- Research & Development
  primary_focus TEXT[], -- e.g., ['mRNA therapeutics', 'cancer immunotherapy']
  technology_platforms TEXT[], -- e.g., ['mRNA', 'gene editing', 'CAR-T']
  pipeline_stage JSONB DEFAULT '{}', -- { "preclinical": 5, "phase1": 3, "phase2": 2, "phase3": 1, "approved": 1 }

  -- Competitive Intelligence
  threat_level VARCHAR(20) DEFAULT 'medium' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  competitive_overlap_score INTEGER DEFAULT 50 CHECK (competitive_overlap_score >= 0 AND competitive_overlap_score <= 100),
  strategic_notes TEXT,

  -- AI Research Data
  ai_summary TEXT, -- AI-generated company summary
  ai_strengths TEXT[], -- AI-identified strengths
  ai_weaknesses TEXT[], -- AI-identified weaknesses
  ai_opportunities TEXT[], -- Potential partnership/differentiation opportunities
  ai_threats TEXT[], -- Competitive threats to ACM
  last_ai_research_date TIMESTAMP,
  research_data JSONB DEFAULT '{}', -- Flexible storage for research findings

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255) DEFAULT 'system',
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- Competitor News & Updates
-- ============================================

CREATE TABLE IF NOT EXISTS competitor_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,

  update_type VARCHAR(50) NOT NULL, -- 'clinical_trial', 'funding', 'partnership', 'publication', 'regulatory', 'acquisition', 'other'
  title VARCHAR(500) NOT NULL,
  description TEXT,
  source_url TEXT,
  source_name VARCHAR(255),

  impact_level VARCHAR(20) DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  requires_action BOOLEAN DEFAULT false,
  action_notes TEXT,

  published_date TIMESTAMP,
  discovered_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Competitor Clinical Trials
-- ============================================

CREATE TABLE IF NOT EXISTS competitor_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,

  nct_id VARCHAR(50) UNIQUE, -- ClinicalTrials.gov ID
  trial_title TEXT NOT NULL,
  phase VARCHAR(20), -- 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'
  status VARCHAR(50), -- 'Recruiting', 'Active', 'Completed', 'Terminated'

  indication TEXT,
  intervention TEXT,
  target TEXT,

  start_date DATE,
  completion_date DATE,
  estimated_enrollment INTEGER,

  trial_locations JSONB DEFAULT '[]', -- Array of {country, city, facility}

  relevance_score INTEGER DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  competitive_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Competitor Publications
-- ============================================

CREATE TABLE IF NOT EXISTS competitor_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,

  pubmed_id VARCHAR(50),
  doi VARCHAR(255),
  title TEXT NOT NULL,
  authors TEXT[],
  journal VARCHAR(255),
  publication_date DATE,

  abstract TEXT,
  key_findings TEXT,
  relevance_to_acm TEXT,

  citation_count INTEGER DEFAULT 0,
  relevance_score INTEGER DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Weekly Research Jobs
-- ============================================

CREATE TABLE IF NOT EXISTS research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL, -- 'competitor_research', 'newsletter_generation'

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),

  target_id UUID, -- competitor_id if job_type is 'competitor_research'

  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  results JSONB DEFAULT '{}',
  error_message TEXT,

  scheduled_for TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Newsletter Archive
-- ============================================

CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  subject VARCHAR(500) NOT NULL,
  content_html TEXT NOT NULL,
  content_markdown TEXT NOT NULL,

  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,

  -- Metrics
  competitors_covered INTEGER DEFAULT 0,
  updates_included INTEGER DEFAULT 0,
  trials_highlighted INTEGER DEFAULT 0,

  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'archived')),
  sent_at TIMESTAMP,
  recipient_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255) DEFAULT 'ai_agent'
);

-- ============================================
-- Employee Newsletter Subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  department VARCHAR(100),

  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_competitors_country ON competitors(headquarters_country);
CREATE INDEX IF NOT EXISTS idx_competitors_threat ON competitors(threat_level);
CREATE INDEX IF NOT EXISTS idx_competitors_active ON competitors(is_active);
CREATE INDEX IF NOT EXISTS idx_competitors_research_date ON competitors(last_ai_research_date);

CREATE INDEX IF NOT EXISTS idx_competitor_updates_competitor ON competitor_updates(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_updates_type ON competitor_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_competitor_updates_published ON competitor_updates(published_date DESC);

CREATE INDEX IF NOT EXISTS idx_competitor_trials_competitor ON competitor_trials(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_trials_phase ON competitor_trials(phase);
CREATE INDEX IF NOT EXISTS idx_competitor_trials_status ON competitor_trials(status);

CREATE INDEX IF NOT EXISTS idx_competitor_publications_competitor ON competitor_publications(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_publications_date ON competitor_publications(publication_date DESC);

CREATE INDEX IF NOT EXISTS idx_research_jobs_status ON research_jobs(status);
CREATE INDEX IF NOT EXISTS idx_research_jobs_scheduled ON research_jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_research_jobs_type ON research_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_newsletters_week ON newsletters(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);

-- ============================================
-- Update Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_competitor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_competitors_updated_at
BEFORE UPDATE ON competitors
FOR EACH ROW EXECUTE FUNCTION update_competitor_updated_at();

CREATE TRIGGER update_competitor_trials_updated_at
BEFORE UPDATE ON competitor_trials
FOR EACH ROW EXECUTE FUNCTION update_competitor_updated_at();
