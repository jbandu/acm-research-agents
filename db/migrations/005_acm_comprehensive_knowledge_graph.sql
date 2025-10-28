-- ============================================
-- ACM Biolabs Comprehensive Knowledge Graph
-- Migration: 005_acm_comprehensive_knowledge_graph.sql
-- 10 Normalized Ontology Domains
-- ============================================

-- ============================================
-- DOMAIN 1: PEOPLE (22 Individuals)
-- ============================================

CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(100), -- Dr., PhD, MD, MBA
  primary_role VARCHAR(100), -- 'CEO', 'CMO', 'Board Member', 'Scientist', 'Research Assistant'
  entity_affiliation VARCHAR(100), -- 'ACM Biolabs', 'ACM Biosciences', 'Board', 'Advisor'

  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  orcid VARCHAR(50),
  google_scholar_url TEXT,

  -- Professional Background
  expertise TEXT[], -- Array of expertise areas
  bio TEXT,
  years_experience INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_people_role ON people(primary_role);
CREATE INDEX idx_people_affiliation ON people(entity_affiliation);
CREATE INDEX idx_people_active ON people(is_active);

-- Education credentials
CREATE TABLE IF NOT EXISTS person_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  degree VARCHAR(100) NOT NULL, -- 'PhD', 'MD', 'MBA', 'BSc', 'MSc'
  field_of_study VARCHAR(255),
  institution VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  start_year INTEGER,
  end_year INTEGER,
  is_primary BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_education_person ON person_education(person_id);

-- Additional roles (people can have multiple roles)
CREATE TABLE IF NOT EXISTS person_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  role_type VARCHAR(100) NOT NULL, -- 'executive', 'board', 'scientist', 'advisor', 'author'
  role_title VARCHAR(255) NOT NULL, -- 'CEO & Founder', 'Chief Medical Officer', 'Senior Scientist'
  organization VARCHAR(255), -- 'ACM Biolabs', 'ACM Biosciences', 'External'
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_person_roles_person ON person_roles(person_id);
CREATE INDEX idx_person_roles_type ON person_roles(role_type);

-- ============================================
-- DOMAIN 2: TECHNOLOGY PLATFORMS
-- ============================================

CREATE TABLE IF NOT EXISTS technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50), -- 'ATP', 'ACM', 'BNP', 'ACM-CpG'
  platform_type VARCHAR(100), -- 'Delivery Platform', 'Adjuvant', 'Nanoparticle'

  description TEXT,
  technical_summary TEXT,
  development_status VARCHAR(50), -- 'Preclinical', 'Clinical', 'Validated'

  -- Key specifications
  storage_temperature_celsius VARCHAR(50), -- '2-8°C', '-60 to -90°C'
  storage_duration VARCHAR(100), -- '>1 year at 4°C'
  administration_routes TEXT[], -- ['intramuscular', 'intranasal', 'topical', 'oral']
  payload_types TEXT[], -- ['mRNA', 'protein', 'small molecule', 'oligonucleotide']

  -- Origin tracking
  origin_institution VARCHAR(255), -- 'A*STAR IMRE', 'NTU'
  origin_year INTEGER,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tech_code ON technologies(code);
CREATE INDEX idx_tech_status ON technologies(development_status);

-- Technology specifications (detailed attributes)
CREATE TABLE IF NOT EXISTS technology_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technology_id UUID REFERENCES technologies(id) ON DELETE CASCADE,
  spec_category VARCHAR(100), -- 'composition', 'performance', 'manufacturing'
  spec_name VARCHAR(255) NOT NULL,
  spec_value TEXT,
  spec_unit VARCHAR(50),

  evidence_source VARCHAR(500), -- Reference to publication/data
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tech_specs_tech ON technology_specifications(technology_id);

