-- ACM Research Agents Database Schema
-- For Neon Serverless Postgres

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  system_prompt TEXT,
  data_sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Queries table
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- LLM Responses table
CREATE TABLE IF NOT EXISTS llm_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  llm_provider TEXT NOT NULL, -- 'claude', 'openai', 'gemini', 'grok'
  model_name TEXT NOT NULL,
  response_text TEXT NOT NULL,
  confidence_score INTEGER, -- 0-100
  sources JSONB DEFAULT '[]'::jsonb,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Human Decisions table (audit trail)
CREATE TABLE IF NOT EXISTS human_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL, -- 'approved', 'modified', 'rejected'
  selected_llm TEXT, -- which LLM's answer was chosen
  final_answer TEXT NOT NULL,
  notes TEXT,
  decided_by TEXT NOT NULL,
  decided_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_queries_workflow ON queries(workflow_id);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_query ON llm_responses(query_id);
CREATE INDEX IF NOT EXISTS idx_responses_provider ON llm_responses(llm_provider);
CREATE INDEX IF NOT EXISTS idx_decisions_query ON human_decisions(query_id);

-- Insert default workflows
INSERT INTO workflows (name, description, domain, subdomain, system_prompt, data_sources) VALUES
(
  'Literature Mining & Synthesis',
  'Comprehensive analysis of scientific literature to identify key findings, trends, and knowledge gaps',
  'Research Intelligence',
  'Literature Analysis',
  'You are a biotech research assistant analyzing scientific literature. Your task is to comprehensively review and synthesize research papers, identify key findings, spot emerging trends, and highlight knowledge gaps. Provide your analysis with specific citations to papers, including PMID when available. Rate your confidence based on the quantity and quality of supporting evidence.',
  '["pubmed", "clinicaltrials"]'::jsonb
),
(
  'Target Identification & Validation',
  'Systematic evaluation of potential therapeutic targets based on mechanism, druggability, and clinical potential',
  'Drug Discovery',
  'Target Validation',
  'You are a drug discovery expert evaluating therapeutic targets. Analyze the biological rationale, druggability, existing competitive landscape, and clinical potential. Consider mechanism of action, safety concerns, biomarkers for patient selection, and pathway interactions. Provide specific recommendations with evidence from preclinical and clinical studies.',
  '["pubmed", "pdb", "patents"]'::jsonb
),
(
  'Clinical Trial Design',
  'Design and optimization of clinical trial protocols including endpoints, patient selection, and statistical considerations',
  'Clinical Development',
  'Trial Design',
  'You are a clinical development strategist. Design optimal clinical trial protocols considering patient population, endpoints, statistical power, regulatory requirements, and operational feasibility. Reference similar successful trials and FDA guidance documents. Highlight potential risks and mitigation strategies.',
  '["clinicaltrials", "pubmed"]'::jsonb
),
(
  'Regulatory Documentation',
  'Preparation of regulatory submissions including INDs, protocols, and investigator brochures',
  'Regulatory Affairs',
  'Documentation',
  'You are a regulatory affairs specialist. Draft regulatory documents following FDA/EMA guidelines for oncology products. Ensure compliance with ICH guidelines, include appropriate safety data, and structure documents according to CTD format. Reference specific regulatory guidance documents.',
  '["pubmed", "clinicaltrials"]'::jsonb
),
(
  'Competitive Intelligence',
  'Real-time monitoring of competitive landscape including patents, clinical trials, and publications',
  'Business Intelligence',
  'Competitive Analysis',
  'You are a competitive intelligence analyst tracking the biotech landscape. Monitor competitor activities including clinical trial progress, patent filings, partnerships, and scientific publications. Identify strategic threats and opportunities. Provide actionable insights for business strategy.',
  '["patents", "clinicaltrials", "pubmed"]'::jsonb
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
