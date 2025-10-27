-- Migration 002: Workflows and History Enhancements
-- Add fields and tables to support workflow templates, user workflows, and history features

-- Add fields to existing workflows table to make them templates
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS prompt_template TEXT;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS required_parameters JSONB DEFAULT '{}'::jsonb;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS example_questions TEXT[];
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 15;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT true;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0;

-- User Custom Workflows (extends workflow templates)
CREATE TABLE IF NOT EXISTS user_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255), -- for future auth
  template_id UUID REFERENCES workflows(id),
  name VARCHAR(255) NOT NULL,
  custom_prompt TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow Execution History (links queries to workflows)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id),
  user_workflow_id UUID REFERENCES user_workflows(id),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'running', -- running, completed, failed
  execution_time_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Query Collections (organize queries into folders)
CREATE TABLE IF NOT EXISTS query_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Query Collection Items (many-to-many relationship)
CREATE TABLE IF NOT EXISTS query_collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES query_collections(id) ON DELETE CASCADE,
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(collection_id, query_id)
);

-- Consensus Results (store consensus analysis)
CREATE TABLE IF NOT EXISTS consensus_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  consensus_level VARCHAR(50) NOT NULL, -- 'high', 'medium', 'low', 'none'
  agreement_summary TEXT,
  conflicts JSONB DEFAULT '[]'::jsonb,
  agreeing_providers TEXT[],
  conflicting_providers TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflows_is_template ON workflows(is_template);
CREATE INDEX IF NOT EXISTS idx_user_workflows_template ON user_workflows(template_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_user ON user_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_query ON workflow_executions(query_id);
CREATE INDEX IF NOT EXISTS idx_query_collections_user ON query_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_consensus_results_query ON consensus_results(query_id);
CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);

-- Update existing workflows with template metadata
UPDATE workflows SET
  category = name,
  icon = CASE
    WHEN name LIKE '%Literature%' THEN '📚'
    WHEN name LIKE '%Target%' THEN '🎯'
    WHEN name LIKE '%Clinical%' THEN '🧪'
    WHEN name LIKE '%Regulatory%' THEN '📋'
    WHEN name LIKE '%Competitive%' THEN '🔍'
    ELSE '📊'
  END,
  prompt_template = system_prompt,
  example_questions = CASE
    WHEN name LIKE '%Literature%' THEN ARRAY['Latest studies on mRNA codon optimization', 'Compare LNP vs BNP for vaccine stability', 'TLR9 agonist safety profiles in oncology']
    WHEN name LIKE '%Target%' THEN ARRAY['Evaluate ACM-CpG mechanism vs competitors', 'Biomarkers for phase 2 trials', 'Combination therapy candidates']
    WHEN name LIKE '%Clinical%' THEN ARRAY['Patient stratification for solid tumor trial', 'Optimal endpoints for immunotherapy', 'Compare IM vs SC administration']
    WHEN name LIKE '%Regulatory%' THEN ARRAY['CMC requirements for polymer nanoparticles', 'FDA feedback on mRNA therapeutics', 'EMA stability testing protocols']
    WHEN name LIKE '%Competitive%' THEN ARRAY['Top TLR9 agonist competitors', 'AI/ML tools used by mRNA companies', 'Polymer drug delivery funding landscape']
    ELSE ARRAY[]::TEXT[]
  END,
  estimated_duration_minutes = CASE
    WHEN name LIKE '%Literature%' THEN 15
    WHEN name LIKE '%Target%' THEN 20
    WHEN name LIKE '%Clinical%' THEN 25
    WHEN name LIKE '%Regulatory%' THEN 20
    WHEN name LIKE '%Competitive%' THEN 25
    ELSE 15
  END,
  is_template = true,
  required_parameters = CASE
    WHEN name LIKE '%Literature%' THEN '{"timeframe": {"type": "select", "options": ["last 6 months", "last year", "last 2 years", "last 5 years"], "default": "last year"}}'::jsonb
    WHEN name LIKE '%Clinical%' THEN '{"indication": {"type": "text", "required": true}, "phase": {"type": "select", "options": ["Phase 1", "Phase 2", "Phase 3"], "default": "Phase 2"}}'::jsonb
    ELSE '{}'::jsonb
  END
WHERE is_template IS NULL OR is_template = true;

-- Add trigger for user_workflows updated_at
CREATE TRIGGER update_user_workflows_updated_at BEFORE UPDATE ON user_workflows
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for query_collections updated_at
CREATE TRIGGER update_query_collections_updated_at BEFORE UPDATE ON query_collections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