-- Competitive advantages
CREATE TABLE IF NOT EXISTS technology_advantages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technology_id UUID REFERENCES technologies(id) ON DELETE CASCADE,
  advantage_category VARCHAR(100), -- 'stability', 'immunogenicity', 'cost', 'manufacturing'
  advantage_title VARCHAR(255) NOT NULL,
  advantage_description TEXT,
  comparison_baseline VARCHAR(255), -- 'vs LNPs', 'vs conventional vaccines'

  priority_rank INTEGER, -- 1-10
  evidence_strength VARCHAR(50), -- 'preclinical', 'clinical', 'published'

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tech_adv_tech ON technology_advantages(technology_id);

-- Technology lineage (evolution tracking)
CREATE TABLE IF NOT EXISTS technology_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_technology_id UUID REFERENCES technologies(id),
  child_technology_id UUID REFERENCES technologies(id),
  relationship_type VARCHAR(100), -- 'derived_from', 'enables', 'incorporates'
  description TEXT,
  transition_year INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_self_lineage CHECK (parent_technology_id != child_technology_id)
);

CREATE INDEX idx_lineage_parent ON technology_lineage(parent_technology_id);
CREATE INDEX idx_lineage_child ON technology_lineage(child_technology_id);

-- ============================================
-- DOMAIN 3: RESEARCH PROGRAMS (8 Programs)
-- ============================================

CREATE TABLE IF NOT EXISTS research_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code VARCHAR(50) UNIQUE, -- 'ACM-001', 'ACM-005', 'ACM-CpG', 'ACM-010', 'ACM-011'
  program_name VARCHAR(500) NOT NULL,

  therapeutic_area VARCHAR(100), -- 'Infectious Diseases', 'Oncology', 'Ophthalmology'
  indication VARCHAR(255), -- 'COVID-19', 'Advanced Solid Tumors', 'Rabies'

  development_stage VARCHAR(100), -- 'Discovery', 'Preclinical', 'IND-Enabling', 'Phase 1', 'Phase 2'
  priority_level VARCHAR(50), -- 'High', 'Medium', 'Low'

  description TEXT,
  scientific_rationale TEXT,

  -- Timeline
  start_date DATE,
  expected_ind_filing DATE,
  expected_first_patient DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,
  status_notes TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_programs_code ON research_programs(program_code);
CREATE INDEX idx_programs_area ON research_programs(therapeutic_area);
CREATE INDEX idx_programs_stage ON research_programs(development_stage);

-- Junction: Programs use Technologies
CREATE TABLE IF NOT EXISTS program_technologies (
  program_id UUID REFERENCES research_programs(id) ON DELETE CASCADE,
  technology_id UUID REFERENCES technologies(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100), -- 'primary_platform', 'incorporates', 'evaluates'
  description TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (program_id, technology_id)
);

-- Program status history (track progress)
CREATE TABLE IF NOT EXISTS program_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES research_programs(id) ON DELETE CASCADE,
  old_stage VARCHAR(100),
  new_stage VARCHAR(100) NOT NULL,
  transition_date DATE NOT NULL,
  notes TEXT,
  announced_via VARCHAR(255), -- 'Press Release', 'Conference', 'Publication'

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_status_history_program ON program_status_history(program_id);

-- ============================================
-- DOMAIN 4: CLINICAL TRIALS (2 Trials)
-- ============================================

CREATE TABLE IF NOT EXISTS clinical_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nct_id VARCHAR(50) UNIQUE, -- 'NCT05385991', 'NCT06587295'
  program_id UUID REFERENCES research_programs(id),

  trial_title TEXT NOT NULL,
  phase VARCHAR(50), -- 'Phase 1', 'Phase 1/2', 'Phase 2'
  design VARCHAR(255), -- 'Open-label', 'Dose Escalation (3+3)', 'Randomized'

  -- Patient Population
  indication VARCHAR(500),
  enrollment_target INTEGER,
  enrollment_actual INTEGER,

  -- Status
  status VARCHAR(100), -- 'Active', 'Completed', 'Recruiting'
  start_date DATE,
  completion_date DATE,

  -- Sponsor
  sponsor VARCHAR(255), -- 'ACM Biolabs Pty Ltd', 'ACM Biolabs Pte Ltd'

  -- Administration
  administration_route VARCHAR(100), -- 'Intramuscular', 'Intranasal'
  dosing_schedule VARCHAR(255),

  description TEXT,
  primary_endpoints TEXT,
  secondary_endpoints TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trials_nct ON clinical_trials(nct_id);
