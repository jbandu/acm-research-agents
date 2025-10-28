-- ============================================
-- SYNC: Comprehensive Knowledge Graph → Visualization Schema
-- Populates acm_nodes and acm_relationships from the comprehensive schema
-- ============================================

-- This script syncs data from migration 005 (comprehensive KG) to migration 003 (visualization schema)
-- Run this AFTER running migrations 003 and 005

-- Clear existing comprehensive data (keep only manually added nodes/relationships)
-- We'll re-sync everything from the comprehensive schema

-- ============================================
-- STEP 1: Ensure all 10 domains exist
-- ============================================

INSERT INTO acm_domains (name, description, icon, color, display_order) VALUES
('People', 'Leadership, scientists, board members, and staff', '👥', '#3B82F6', 1),
('Technology Platforms', 'Core R&D platforms and delivery systems', '🔬', '#8B5CF6', 2),
('Research Programs', 'Active research and development pipeline', '🧬', '#10B981', 3),
('Clinical Trials', 'Clinical validation studies', '🧪', '#F59E0B', 4),
('Publications', 'Scientific publications and presentations', '📄', '#06B6D4', 5),
('Partnerships', 'Strategic collaborations and alliances', '🤝', '#EC4899', 6),
('Financial', 'Funding, investors, and grants', '💰', '#14B8A6', 7),
('Organization', 'Legal entities and global presence', '🏢', '#6366F1', 8),
('Intellectual Property', 'Patents protecting technologies', '📜', '#A855F7', 9),
('Milestones', 'Key company achievements and timeline', '🎯', '#F97316', 10)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  display_order = EXCLUDED.display_order;

-- ============================================
-- STEP 2: Populate acm_nodes from People
-- ============================================

INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y)
SELECT
  p.id,
  (SELECT id FROM acm_domains WHERE name = 'People'),
  CASE p.primary_role
    WHEN 'CEO' THEN 'executive'
    WHEN 'CMO' THEN 'executive'
    WHEN 'Board Member' THEN 'board'
    WHEN 'Head of Discovery Research' THEN 'scientist'
    WHEN 'Senior Scientist' THEN 'scientist'
    WHEN 'Preclinical Scientist' THEN 'scientist'
    WHEN 'Scientist' THEN 'scientist'
    ELSE 'person'
  END,
  p.full_name,
  COALESCE(p.bio, p.title || ' - ' || array_to_string(p.expertise, ', ')),
  jsonb_build_object(
    'role', p.primary_role,
    'affiliation', p.entity_affiliation,
    'expertise', p.expertise,
    'email', p.email,
    'linkedin', p.linkedin_url
  ),
  (ROW_NUMBER() OVER (ORDER BY p.id)) * 200,
  CASE p.primary_role
    WHEN 'CEO' THEN 100
    WHEN 'CMO' THEN 150
    WHEN 'Board Member' THEN 200
    ELSE 300
  END
FROM people p
WHERE p.is_active = true
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata;

-- ============================================
-- STEP 3: Populate acm_nodes from Technologies
-- ============================================

INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y)
SELECT
  t.id,
  (SELECT id FROM acm_domains WHERE name = 'Technology Platforms'),
  'technology',
  t.name,
  COALESCE(t.description, t.technical_summary),
  jsonb_build_object(
    'code', t.code,
    'platform_type', t.platform_type,
    'development_status', t.development_status,
    'storage_temp', t.storage_temperature_celsius,
    'storage_duration', t.storage_duration,
    'origin', t.origin_institution,
    'origin_year', t.origin_year
  ),
  (ROW_NUMBER() OVER (ORDER BY t.origin_year NULLS LAST, t.id)) * 300 + 1000,
  400
FROM technologies t
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata;

-- ============================================
-- STEP 4: Populate acm_nodes from Research Programs
-- ============================================

INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y)
SELECT
  rp.id,
  (SELECT id FROM acm_domains WHERE name = 'Research Programs'),
  'program',
  rp.program_code || ': ' || rp.program_name,
  rp.description,
  jsonb_build_object(
    'program_code', rp.program_code,
    'therapeutic_area', rp.therapeutic_area,
    'indication', rp.indication,
    'development_stage', rp.development_stage,
    'priority', rp.priority_level,
    'is_active', rp.is_active
  ),
  (ROW_NUMBER() OVER (ORDER BY
    CASE rp.development_stage
      WHEN 'Phase 2' THEN 1
      WHEN 'Phase 1 Ongoing' THEN 2
      WHEN 'Phase 1 Completed' THEN 3
      WHEN 'IND-Enabling' THEN 4
      WHEN 'Preclinical' THEN 5
      ELSE 6
    END, rp.id)) * 250 + 2000,
  600
FROM research_programs rp
WHERE rp.is_active = true
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata;

-- ============================================
-- STEP 5: Populate acm_nodes from Clinical Trials
-- ============================================

INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y)
SELECT
  ct.id,
  (SELECT id FROM acm_domains WHERE name = 'Clinical Trials'),
  'trial',
  ct.nct_id || ': ' || ct.phase,
  ct.trial_title,
  jsonb_build_object(
    'nct_id', ct.nct_id,
    'phase', ct.phase,
    'status', ct.status,
    'indication', ct.indication,
    'sponsor', ct.sponsor,
    'enrollment', ct.enrollment_actual
  ),
  (ROW_NUMBER() OVER (ORDER BY ct.start_date DESC NULLS LAST)) * 400 + 3000,
  800
FROM clinical_trials ct
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata;

-- ============================================
-- STEP 6: Populate acm_nodes from Publications (Top 10)
-- ============================================

INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y)
SELECT
  pub.id,
  (SELECT id FROM acm_domains WHERE name = 'Publications'),
  'publication',
  pub.title,
  pub.abstract,
  jsonb_build_object(
    'pub_type', pub.pub_type,
    'journal', pub.journal_or_venue,
    'date', pub.publication_date,
    'doi', pub.doi,
    'pmid', pub.pmid
  ),
  (ROW_NUMBER() OVER (ORDER BY pub.publication_date DESC NULLS LAST)) * 300 + 4000,
  1000
FROM publications pub
WHERE pub.pub_type IN ('Peer-Reviewed', 'Conference')
ORDER BY pub.publication_date DESC
LIMIT 10
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata;

-- ============================================
-- STEP 7: Populate acm_nodes from Partnerships
-- ============================================

INSERT INTO acm_nodes (id, domain_id, node_type, name, description, metadata, position_x, position_y)
SELECT
  p.id,
  (SELECT id FROM acm_domains WHERE name = 'Partnerships'),
  'partnership',
  p.partner_name,
  p.description,
  jsonb_build_object(
    'partner_type', p.partner_type,
    'country', p.partner_country,
    'partnership_type', p.partnership_type,
    'status', p.status,
    'funding', p.funding_amount
  ),
  (ROW_NUMBER() OVER (ORDER BY p.start_date DESC NULLS LAST)) * 350 + 5000,
  1200
FROM partnerships p
WHERE p.status = 'Active'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata;

-- ============================================
-- STEP 8: Create Relationships - Person → Technology (Inventors)
-- ============================================

INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description)
SELECT
  ptc.person_id,
  ptc.technology_id,
  'invented',
  CASE ptc.contribution_type
    WHEN 'Inventor' THEN 100
    WHEN 'Developer' THEN 80
    ELSE 60
  END,
  ptc.contribution_type || ': ' || COALESCE(ptc.description, 'contributed to technology development')
FROM person_technology_contributions ptc
WHERE EXISTS (SELECT 1 FROM acm_nodes WHERE id = ptc.person_id)
  AND EXISTS (SELECT 1 FROM acm_nodes WHERE id = ptc.technology_id)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 9: Create Relationships - Technology → Technology (Lineage)
-- ============================================

INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description)
SELECT
  tl.parent_technology_id,
  tl.child_technology_id,
  tl.relationship_type,
  CASE tl.relationship_type
    WHEN 'derived_from' THEN 90
    WHEN 'enables' THEN 85
    WHEN 'incorporates' THEN 80
    ELSE 70
  END,
  tl.description || ' (' || tl.transition_year || ')'
