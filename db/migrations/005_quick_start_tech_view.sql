-- ============================================
-- MINIMAL INSTALL: Technology Evolution View
-- Just the essentials to see technology lineage
-- ============================================

-- 1. Create technologies table
CREATE TABLE IF NOT EXISTS technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50),
  platform_type VARCHAR(100),
  description TEXT,
  technical_summary TEXT,
  development_status VARCHAR(50),
  storage_temperature_celsius VARCHAR(50),
  storage_duration VARCHAR(100),
  administration_routes TEXT[],
  payload_types TEXT[],
  origin_institution VARCHAR(255),
  origin_year INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create technology_lineage table
CREATE TABLE IF NOT EXISTS technology_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_technology_id UUID REFERENCES technologies(id),
  child_technology_id UUID REFERENCES technologies(id),
  relationship_type VARCHAR(100),
  description TEXT,
  transition_year INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_self_lineage CHECK (parent_technology_id != child_technology_id)
);

-- 3. Insert the 4 technology platforms
INSERT INTO technologies (id, name, code, platform_type, description, development_status, storage_temperature_celsius, storage_duration, origin_institution, origin_year) VALUES
('00000000-0000-0000-0002-000000000001', 'ATP™ (ACM Tunable Platform)', 'ATP', 'Delivery Platform',
 'Polymer/lipid hybrid, non-viral delivery platform built on ACM technology. Enables mRNA storage at 2-8°C for >1 year.',
 'Clinical', '2-8°C', '>1 year at 4°C', 'A*STAR IMRE', 2009),

('00000000-0000-0000-0002-000000000002', 'ACM (Artificial Cell Membranes)', 'ACM', 'Nanoparticle',
 'Customized synthetic cell membranes using amphiphilic block copolymers forming nanoscale polymersomes.',
 'Clinical', NULL, NULL, 'A*STAR IMRE', 2009),

('00000000-0000-0000-0002-000000000003', 'BNP (Block Copolymer Nanoparticles)', 'BNP', 'Nanoparticle',
 'Specific mRNA formulation combining PBD-b-PEO with lipid components. Published in Biomacromolecules 2025.',
 'Clinical', '2-8°C', '>1 year at 4°C', NULL, NULL),

('00000000-0000-0000-0002-000000000004', 'ACM-CpG Platform', 'ACM-CpG', 'Adjuvant',
 'TLR9 agonist (CpG 7909) formulated using proprietary polymersome technology. Currently in Phase 1 clinical trials for oncology.',
 'Clinical', NULL, NULL, NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- 4. Insert technology lineage relationships
INSERT INTO technology_lineage (parent_technology_id, child_technology_id, relationship_type, description, transition_year) VALUES
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0002-000000000001', 'derived_from', 'ATP™ platform built on ACM technology foundation', 2013),
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000003', 'incorporates', 'BNP represents specific mRNA formulation using ATP™ platform', 2020),
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0002-000000000004', 'enables', 'ACM polymersome technology enables ACM-CpG formulation', 2020)
ON CONFLICT DO NOTHING;

-- 5. Create the view
CREATE OR REPLACE VIEW vw_technology_evolution AS
WITH RECURSIVE tech_tree AS (
  -- Base: Origin technologies (no parent)
  SELECT
    t.id,
    t.name,
    t.code,
    t.origin_institution,
    t.origin_year,
    0 as generation,
    ARRAY[t.name] as lineage_path
  FROM technologies t
  WHERE NOT EXISTS (
    SELECT 1 FROM technology_lineage tl WHERE tl.child_technology_id = t.id
  )

  UNION ALL

  -- Recursive: Child technologies
  SELECT
    t.id,
    t.name,
    t.code,
    t.origin_institution,
    t.origin_year,
    tt.generation + 1,
    tt.lineage_path || t.name
  FROM technologies t
  INNER JOIN technology_lineage tl ON t.id = tl.child_technology_id
  INNER JOIN tech_tree tt ON tl.parent_technology_id = tt.id
)
SELECT * FROM tech_tree ORDER BY generation, name;

-- 6. Test the view
SELECT
  generation,
  name,
  code,
  origin_institution,
  origin_year,
  array_to_string(lineage_path, ' → ') as lineage
FROM vw_technology_evolution;