CREATE INDEX idx_trials_program ON clinical_trials(program_id);
CREATE INDEX idx_trials_status ON clinical_trials(status);

-- Trial sites/locations
CREATE TABLE IF NOT EXISTS trial_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID REFERENCES clinical_trials(id) ON DELETE CASCADE,
  site_name VARCHAR(500),
  city VARCHAR(255),
  country VARCHAR(100),
  site_number INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trial_sites_trial ON trial_sites(trial_id);

-- Investigators
CREATE TABLE IF NOT EXISTS trial_investigators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID REFERENCES clinical_trials(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id),
  investigator_type VARCHAR(100), -- 'Principal Investigator', 'Co-Investigator', 'Site PI'
  affiliation VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_investigators_trial ON trial_investigators(trial_id);
CREATE INDEX idx_investigators_person ON trial_investigators(person_id);

-- Trial results
CREATE TABLE IF NOT EXISTS trial_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID REFERENCES clinical_trials(id) ON DELETE CASCADE,
  result_type VARCHAR(100), -- 'Topline', 'Interim', 'Final', 'Safety'
  announcement_date DATE,

  -- Safety
  no_serious_adverse_events BOOLEAN,
  safety_summary TEXT,

  -- Efficacy
  efficacy_summary TEXT,

  -- Details
  results_text TEXT,
  publication_reference VARCHAR(500),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trial_results_trial ON trial_results(trial_id);

-- ============================================
-- DOMAIN 5: PUBLICATIONS (15 Outputs)
-- ============================================

CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pub_type VARCHAR(100), -- 'Peer-Reviewed', 'Conference', 'Press Release', 'Preprint'

  title TEXT NOT NULL,
  journal_or_venue VARCHAR(500),
  publication_date DATE,

  -- Identifiers
  doi VARCHAR(255),
  pmid VARCHAR(50),
  url TEXT,

  -- Content
  abstract TEXT,
  key_findings TEXT,

  -- Metrics
  citation_count INTEGER DEFAULT 0,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pubs_type ON publications(pub_type);
CREATE INDEX idx_pubs_date ON publications(publication_date DESC);
CREATE INDEX idx_pubs_doi ON publications(doi);
CREATE INDEX idx_pubs_pmid ON publications(pmid);

-- Junction: Authors
CREATE TABLE IF NOT EXISTS publication_authors (
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  author_position INTEGER, -- 1 = first author, etc.
  is_corresponding BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (publication_id, person_id)
);

CREATE INDEX idx_pub_authors_pub ON publication_authors(publication_id);
CREATE INDEX idx_pub_authors_person ON publication_authors(person_id);

-- Junction: Publications validate Programs
CREATE TABLE IF NOT EXISTS publication_programs (
  publication_id UUID REFERENCES publications(id) ON DELETE CASCADE,
  program_id UUID REFERENCES research_programs(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100), -- 'validates', 'supports', 'announces'

  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (publication_id, program_id)
);

-- ============================================
-- DOMAIN 6: PARTNERSHIPS (4 Strategic)
-- ============================================

CREATE TABLE IF NOT EXISTS partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name VARCHAR(500) NOT NULL,
  partner_type VARCHAR(100), -- 'Government', 'Non-profit', 'Industry', 'Academic'
  partner_country VARCHAR(100),

  partnership_type VARCHAR(100), -- 'Funding', 'Research Collaboration', 'Co-Development'

  -- Terms
  start_date DATE,
  end_date DATE,
  status VARCHAR(50), -- 'Active', 'Completed'

  description TEXT,
  objectives TEXT,
  deliverables TEXT,

  -- Financial
  funding_amount DECIMAL(12,2),
  funding_currency VARCHAR(10) DEFAULT 'USD',

  announcement_date DATE,
  announcement_source TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_partnerships_partner ON partnerships(partner_name);