FROM technology_lineage tl
WHERE EXISTS (SELECT 1 FROM acm_nodes WHERE id = tl.parent_technology_id)
  AND EXISTS (SELECT 1 FROM acm_nodes WHERE id = tl.child_technology_id)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 10: Create Relationships - Technology → Program
-- ============================================

INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description)
SELECT
  pt.technology_id,
  pt.program_id,
  CASE pt.relationship_type
    WHEN 'primary_platform' THEN 'enables'
    ELSE pt.relationship_type
  END,
  CASE pt.relationship_type
    WHEN 'primary_platform' THEN 95
    WHEN 'incorporates' THEN 75
    ELSE 60
  END,
  COALESCE(pt.description, 'Technology used in research program')
FROM program_technologies pt
WHERE EXISTS (SELECT 1 FROM acm_nodes WHERE id = pt.technology_id)
  AND EXISTS (SELECT 1 FROM acm_nodes WHERE id = pt.program_id)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 11: Create Relationships - Program → Clinical Trial
-- ============================================

INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description)
SELECT
  ct.program_id,
  ct.id,
  'tested_in',
  CASE ct.status
    WHEN 'Completed' THEN 100
    WHEN 'Active' THEN 90
    ELSE 70
  END,
  ct.phase || ' clinical trial: ' || ct.nct_id
FROM clinical_trials ct
WHERE ct.program_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM acm_nodes WHERE id = ct.program_id)
  AND EXISTS (SELECT 1 FROM acm_nodes WHERE id = ct.id)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 12: Create Relationships - Person → Publication (Authors)
-- ============================================

INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description)
SELECT
  pa.person_id,
  pa.publication_id,
  CASE
    WHEN pa.author_position = 1 THEN 'first_author'
    WHEN pa.is_corresponding THEN 'corresponding_author'
    ELSE 'co_author'
  END,
  CASE
    WHEN pa.author_position = 1 THEN 100
    WHEN pa.is_corresponding THEN 95
    ELSE 70 - (pa.author_position * 5)
  END,
  'Author position ' || pa.author_position
FROM publication_authors pa
WHERE EXISTS (SELECT 1 FROM acm_nodes WHERE id = pa.person_id)
  AND EXISTS (SELECT 1 FROM acm_nodes WHERE id = pa.publication_id)
LIMIT 50 -- Limit to prevent too many edges
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 13: Create Relationships - Publication → Program (Validates)
-- ============================================

INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description)
SELECT
  pp.publication_id,
  pp.program_id,
  pp.relationship_type,
  CASE pp.relationship_type
    WHEN 'validates' THEN 90
    WHEN 'announces' THEN 85
    WHEN 'supports' THEN 75
    ELSE 70
  END,
  'Publication ' || pp.relationship_type || ' program'
FROM publication_programs pp
WHERE EXISTS (SELECT 1 FROM acm_nodes WHERE id = pp.publication_id)
  AND EXISTS (SELECT 1 FROM acm_nodes WHERE id = pp.program_id)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 14: Create Relationships - Partnership → Program
-- ============================================

INSERT INTO acm_relationships (source_node_id, target_node_id, relationship_type, strength, description)
SELECT
  pp.partnership_id,
  pp.program_id,
  'supports',
  90,
  COALESCE(pp.role_description, 'Partnership supports program')
FROM partnership_programs pp
WHERE EXISTS (SELECT 1 FROM acm_nodes WHERE id = pp.partnership_id)
  AND EXISTS (SELECT 1 FROM acm_nodes WHERE id = pp.program_id)
ON CONFLICT DO NOTHING;

-- ============================================
-- STATISTICS
-- ============================================

-- Show summary of what was synced
SELECT
  'Nodes Synced' as metric,
  COUNT(*) as count,
  string_agg(DISTINCT d.name, ', ' ORDER BY d.name) as domains
FROM acm_nodes n
LEFT JOIN acm_domains d ON n.domain_id = d.id
GROUP BY 'Nodes Synced'

UNION ALL

SELECT
  'Relationships Synced',
  COUNT(*),
  string_agg(DISTINCT relationship_type, ', ' ORDER BY relationship_type)
FROM acm_relationships

UNION ALL

SELECT
  'Domains Available',
  COUNT(*),
  string_agg(name, ', ' ORDER BY display_order)
FROM acm_domains;
