-- Migration: Add patents, AI summaries, and follow-up questions tables
-- Date: 2025-11-03

-- Patents table (Google Patents results)
CREATE TABLE IF NOT EXISTS patent_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  patent_number TEXT NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  filing_date TEXT,
  publication_date TEXT,
  assignee TEXT,
  inventors JSONB DEFAULT '[]'::jsonb,
  url TEXT,
  relevance_score INTEGER, -- 0-100
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Summaries table (Claude-generated summaries)
CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  models_analyzed INTEGER DEFAULT 0,
  tokens_used INTEGER,
  confidence_level TEXT, -- 'high', 'medium', 'low'
  key_insights JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Follow-up Questions table (AI-generated follow-up questions)
CREATE TABLE IF NOT EXISTS followup_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  rationale TEXT, -- Why this question is relevant
  category TEXT, -- 'clarification', 'deep-dive', 'alternative', 'validation'
  position INTEGER DEFAULT 0, -- Display order (1-5)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Follow-up Question Usage Tracking
CREATE TABLE IF NOT EXISTS followup_question_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  followup_question_id UUID REFERENCES followup_questions(id) ON DELETE CASCADE,
  original_query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  new_query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  used_at TIMESTAMP DEFAULT NOW(),
  effectiveness_rating INTEGER, -- 1-5 stars (user feedback)
  led_to_insights BOOLEAN DEFAULT FALSE, -- Did it provide value?
  notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patents_query ON patent_results(query_id);
CREATE INDEX IF NOT EXISTS idx_patents_number ON patent_results(patent_number);
CREATE INDEX IF NOT EXISTS idx_summaries_query ON ai_summaries(query_id);
CREATE INDEX IF NOT EXISTS idx_followup_query ON followup_questions(query_id);
CREATE INDEX IF NOT EXISTS idx_followup_usage_question ON followup_question_usage(followup_question_id);
CREATE INDEX IF NOT EXISTS idx_followup_usage_original ON followup_question_usage(original_query_id);
CREATE INDEX IF NOT EXISTS idx_followup_usage_new ON followup_question_usage(new_query_id);

-- Add comments for documentation
COMMENT ON TABLE patent_results IS 'Stores Google Patents search results associated with queries';
COMMENT ON TABLE ai_summaries IS 'Stores AI-generated summaries synthesizing all LLM responses';
COMMENT ON TABLE followup_questions IS 'Stores AI-generated follow-up questions for deeper research';
COMMENT ON TABLE followup_question_usage IS 'Tracks when users click and use follow-up questions, measuring effectiveness';