CREATE INDEX idx_partnerships_type ON partnerships(partner_type);
CREATE INDEX idx_partnerships_status ON partnerships(status);

-- Junction: Partnerships enable Programs
CREATE TABLE IF NOT EXISTS partnership_programs (
  partnership_id UUID REFERENCES partnerships(id) ON DELETE CASCADE,
  program_id UUID REFERENCES research_programs(id) ON DELETE CASCADE,
  role_description TEXT, -- How partnership supports the program

  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (partnership_id, program_id)
);

-- ============================================
-- DOMAIN 7: FINANCIAL (6 Rounds, 6 Investors, 4 Grants)
-- ============================================

CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_name VARCHAR(500) NOT NULL UNIQUE,
  investor_type VARCHAR(100), -- 'Venture Capital', 'Family Office', 'Corporate', 'University', 'Accelerator'
  country VARCHAR(100),

  description TEXT,
  focus_areas TEXT[],
  website VARCHAR(500),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_investors_type ON investors(investor_type);

CREATE TABLE IF NOT EXISTS funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_type VARCHAR(100), -- 'Seed', 'Series A', 'Series B', 'Grant'
  round_name VARCHAR(255),

  amount_usd DECIMAL(12,2),
  amount_currency VARCHAR(10) DEFAULT 'USD',

  close_date DATE,
  announced_date DATE,

  lead_investor_id UUID REFERENCES investors(id),

  description TEXT,
  use_of_funds TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rounds_date ON funding_rounds(close_date DESC);
CREATE INDEX idx_rounds_type ON funding_rounds(round_type);

-- Junction: Investors in Rounds
CREATE TABLE IF NOT EXISTS investor_funding_rounds (
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
  funding_round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE,
  participation_type VARCHAR(100), -- 'Lead', 'Co-Lead', 'Participant'

  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (investor_id, funding_round_id)
);

CREATE TABLE IF NOT EXISTS grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_name VARCHAR(500) NOT NULL,
  grantor_organization VARCHAR(500), -- 'CEPI', 'Innosuisse', 'Innovate UK', 'Enterprise Singapore'
  grantor_country VARCHAR(100),

  amount_usd DECIMAL(12,2),
  amount_currency VARCHAR(10) DEFAULT 'USD',
  amount_description VARCHAR(255), -- 'up to $2.87M'

  award_date DATE,
  start_date DATE,
  end_date DATE,

  purpose TEXT,
  deliverables TEXT,

  program_id UUID REFERENCES research_programs(id), -- Which program benefits

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grants_grantor ON grants(grantor_organization);
CREATE INDEX idx_grants_program ON grants(program_id);

-- ============================================
-- DOMAIN 8: ORGANIZATION (3 Legal Entities)
-- ============================================

CREATE TABLE IF NOT EXISTS legal_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name VARCHAR(500) NOT NULL,
  entity_type VARCHAR(100), -- 'Parent Company', 'Subsidiary', 'Branch'
  entity_legal_structure VARCHAR(100), -- 'Pte Ltd', 'AG', 'Pty Ltd'

  incorporation_date DATE,
  incorporation_country VARCHAR(100),
  jurisdiction VARCHAR(100),

  -- Registration
  registration_number VARCHAR(255),
  tax_id VARCHAR(255),

  -- Status
  is_active BOOLEAN DEFAULT true,

  description TEXT,
  business_purpose TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_entities_type ON legal_entities(entity_type);
CREATE INDEX idx_entities_active ON legal_entities(is_active);

CREATE TABLE IF NOT EXISTS entity_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES legal_entities(id) ON DELETE CASCADE,
  location_type VARCHAR(100), -- 'Headquarters', 'Office', 'Laboratory', 'Manufacturing'

  address_line1 VARCHAR(500),
  address_line2 VARCHAR(500),
  city VARCHAR(255),
  state_province VARCHAR(255),
  postal_code VARCHAR(50),
  country VARCHAR(100),

  phone VARCHAR(50),
  email VARCHAR(255),

  is_primary BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_entity ON entity_locations(entity_id);

