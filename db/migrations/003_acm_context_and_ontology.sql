-- ACM Context Management and Knowledge Graph Schema
-- Migration: 003_acm_context_and_ontology.sql

-- ============================================
-- PART 1: Knowledge Base for Context Loading
-- ============================================

-- Knowledge base entries for contextual information
CREATE TABLE IF NOT EXISTS acm_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'company', 'research', 'people', 'trials', 'publications', 'competitive'
  subcategory VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- structured data
  importance_score INTEGER DEFAULT 50 CHECK (importance_score >= 1 AND importance_score <= 100), -- 1-100, determines what gets loaded
  token_count INTEGER,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient category-based queries
CREATE INDEX IF NOT EXISTS idx_kb_category ON acm_knowledge_base(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_kb_importance ON acm_knowledge_base(importance_score DESC);

-- Context loading strategies per workflow template
CREATE TABLE IF NOT EXISTS workflow_context_strategies (
  workflow_template_id UUID REFERENCES workflow_templates(id) ON DELETE CASCADE,
  context_level VARCHAR(20) NOT NULL CHECK (context_level IN ('minimal', 'standard', 'deep')), -- 'minimal', 'standard', 'deep'
  required_categories TEXT[], -- which KB categories to load
  max_tokens INTEGER DEFAULT 10000, -- token budget for this workflow
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (workflow_template_id)
);

-- Track what context was used for each query (for analytics and cost tracking)
CREATE TABLE IF NOT EXISTS query_context_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  knowledge_base_ids UUID[], -- which KB entries were sent
  context_level VARCHAR(20),
  cache_hit BOOLEAN DEFAULT false,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,
  total_context_tokens INTEGER DEFAULT 0,
  provider VARCHAR(50), -- which LLM provider
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_usage_query ON query_context_usage(query_id);
CREATE INDEX IF NOT EXISTS idx_context_usage_cache ON query_context_usage(cache_hit);

-- ============================================
-- PART 2: Knowledge Graph / Ontology
-- ============================================

-- Ontology domains (top-level categories)
CREATE TABLE IF NOT EXISTS acm_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ontology nodes (entities in the knowledge graph)
CREATE TABLE IF NOT EXISTS acm_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES acm_domains(id) ON DELETE CASCADE,
  node_type VARCHAR(50) NOT NULL, -- 'person', 'technology', 'trial', 'publication', 'competitor', 'challenge', 'partnership'
  name VARCHAR(500) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- flexible storage
  position_x FLOAT DEFAULT 0, -- for graph visualization
  position_y FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_domain ON acm_nodes(domain_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON acm_nodes(node_type);

-- Relationships between nodes
CREATE TABLE IF NOT EXISTS acm_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id UUID REFERENCES acm_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES acm_nodes(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100) NOT NULL, -- 'works_on', 'competes_with', 'depends_on', 'addresses', 'collaborates_with', 'enables', 'tested_in', 'founded', 'blocks_commercialization'
  strength INTEGER DEFAULT 50 CHECK (strength >= 1 AND strength <= 100), -- 1-100 for visual weight
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rel_source ON acm_relationships(source_node_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON acm_relationships(target_node_id);
CREATE INDEX IF NOT EXISTS idx_rel_type ON acm_relationships(relationship_type);

-- Prevent self-referential relationships
ALTER TABLE acm_relationships ADD CONSTRAINT no_self_reference
  CHECK (source_node_id != target_node_id);

-- ============================================
-- SEED DATA
-- ============================================

-- Seed Domains
INSERT INTO acm_domains (name, description, icon, color, display_order) VALUES
('Leadership', 'Executive team and key personnel', '👥', '#3B82F6', 1),
('Technology Platforms', 'Core R&D platforms and technologies', '🔬', '#8B5CF6', 2),
('Clinical Programs', 'Active clinical trials and studies', '🧪', '#10B981', 3),
('Research Challenges', 'Current technical obstacles', '⚠️', '#F59E0B', 4),
('Competitive Landscape', 'Market competitors and positioning', '🎯', '#EF4444', 5),
('Strategic Partnerships', 'Collaborations and alliances', '🤝', '#06B6D4', 6)
ON CONFLICT (name) DO NOTHING;

-- Seed Knowledge Base (Company Overview - ALWAYS loaded)
INSERT INTO acm_knowledge_base (category, subcategory, title, content, importance_score, token_count) VALUES
('company', 'overview', 'ACM Biolabs Company Profile',
'ACM Biolabs is a clinical-stage biopharmaceutical company developing novel polymer-based nanoparticle platforms for mRNA delivery and cancer immunotherapy. Founded in Singapore with $26M+ in funding.

Core Technology Platforms:
1. Block Copolymer Nanoparticles (BNP) - Alternative to lipid nanoparticles with superior thermal stability (4°C for 13 months)
2. ACM-CpG - TLR9 agonist for cancer immunotherapy via intramuscular administration

Current Development Status:
- Phase 1/2 trials for ACM-CpG in advanced solid tumors showing favorable safety signals
- Partnership with CEPI for pandemic preparedness
- Collaboration with National Cancer Centre Singapore

Key Differentiation:
- BNP platform offers better stability than standard LNPs
- Intramuscular administration route (vs subcutaneous)
- Focus on solid tumor immunotherapy
', 100, 180),

('company', 'challenges', 'Current R&D Challenges',
'Critical Technical Challenges:
1. mRNA Stability at 2-8°C Storage
   - Problem: Hydrolysis and oxidation degradation
   - Impact: Limits commercial viability
   - Priority: HIGH

2. mRNA Codon Structure Optimization
   - Need: Better translation efficiency
   - Current approach: Manual optimization
   - Opportunity: AI-driven design

3. Drug Product Formulation Optimization
   - Challenge: Balancing stability vs efficacy
   - Current: Empirical testing
   - Need: Predictive modeling
', 100, 120),

('people', 'leadership', 'Dr. Madhavan Nallani - CEO & Co-founder',
'Background:
- PhD from Technical University Eindhoven, Netherlands
- Expertise: Polymer chemistry, drug delivery systems, nanomedicine
- Previous: Academic research in biomimetic materials

Leadership Style:
- Scientific rigor combined with commercial pragmatism
- Open to AI/ML integration for R&D acceleration
- Previously engaged with Google DeepMind but seeking more tailored solutions

Current Focus:
- Scaling clinical development of ACM-CpG
- Solving mRNA stability challenges for commercial production
- Building strategic partnerships with pharma companies
', 90, 140),

('research', 'clinical_trials', 'ACM-CpG Phase 1/2 Trial Results',
'Trial: Phase 1/2 for Advanced Solid Tumors (Intramuscular Administration)

Key Findings (reported October 2024):
- Favorable safety signals across dose escalation
- Early pharmacodynamic responses observed
- Well-tolerated intramuscular delivery
- Immune activation markers detected

Patient Population:
- Advanced solid tumors
- Previously treated with standard therapies
- Multiple tumor types evaluated

Next Steps:
- Expansion cohorts for dose optimization
- Biomarker-driven patient selection
- Potential combination therapy studies
', 85, 130),

('competitive', 'tlr9_landscape', 'TLR9 Agonist Competitive Landscape',
'Major Competitors:
1. Checkmate Pharmaceuticals (acquired by Regeneron)
   - CMP-001: Intratumoral CpG-A
   - Status: Phase 2 melanoma trials

2. Dynavax Technologies
   - SD-101: Intratumoral CpG-C
   - Combo with pembrolizumab
   - Status: Phase 2

3. Sumitomo Pharma Oncology
   - DSP-0509: Systemic CpG
   - Status: Preclinical

ACM Differentiation:
- Intramuscular (systemic) vs intratumoral
- Polymer delivery platform
- Broader tumor applicability
', 80, 150),

('competitive', 'ai_in_biotech', 'AI/ML Adoption by Competitors',
'Companies Using AI for Drug Development:

mRNA Companies:
- Moderna: Collaboration with OpenAI for research automation
- BioNTech: In-house ML for antigen design
- CureVac: AI-driven codon optimization

What They''re Using AI For:
1. Target identification and validation
2. mRNA sequence optimization
3. Clinical trial patient matching
4. Manufacturing process optimization
5. Literature mining and synthesis

Market Gap for ACM:
- Most AI tools are generic, not platform-specific
- No integrated multi-LLM research system
- Opportunity for ACM to leapfrog with custom AI agents
', 75, 140)
ON CONFLICT DO NOTHING;

-- Seed Ontology Nodes
DO $$
DECLARE
  v_leadership_id UUID;
  v_tech_id UUID;
  v_clinical_id UUID;
  v_challenges_id UUID;
  v_competitive_id UUID;
  v_partnerships_id UUID;

  v_madhavan_id UUID;
  v_bnp_id UUID;
  v_acmcpg_id UUID;
  v_trial_id UUID;
  v_stability_challenge_id UUID;
  v_codon_challenge_id UUID;
  v_checkmate_id UUID;
  v_dynavax_id UUID;
BEGIN
  -- Get domain IDs
  SELECT id INTO v_leadership_id FROM acm_domains WHERE name = 'Leadership';
  SELECT id INTO v_tech_id FROM acm_domains WHERE name = 'Technology Platforms';
  SELECT id INTO v_clinical_id FROM acm_domains WHERE name = 'Clinical Programs';
  SELECT id INTO v_challenges_id FROM acm_domains WHERE name = 'Research Challenges';
  SELECT id INTO v_competitive_id FROM acm_domains WHERE name = 'Competitive Landscape';
  SELECT id INTO v_partnerships_id FROM acm_domains WHERE name = 'Strategic Partnerships';

  -- Insert People Nodes
  INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y) VALUES
  (gen_random_uuid(), v_leadership_id, 'person', 'Dr. Madhavan Nallani',
   'CEO & Co-founder. PhD from TU Eindhoven (Netherlands). Expert in polymer chemistry and drug delivery.',
   '{"education": "PhD, TU Eindhoven", "expertise": ["polymer chemistry", "nanomedicine"], "title": "CEO & Co-founder"}'::jsonb,
   100, 100)
  RETURNING id INTO v_madhavan_id;

  -- Insert Technology Nodes
  INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y) VALUES
  (gen_random_uuid(), v_tech_id, 'technology', 'Block Copolymer Nanoparticles (BNP)',
   'Proprietary polymer-based delivery platform. Superior thermal stability vs LNPs.',
   '{"status": "Preclinical/Clinical", "advantage": "13 months at 4°C", "type": "Delivery Platform"}'::jsonb,
   300, 100)
  RETURNING id INTO v_bnp_id;

  INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y) VALUES
  (gen_random_uuid(), v_tech_id, 'technology', 'ACM-CpG',
   'TLR9 agonist for cancer immunotherapy. Intramuscular administration.',
   '{"status": "Phase 1/2", "indication": "Advanced Solid Tumors", "route": "IM"}'::jsonb,
   500, 100)
  RETURNING id INTO v_acmcpg_id;

  -- Insert Clinical Trial Nodes
  INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y) VALUES
  (gen_random_uuid(), v_clinical_id, 'trial', 'ACM-CpG Phase 1/2',
   'Safety and early efficacy study in advanced solid tumors.',
   '{"phase": "1/2", "status": "Active", "enrollment": "Ongoing", "results": "Favorable safety signals"}'::jsonb,
   700, 100)
  RETURNING id INTO v_trial_id;

  -- Insert Challenge Nodes
  INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y) VALUES
  (gen_random_uuid(), v_challenges_id, 'challenge', 'mRNA Stability at 2-8°C',
   'Hydrolysis and oxidation degradation limits commercial viability.',
   '{"priority": "HIGH", "impact": "Commercial readiness", "potential_solutions": ["AI-driven codon optimization", "formulation improvements"]}'::jsonb,
   300, 300)
  RETURNING id INTO v_stability_challenge_id;

  INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y) VALUES
  (gen_random_uuid(), v_challenges_id, 'challenge', 'Codon Structure Optimization',
   'Need AI/ML approaches for translation efficiency.',
   '{"priority": "HIGH", "current_approach": "Manual", "opportunity": "AI automation"}'::jsonb,
   500, 300)
  RETURNING id INTO v_codon_challenge_id;

  -- Insert Competitor Nodes
  INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y) VALUES
  (gen_random_uuid(), v_competitive_id, 'competitor', 'Checkmate Pharma (Regeneron)',
   'CMP-001 intratumoral TLR9 agonist.',
   '{"status": "Phase 2", "differentiation": "Intratumoral vs ACM IM delivery"}'::jsonb,
   700, 300)
  RETURNING id INTO v_checkmate_id;

  INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y) VALUES
  (gen_random_uuid(), v_competitive_id, 'competitor', 'Dynavax Technologies',
   'SD-101 intratumoral CpG-C.',
   '{"status": "Phase 2", "combo": "Pembrolizumab"}'::jsonb,
   900, 300)
  RETURNING id INTO v_dynavax_id;

  -- Insert Relationships
  -- Madhavan founded BNP platform
  INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description) VALUES
  (v_madhavan_id, v_bnp_id, 'founded', 100, 'Pioneered BNP technology');

  -- BNP platform enables ACM-CpG
  INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description) VALUES
  (v_bnp_id, v_acmcpg_id, 'enables', 90, 'Delivery platform for TLR9 agonist');

  -- ACM-CpG is being tested in Phase 1/2
  INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description) VALUES
  (v_acmcpg_id, v_trial_id, 'tested_in', 100, 'Current clinical trial');

  -- mRNA stability challenge affects BNP commercial viability
  INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description) VALUES
  (v_stability_challenge_id, v_bnp_id, 'blocks_commercialization', 80, 'Critical barrier to market');

  -- Codon optimization challenge affects ACM-CpG
  INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description) VALUES
  (v_codon_challenge_id, v_acmcpg_id, 'affects', 70, 'Translation efficiency impacts efficacy');

  -- ACM competes with Checkmate
  INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description) VALUES
  (v_acmcpg_id, v_checkmate_id, 'competes_with', 70, 'TLR9 agonist space - different administration route');

  -- ACM competes with Dynavax
  INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description) VALUES
  (v_acmcpg_id, v_dynavax_id, 'competes_with', 65, 'TLR9 agonist space');

  -- Madhavan works on addressing challenges
  INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description) VALUES
  (v_madhavan_id, v_stability_challenge_id, 'addresses', 85, 'Leading R&D efforts');

  INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description) VALUES
  (v_madhavan_id, v_codon_challenge_id, 'addresses', 85, 'Exploring AI/ML solutions');
END $$;

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View for quick knowledge base access by category
CREATE OR REPLACE VIEW vw_knowledge_base_by_category AS
SELECT
  category,
  subcategory,
  COUNT(*) as entry_count,
  SUM(token_count) as total_tokens,
  AVG(importance_score) as avg_importance
FROM acm_knowledge_base
GROUP BY category, subcategory
ORDER BY category, subcategory;

-- View for ontology statistics
CREATE OR REPLACE VIEW vw_ontology_stats AS
SELECT
  d.name as domain_name,
  COUNT(n.id) as node_count,
  COUNT(DISTINCT n.node_type) as node_types
FROM acm_domains d
LEFT JOIN acm_nodes n ON d.id = n.domain_id
GROUP BY d.id, d.name
ORDER BY d.display_order;
