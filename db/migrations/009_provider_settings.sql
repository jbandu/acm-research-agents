-- Migration 009: LLM Provider and Search Source Configuration
-- Dynamic configuration for enabled/disabled providers

-- Create provider settings table
CREATE TABLE IF NOT EXISTS provider_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_key VARCHAR(50) UNIQUE NOT NULL,
  provider_type VARCHAR(20) NOT NULL, -- 'llm' or 'search'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_provider_settings_enabled ON provider_settings(enabled);
CREATE INDEX IF NOT EXISTS idx_provider_settings_type ON provider_settings(provider_type);

-- Add updated_at trigger
CREATE TRIGGER update_provider_settings_updated_at
BEFORE UPDATE ON provider_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default providers
INSERT INTO provider_settings (provider_key, provider_type, display_name, description, enabled, display_order, icon, config) VALUES
  ('claude', 'llm', 'Claude Sonnet 4.5', 'Anthropic''s most capable model for deep analysis and safety assessment', true, 1, '🧠', '{"model": "claude-sonnet-4-20250514", "costPer1M": {"input": 3, "output": 15}}'),
  ('openai', 'llm', 'GPT-4o', 'OpenAI''s multimodal model for pattern recognition and synthesis', true, 2, '🤖', '{"model": "gpt-4o", "costPer1M": {"input": 5, "output": 15}}'),
  ('gemini', 'llm', 'Gemini 2.0 Flash', 'Google''s fast model for cross-validation and contradiction detection', true, 3, '✨', '{"model": "gemini-2.0-flash-exp", "costPer1M": {"input": 1.25, "output": 5}}'),
  ('grok', 'llm', 'Grok 2', 'xAI''s model for real-time intelligence and emerging trends', true, 4, '⚡', '{"model": "grok-2-latest", "costPer1M": {"input": 2, "output": 10}}'),
  ('ollama', 'llm', 'Ollama (Local)', 'Local LLM running on your infrastructure (optional)', false, 5, '🏠', '{"model": "llama3.1:8b", "costPer1M": {"input": 0, "output": 0}, "local": true}'),
  ('google_patents', 'search', 'Google Patents', 'Automated patent search via SerpAPI', true, 1, '📜', '{"enabled": true, "costPerSearch": 0.02}')
ON CONFLICT (provider_key) DO NOTHING;

-- Add comment
COMMENT ON TABLE provider_settings IS 'Dynamic configuration for LLM providers and search sources. Allows admin to enable/disable providers without code changes.';