-- Entity relationships (parent-subsidiary)
CREATE TABLE IF NOT EXISTS entity_relationships (
  parent_entity_id UUID REFERENCES legal_entities(id) ON DELETE CASCADE,
  child_entity_id UUID REFERENCES legal_entities(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100), -- 'Parent-Subsidiary', 'Affiliate', 'Joint Venture'
  ownership_percentage DECIMAL(5,2),

  start_date DATE,
  end_date DATE,

  description TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (parent_entity_id, child_entity_id),
  CONSTRAINT no_self_relationship CHECK (parent_entity_id != child_entity_id)
);

-- ============================================
-- DOMAIN 9: INTELLECTUAL PROPERTY (6 Patents)
-- ============================================

CREATE TABLE IF NOT EXISTS patents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patent_number VARCHAR(100) UNIQUE, -- 'US 2022/0105176 A1', 'WO 2019/145475 A2'
  patent_title TEXT NOT NULL,

  -- Filing information
  filing_date DATE,
  priority_date DATE,
  publication_date DATE,
  grant_date DATE,

  -- Status
  patent_status VARCHAR(100), -- 'Filed', 'Published', 'Granted', 'Pending'
  jurisdiction VARCHAR(100), -- 'US', 'EP', 'WO (PCT)', 'CN', 'BR'

  -- Assignee
  assignee_entity_id UUID REFERENCES legal_entities(id),

  abstract TEXT,
  description TEXT,

  -- Links
  patent_url TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patents_number ON patents(patent_number);
CREATE INDEX idx_patents_status ON patents(patent_status);
CREATE INDEX idx_patents_jurisdiction ON patents(jurisdiction);

-- Junction: Patent Inventors
CREATE TABLE IF NOT EXISTS patent_inventors (
  patent_id UUID REFERENCES patents(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  inventor_position INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (patent_id, person_id)
);

CREATE TABLE IF NOT EXISTS patent_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patent_id UUID REFERENCES patents(id) ON DELETE CASCADE,
  claim_number INTEGER,
  claim_type VARCHAR(50), -- 'Independent', 'Dependent'
  claim_text TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_claims_patent ON patent_claims(patent_id);

-- Junction: Patents protect Technologies
CREATE TABLE IF NOT EXISTS patent_technologies (
  patent_id UUID REFERENCES patents(id) ON DELETE CASCADE,
  technology_id UUID REFERENCES technologies(id) ON DELETE CASCADE,
  protection_scope TEXT, -- What aspect is protected

  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (patent_id, technology_id)
);

-- Additional jurisdictions (same patent family in multiple countries)
CREATE TABLE IF NOT EXISTS patent_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patent_id UUID REFERENCES patents(id) ON DELETE CASCADE,
  jurisdiction_code VARCHAR(10), -- 'US', 'EP', 'CN', 'BR', 'AU'
  application_number VARCHAR(100),
  status VARCHAR(100),
  filing_date DATE,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patent_juris_patent ON patent_jurisdictions(patent_id);

-- ============================================
-- DOMAIN 10: MILESTONES (15 Key Events 2013-2025)
-- ============================================

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_date DATE NOT NULL,
  milestone_category VARCHAR(100), -- 'Founding', 'Funding', 'Clinical', 'Partnership', 'Regulatory', 'Publication'

  title VARCHAR(500) NOT NULL,
  description TEXT,
  significance TEXT,

  -- Links to entities
  program_id UUID REFERENCES research_programs(id),
  trial_id UUID REFERENCES clinical_trials(id),
  partnership_id UUID REFERENCES partnerships(id),
  funding_round_id UUID REFERENCES funding_rounds(id),
  publication_id UUID REFERENCES publications(id),

  -- Announcement
  announcement_source VARCHAR(500),
  announcement_url TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_milestones_date ON milestones(milestone_date DESC);
CREATE INDEX idx_milestones_category ON milestones(milestone_category);

-- ============================================
-- CROSS-DOMAIN RELATIONSHIP TABLES
-- ============================================

-- People → Publications (authorship) - already created as publication_authors
-- People → Clinical Trials (investigators) - already created as trial_investigators
-- People → Technologies (inventors/developers)
CREATE TABLE IF NOT EXISTS person_technology_contributions (
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  technology_id UUID REFERENCES technologies(id) ON DELETE CASCADE,
  contribution_type VARCHAR(100), -- 'Inventor', 'Developer', 'Researcher'
  description TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (person_id, technology_id)
);

-- ============================================
-- HELPER VIEWS FOR COMPLEX QUERIES
-- ============================================

-- View: All programs using ATP™ platform with clinical status
CREATE OR REPLACE VIEW vw_atp_programs AS
SELECT
  rp.program_code,
  rp.program_name,
  rp.therapeutic_area,
  rp.indication,
  rp.development_stage,
  rp.is_active,
  t.name as technology_name,
  pt.relationship_type as tech_relationship,
  ct.nct_id,
  ct.phase as trial_phase,
  ct.status as trial_status
FROM research_programs rp
INNER JOIN program_technologies pt ON rp.id = pt.program_id
INNER JOIN technologies t ON pt.technology_id = t.id
LEFT JOIN clinical_trials ct ON rp.id = ct.program_id
WHERE t.code = 'ATP'
ORDER BY rp.development_stage DESC, rp.program_code;

-- View: Funding timeline with investor relationships
CREATE OR REPLACE VIEW vw_funding_timeline AS
SELECT
  fr.round_type,
  fr.round_name,
  fr.close_date,
  fr.amount_usd,
  fr.amount_currency,
  i.investor_name as lead_investor,
  string_agg(DISTINCT i2.investor_name, ', ' ORDER BY i2.investor_name) as participating_investors,
  fr.description
FROM funding_rounds fr
LEFT JOIN investors i ON fr.lead_investor_id = i.id
LEFT JOIN investor_funding_rounds ifr ON fr.id = ifr.funding_round_id
LEFT JOIN investors i2 ON ifr.investor_id = i2.id
GROUP BY fr.id, fr.round_type, fr.round_name, fr.close_date, fr.amount_usd, fr.amount_currency, i.investor_name, fr.description
ORDER BY fr.close_date DESC;

-- View: Publication co-authorship network
CREATE OR REPLACE VIEW vw_publication_network AS
SELECT
  pub.title,
  pub.journal_or_venue,
  pub.publication_date,
  pub.pub_type,
  pub.doi,
  pub.pmid,
  string_agg(p.full_name, '; ' ORDER BY pa.author_position) as authors,
  COUNT(pa.person_id) as author_count
FROM publications pub
INNER JOIN publication_authors pa ON pub.id = pa.publication_id
INNER JOIN people p ON pa.person_id = p.id
GROUP BY pub.id, pub.title, pub.journal_or_venue, pub.publication_date, pub.pub_type, pub.doi, pub.pmid
ORDER BY pub.publication_date DESC;

-- View: Partnership impact on programs
CREATE OR REPLACE VIEW vw_partnership_impact AS
SELECT
  p.partner_name,
  p.partner_type,
  p.partnership_type,
  p.funding_amount,
  p.status,
  rp.program_code,
  rp.program_name,
  rp.therapeutic_area,
  rp.development_stage,
  pp.role_description
FROM partnerships p
INNER JOIN partnership_programs pp ON p.id = pp.partnership_id
INNER JOIN research_programs rp ON pp.program_id = rp.id
ORDER BY p.partner_name, rp.program_code;

-- View: Technology lineage from origin to applications
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

-- View: Patent portfolio with inventors and technologies
CREATE OR REPLACE VIEW vw_patent_portfolio AS
SELECT
  pat.patent_number,
  pat.patent_title,
  pat.patent_status,
  pat.jurisdiction,
  pat.filing_date,
  pat.grant_date,
  string_agg(DISTINCT p.full_name, '; ' ORDER BY p.full_name) as inventors,
  string_agg(DISTINCT t.name, '; ' ORDER BY t.name) as protected_technologies,
  le.entity_name as assignee
FROM patents pat
LEFT JOIN patent_inventors pi ON pat.id = pi.patent_id
LEFT JOIN people p ON pi.person_id = p.id
LEFT JOIN patent_technologies pt ON pat.id = pt.patent_id
LEFT JOIN technologies t ON pt.technology_id = t.id
LEFT JOIN legal_entities le ON pat.assignee_entity_id = le.id
GROUP BY pat.id, pat.patent_number, pat.patent_title, pat.patent_status, pat.jurisdiction,
         pat.filing_date, pat.grant_date, le.entity_name
ORDER BY pat.filing_date DESC;

-- View: Clinical trial progress
CREATE OR REPLACE VIEW vw_clinical_trials_progress AS
SELECT
  ct.nct_id,
  ct.trial_title,
  ct.phase,
  ct.status,
  rp.program_code,
  rp.program_name,
  ct.enrollment_target,
  ct.enrollment_actual,
  ct.start_date,
  ct.completion_date,
  COUNT(DISTINCT ts.id) as site_count,
  string_agg(DISTINCT ts.country, ', ') as countries
FROM clinical_trials ct
INNER JOIN research_programs rp ON ct.program_id = rp.id
LEFT JOIN trial_sites ts ON ct.id = ts.trial_id
GROUP BY ct.id, ct.nct_id, ct.trial_title, ct.phase, ct.status, rp.program_code, rp.program_name,
         ct.enrollment_target, ct.enrollment_actual, ct.start_date, ct.completion_date
ORDER BY ct.start_date DESC;

-- View: Key milestones timeline
CREATE OR REPLACE VIEW vw_milestones_timeline AS
SELECT
  m.milestone_date,
  m.milestone_category,
  m.title,
  m.description,
  rp.program_code as related_program,
  p.partner_name as related_partner,
  fr.round_type as related_funding,
  pub.title as related_publication
FROM milestones m
LEFT JOIN research_programs rp ON m.program_id = rp.id
LEFT JOIN partnerships p ON m.partnership_id = p.id
LEFT JOIN funding_rounds fr ON m.funding_round_id = fr.id
LEFT JOIN publications pub ON m.publication_id = pub.id
ORDER BY m.milestone_date DESC;

-- ============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================

CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technologies_updated_at BEFORE UPDATE ON technologies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON research_programs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trials_updated_at BEFORE UPDATE ON clinical_trials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON publications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partnerships_updated_at BEFORE UPDATE ON partnerships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON legal_entities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patents_updated_at BEFORE UPDATE ON patents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE people IS 'Domain 1: Leadership team, scientists, board members, advisors (22 individuals)';
COMMENT ON TABLE technologies IS 'Domain 2: Technology platforms (ATP, ACM, BNP, ACM-CpG)';
COMMENT ON TABLE research_programs IS 'Domain 3: Research pipeline (8 programs across therapeutic areas)';
COMMENT ON TABLE clinical_trials IS 'Domain 4: Clinical trials (NCT05385991, NCT06587295)';
COMMENT ON TABLE publications IS 'Domain 5: Scientific output (15 publications, presentations, press releases)';
COMMENT ON TABLE partnerships IS 'Domain 6: Strategic collaborations (CEPI, DIOSynVax, NCCS, University Hospital Zurich)';
COMMENT ON TABLE funding_rounds IS 'Domain 7: Funding history ($26M total across 6 rounds)';
COMMENT ON TABLE legal_entities IS 'Domain 8: Organization structure (Singapore HQ, Basel subsidiary, Sydney subsidiary)';
COMMENT ON TABLE patents IS 'Domain 9: Intellectual property portfolio (6 patents protecting platform technologies)';
COMMENT ON TABLE milestones IS 'Domain 10: Company timeline (15 key events from 2013-2025)';
