-- ============================================
-- ACM Biolabs Knowledge Graph - SEED DATA PART 3
-- Final Domains: Financial, Organization, Patents, Milestones
-- ============================================

-- Run AFTER 005_seed_data_part2.sql

-- ============================================
-- DOMAIN 7: FINANCIAL (6 Investors, 6 Rounds, 4 Grants)
-- ============================================

-- Investors
INSERT INTO investors (id, investor_name, investor_type, country, description, focus_areas) VALUES
('00000000-0000-0000-0007-000000000001', 'Ritz Venture Capital', 'Family Office', 'Singapore',
 'Singapore family fund managed by Board member Ong Sang Bin with 30+ years venture investment experience. Focuses on early-stage companies applying cutting-edge technology to global challenges.',
 ARRAY['Early-stage technology', 'Deep tech', 'Global health']),

('00000000-0000-0000-0007-000000000002', 'San Pacific Investments', 'Family Office', 'Austria',
 'Founded by Board member Erich Erber (founder of Erber Group/DSM with 50+ global affiliates). Investor network provides critical corporate governance.',
 ARRAY['Life sciences', 'Animal nutrition', 'Technology']),

('00000000-0000-0000-0007-000000000003', 'Efung Capital', 'Venture Capital', NULL,
 'Institutional venture capital investor.',
 ARRAY['Biotechnology', 'Life sciences']),

('00000000-0000-0000-0007-000000000004', 'Nagase & Co.', 'Corporate', 'Japan',
 'Japanese trading and specialty chemicals company.',
 ARRAY['Chemicals', 'Biotechnology', 'Life sciences']),

('00000000-0000-0000-0007-000000000005', 'NTUitive', 'University', 'Singapore',
 'Nanyang Technological University investment and commercialization arm supporting NTU spin-offs.',
 ARRAY['Deep tech', 'University spin-offs', 'Singapore innovation']),

('00000000-0000-0000-0007-000000000006', 'Venturelab', 'Accelerator', 'Switzerland',
 'Accelerator and investor.',
 ARRAY['Startups', 'Biotech', 'European innovation']);

-- Funding Rounds
INSERT INTO funding_rounds (id, round_type, round_name, amount_usd, close_date, announced_date, lead_investor_id, description) VALUES
('00000000-0000-0000-0007-000000000101', 'Seed', 'First Funding Round', NULL, '2016-04-13', '2016-04-13', NULL,
 'First funding round for ACM Biolabs. Amount undisclosed.'),

('00000000-0000-0000-0007-000000000102', 'Series A', 'Series A', 5000000, '2020-03-03', '2020-03-03', '00000000-0000-0000-0007-000000000002',
 '$5M Series A led by San Pacific Investments.'),

('00000000-0000-0000-0007-000000000103', 'Seed', 'ACM Biosciences Seed Round', NULL, '2021-04-07', '2021-04-07', NULL,
 'Seed round for ACM Biosciences subsidiary to advance polymersome platform and COVID-19 vaccine into clinical trials.'),

('00000000-0000-0000-0007-000000000104', 'Seed', 'Seed Round with Venturelab', NULL, '2021-04-15', '2021-04-15', '00000000-0000-0000-0007-000000000006',
 'Seed round with Venturelab accelerator.'),

('00000000-0000-0000-0007-000000000105', 'Series B', 'Series B', 6800000, '2022-10-19', '2022-10-19', '00000000-0000-0000-0007-000000000001',
 '$6.8M with Ritz Venture Capital.'),

('00000000-0000-0000-0007-000000000106', 'Grant', 'CEPI Grant', 2870000, '2025-04-01', '2025-04-01', NULL,
 'Up to $2.87M from CEPI for rabies program.');

-- Investor-Funding Round Junction
INSERT INTO investor_funding_rounds (investor_id, funding_round_id, participation_type) VALUES
('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0007-000000000102', 'Lead'),
('00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0007-000000000102', 'Participant'),
('00000000-0000-0000-0007-000000000004', '00000000-0000-0000-0007-000000000102', 'Participant'),
('00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0007-000000000101', 'Lead'), -- NTUitive early support
('00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0007-000000000104', 'Lead'),
('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0007-000000000105', 'Lead');

-- Grants
INSERT INTO grants (id, grant_name, grantor_organization, grantor_country, amount_usd, amount_description, award_date, purpose, program_id) VALUES
('00000000-0000-0000-0007-000000000201', 'CEPI Rabies Program Grant', 'Coalition for Epidemic Preparedness Innovations (CEPI)', 'Norway',
 2870000, 'Up to $2.87 million', '2025-04-01',
 'Preclinical proof of concept using Rabies as model pathogen for ATP™ mRNA delivery technology. Addresses vaccine equity challenges.',
 '00000000-0000-0000-0003-000000000006'),

('00000000-0000-0000-0007-000000000202', 'Innosuisse Grant for mRNA COVID-19 Vaccine', 'Innosuisse (Swiss Innovation Agency)', 'Switzerland',
 NULL, NULL, '2021-05-27',
 'Develop stable mRNA COVID-19 vaccines with improved storage at refrigerator temperature, logistics, and flexibility. Collaboration with University Hospital Zurich/Dr. Steve Pascolo.',
 '00000000-0000-0000-0003-000000000001'),

('00000000-0000-0000-0007-000000000203', 'Innovate UK - UK-Singapore Collaborative R&D', 'Innovate UK', 'United Kingdom',
 NULL, NULL, '2025-01-01',
 'Support DIOSynVax partnership for universal bird flu vaccine combining AI antigen design with ATP™ delivery.',
 '00000000-0000-0000-0003-000000000005'),

('00000000-0000-0000-0007-000000000204', 'Industry Alignment Fund – Pre-Positioning (IAF-PP)', 'Enterprise Singapore', 'Singapore',
 NULL, NULL, '2024-10-01',
 'Support NCCS collaboration for ACM-CpG Phase 1 trial in advanced solid tumors.',
 '00000000-0000-0000-0003-000000000002');

-- ============================================
-- DOMAIN 8: ORGANIZATION (3 Legal Entities)
-- ============================================

INSERT INTO legal_entities (id, entity_name, entity_type, entity_legal_structure, incorporation_date, incorporation_country, jurisdiction, description, business_purpose, is_active) VALUES
-- ACM Biolabs Pte Ltd (Singapore HQ)
('00000000-0000-0000-0008-000000000001', 'ACM Biolabs Pte Ltd', 'Parent Company', 'Pte Ltd', '2013-01-01', 'Singapore', 'Singapore',
 'Headquarters and parent company. Founded as spin-off from Nanyang Technological University (NTU) research. One of 70 deep-tech firms spun off from NTU valued >$820M (2023).',
 'Clinical-stage biopharmaceutical company developing polymer-based nanoparticle platforms for mRNA delivery and cancer immunotherapy. Research laboratories and early manufacturing.',
 true),

-- ACM Biosciences AG (Basel, Switzerland)
('00000000-0000-0000-0008-000000000002', 'ACM Biosciences AG', 'Subsidiary', 'AG', '2020-09-01', 'Switzerland', 'Switzerland',
 'Subsidiary incorporated September 2020 to internationalize development and leverage Basel pharmaceutical/biotech ecosystem. Secured exclusive worldwide license for proprietary polymersome platform for human infectious disease vaccines from ACM Biolabs Pte Ltd (April 2021).',
 'Leads all clinical and regulatory activities for pipeline programs. Coordinates business development with potential partners.',
 true),

-- ACM Biolabs Pty Ltd (Sydney, Australia)
('00000000-0000-0000-0008-000000000003', 'ACM Biolabs Pty Ltd', 'Subsidiary', 'Pty Ltd', '2022-01-01', 'Australia', 'Australia',
 'Subsidiary established 2022 to operationalize clinical development and support clinical operations.',
 'Conducted Phase I trial of ACM-001 as trial sponsor.',
 true);

-- Entity Locations
INSERT INTO entity_locations (entity_id, location_type, address_line1, city, postal_code, country, phone, email, is_primary) VALUES
-- Singapore HQ
('00000000-0000-0000-0008-000000000001', 'Headquarters', '71 Nanyang Drive, Suite #02M-02, NTU Innovation Centre', 'Singapore', '638075', 'Singapore',
 '+65 6265 5646', 'contact@acmbiolabs.com', true),

-- Basel office
('00000000-0000-0000-0008-000000000002', 'Office', NULL, 'Basel', NULL, 'Switzerland',
 '+41 61 975 85 88', NULL, true),

-- Sydney office
('00000000-0000-0000-0008-000000000003', 'Office', NULL, 'Sydney', NULL, 'Australia',
 NULL, NULL, true);

-- Entity Relationships (parent-subsidiary)
INSERT INTO entity_relationships (parent_entity_id, child_entity_id, relationship_type, ownership_percentage, start_date, description) VALUES
('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0008-000000000002', 'Parent-Subsidiary', 100.00, '2020-09-01',
 'ACM Biolabs Pte Ltd (Singapore) owns ACM Biosciences AG (Basel). ACM Biosciences secured exclusive worldwide license for human infectious disease vaccines.'),

('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0008-000000000003', 'Parent-Subsidiary', 100.00, '2022-01-01',
 'ACM Biolabs Pte Ltd (Singapore) owns ACM Biolabs Pty Ltd (Australia) for clinical operations.');

-- ============================================
-- DOMAIN 9: INTELLECTUAL PROPERTY (6 Patents)
-- ============================================

INSERT INTO patents (id, patent_number, patent_title, filing_date, priority_date, publication_date, patent_status, jurisdiction, assignee_entity_id, abstract, description) VALUES
-- Patent 1
('00000000-0000-0000-0009-000000000001', 'US 2022/0105176 A1', 'Polymersomes Comprising a Covalently Bound Antigen',
 '2019-09-12', NULL, '2022-04-07', 'Published', 'US', '00000000-0000-0000-0008-000000000001',
 'Polymersomes with antigens (polypeptides, carbohydrates, polynucleotides) conjugated to exterior surface via covalent bonds.',
 'Produces stronger humoral immune responses compared to free or encapsulated antigens, with or without adjuvants. Covers membrane anchoring domains (DSPE-PEG, phospholipids, glycolipids, GPI) and applications for cancer, autoimmune diseases, and infectious diseases.'),

-- Patent 2
('00000000-0000-0000-0009-000000000002', 'WO 2019/145475 A2', 'Polymersomes Comprising a Soluble Encapsulated Antigen',
 '2019-01-25', '2018-01-25', '2019-08-01', 'Published', 'WO (PCT)', '00000000-0000-0000-0008-000000000001',
 'Polymersomes comprising soluble encapsulated antigens.',
 'Demonstrated superior IgG titer generation and virus neutralization versus controls. Successful antibody production with encapsulated OVA, hemagglutinin, and PEDv spike protein.'),

-- Patent 3
('00000000-0000-0000-0009-000000000003', 'WO 2021/019102 A2', 'Method of Eliciting an Immune Response by Administering a Population of Polymersomes',
 '2020-08-03', '2020-07-30', '2021-02-04', 'Published', 'WO (PCT)', '00000000-0000-0000-0008-000000000001',
 'Dual-population polymersome approach—separate populations with antigen versus adjuvant—for enhanced immune responses.',
 'Specifically applicable to coronavirus vaccines (SARS-CoV-2, MERS-CoV) with block copolymer compositions including polyacrylic acid and PDMS, compatible with mRNA and protein antigens.');

-- Additional 3 patents referenced in report but not fully detailed
INSERT INTO patents (id, patent_number, patent_title, patent_status, jurisdiction, assignee_entity_id) VALUES
('00000000-0000-0000-0009-000000000004', 'EP3849600A1', 'Polymersomes Comprising a Covalently Bound Antigen (European)', 'Published', 'EP', '00000000-0000-0000-0008-000000000001'),
('00000000-0000-0000-0009-000000000005', 'CN201980021354.5A', 'Polymersomes Comprising a Soluble Encapsulated Antigen (China)', 'Published', 'CN', '00000000-0000-0000-0008-000000000001'),
('00000000-0000-0000-0009-000000000006', 'BR112020013405-8A', 'Polymersomes Comprising a Soluble Encapsulated Antigen (Brazil)', 'Published', 'BR', '00000000-0000-0000-0008-000000000001');

-- Patent Inventors
INSERT INTO patent_inventors (patent_id, person_id, inventor_position) VALUES
-- US 2022/0105176 A1 inventors
('00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0001-000000000001', 1), -- Madhavan Nallani
-- Fabien Decaillot, Thomas Andrew Cornell, Amit Kumar Khan not in people table - would need to add

-- WO 2019/145475 A2 inventors (same inventors)
('00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0001-000000000001', 1), -- Madhavan Nallani

-- WO 2021/019102 inventors (likely same)
('00000000-0000-0000-0009-000000000003', '00000000-0000-0000-0001-000000000001', 1); -- Madhavan Nallani

-- Patent Claims (sample - full claims would be extensive)
INSERT INTO patent_claims (patent_id, claim_number, claim_type, claim_text) VALUES
('00000000-0000-0000-0009-000000000001', 1, 'Independent',
 'A polymersome comprising an antigen covalently conjugated to the exterior surface, wherein the antigen is selected from polypeptides, carbohydrates, and polynucleotides.'),

('00000000-0000-0000-0009-000000000001', 2, 'Dependent',
 'The polymersome of claim 1, wherein the membrane anchoring domain comprises DSPE-PEG, phospholipids, glycolipids, or GPI.'),

('00000000-0000-0000-0009-000000000002', 1, 'Independent',
 'A polymersome comprising a soluble encapsulated antigen in the aqueous core, producing enhanced IgG titers and virus neutralization.'),

('00000000-0000-0000-0009-000000000003', 1, 'Independent',
 'A method of eliciting an immune response comprising administering a first population of polymersomes containing antigen and a second population containing adjuvant.');

-- Patent-Technology Junction
INSERT INTO patent_technologies (patent_id, technology_id, protection_scope) VALUES
('00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0002-000000000002', 'Surface conjugation technology for ACM polymersomes'),
('00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0002-000000000001', 'Antigen presentation method for ATP™ platform'),
('00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0002-000000000002', 'Encapsulation method for ACM polymersomes'),
('00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0002-000000000001', 'Antigen encapsulation for ATP™ platform'),
('00000000-0000-0000-0009-000000000003', '00000000-0000-0000-0002-000000000002', 'Dual-population polymersome administration'),
('00000000-0000-0000-0009-000000000003', '00000000-0000-0000-0002-000000000001', 'Coronavirus vaccine applications for ATP™');

-- Patent Jurisdictions (additional filings)
INSERT INTO patent_jurisdictions (patent_id, jurisdiction_code, application_number, status, filing_date) VALUES
('00000000-0000-0000-0009-000000000001', 'US', '17/276023', 'Published', '2019-09-12'),
('00000000-0000-0000-0009-000000000001', 'EP', 'EP19782906.2A', 'Published', '2019-09-12'),
('00000000-0000-0000-0009-000000000002', 'WO', 'PCT/EP2019/051853', 'Published', '2019-01-25'),
('00000000-0000-0000-0009-000000000002', 'CN', 'CN201980021354.5A', 'Published', '2019-01-25'),
('00000000-0000-0000-0009-000000000002', 'BR', 'BR112020013405-8A', 'Published', '2019-01-25'),
('00000000-0000-0000-0009-000000000002', 'US', 'US16/964,931', 'Published', '2019-01-25');

-- ============================================
-- DOMAIN 10: MILESTONES (15 Key Events 2013-2025)
-- ============================================

INSERT INTO milestones (milestone_date, milestone_category, title, description, significance, announcement_source, program_id, trial_id, partnership_id, funding_round_id, publication_id) VALUES
-- 2013
('2013-01-01', 'Founding', 'ACM Biolabs Founded', 'Company founded by Dr. Madhavan Nallani as NTU spin-off.', 'Company inception leveraging 4+ years of research from IMRE and NTU.', 'Company records', NULL, NULL, NULL, NULL, NULL),

-- 2016
('2016-04-13', 'Funding', 'First Funding Round', 'Secured first financing to advance platform development.', 'Initial capital to develop technology from academic research into commercial platform.', 'PitchBook', NULL, NULL, NULL, '00000000-0000-0000-0007-000000000101', NULL),

-- 2020
('2020-03-03', 'Funding', '$5M Series A Led by San Pacific Investments', 'Series A funding of $5M.', 'Significant capital to advance clinical development.', 'PitchBook', NULL, NULL, NULL, '00000000-0000-0000-0007-000000000102', NULL),

('2020-09-01', 'Company', 'ACM Biosciences AG Established in Basel', 'Created Swiss subsidiary to internationalize development.', 'Geographic expansion into European biotech hub.', 'Company announcement', NULL, NULL, NULL, NULL, NULL),

-- 2021
('2021-04-07', 'Funding', 'ACM Biosciences Secures Exclusive License and Financing', 'Secured exclusive worldwide license for human infectious disease vaccines and closed financing round.', 'Strategic separation of infectious disease (ACM Biosciences) and oncology (ACM Biolabs) programs.', 'Company records', NULL, NULL, NULL, '00000000-0000-0000-0007-000000000103', NULL),

('2021-05-27', 'Partnership', 'Innosuisse Grant Awarded with University Hospital Zurich', 'Swiss Innovation Agency funds mRNA COVID-19 vaccine collaboration.', 'Validation of technology by prestigious Swiss institution and government agency.', 'ACM Biolabs', NULL, NULL, '00000000-0000-0000-0006-000000000004', NULL, NULL),

('2021-10-26', 'Publication', 'ACS Nano Publishes ACM Polymersome Vaccine Paper', 'Peer-reviewed publication validates spike protein subunit vaccine approach.', 'Scientific validation of ACM technology in top-tier journal.', 'ACS Nano', '00000000-0000-0000-0003-000000000001', NULL, NULL, NULL, '00000000-0000-0000-0005-000000000002'),

-- 2022
('2022-01-01', 'Company', 'ACM Biolabs Pty Ltd Established in Sydney', 'Australian subsidiary created for clinical operations.', 'Enables local clinical trial execution.', 'Company records', NULL, NULL, NULL, NULL, NULL),

('2022-07-29', 'Clinical', 'First Patient Dosed in ACM-001 Phase 1 Trial', 'Operation Nasal Vaccine commences with first-in-human dosing across 6 Australian sites.', 'Critical milestone transitioning from preclinical to clinical validation.', 'ACM Biolabs', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0004-000000000001', NULL, NULL, NULL),

('2022-10-19', 'Funding', '$6.8M Financing with Ritz Venture Capital', 'Series B funding.', 'Additional capital to advance multiple programs.', 'PitchBook', NULL, NULL, NULL, '00000000-0000-0000-0007-000000000105', NULL),

-- 2023
('2023-09-05', 'Clinical', 'Positive ACM-001 Phase 1 Results Announced', 'Topline results: safe, well-tolerated, zero SAEs, broadly active antibody responses.', 'First clinical validation of ATP™ platform demonstrating safety and immunogenicity.', 'PR Newswire', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0004-000000000001', NULL, NULL, '00000000-0000-0000-0005-000000000004'),

-- 2025
('2025-03-31', 'Publication', 'Biomacromolecules Publishes BNP Thermostability Paper', 'Peer-reviewed publication documents >1 year storage at 4°C with no degradation.', 'Definitive scientific evidence of breakthrough thermostability solving global vaccine distribution challenge.', 'Biomacromolecules', NULL, NULL, NULL, NULL, '00000000-0000-0000-0005-000000000001'),

('2025-04-22', 'Partnership', 'Dual Partnership Announcements: CEPI and DIOSynVax', 'CEPI awards $2.87M for rabies program; DIOSynVax partnership for universal bird flu vaccine announced.', 'Major validation by global vaccine equity organization and strategic AI partnership for pandemic preparedness.', 'Multiple', '00000000-0000-0000-0003-000000000006', NULL, '00000000-0000-0000-0006-000000000001', NULL, NULL),

('2025-04-22', 'Partnership', 'DIOSynVax Partnership Announced', 'AI-enabled antigen design combined with ATP™ delivery for H5Nx vaccine.', 'Combines cutting-edge AI vaccine design with thermostable delivery platform.', 'ACM Biolabs', '00000000-0000-0000-0003-000000000005', NULL, '00000000-0000-0000-0006-000000000002', NULL, NULL),

('2025-10-22', 'Clinical', 'ACM-CpG Phase 1 Early Results: 8-Month Disease Control', 'Favorable safety with 2/3 patients at 0.25mg achieving durable disease control.', 'Validates oncology applications and polymersome-CpG mechanism of action in first-in-human trial.', 'The Manila Times', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0004-000000000002', NULL, NULL, '00000000-0000-0000-0005-000000000005');

-- ============================================
-- SUMMARY STATISTICS
-- ============================================

-- Query to verify data insertion
SELECT 'People' as domain, COUNT(*) as count FROM people
UNION ALL
SELECT 'Education Records', COUNT(*) FROM person_education
UNION ALL
SELECT 'Person Roles', COUNT(*) FROM person_roles
UNION ALL
SELECT 'Technologies', COUNT(*) FROM technologies
UNION ALL
SELECT 'Technology Specs', COUNT(*) FROM technology_specifications
UNION ALL
SELECT 'Technology Advantages', COUNT(*) FROM technology_advantages
UNION ALL
SELECT 'Research Programs', COUNT(*) FROM research_programs
UNION ALL
SELECT 'Program-Technology Links', COUNT(*) FROM program_technologies
UNION ALL
SELECT 'Clinical Trials', COUNT(*) FROM clinical_trials
UNION ALL
SELECT 'Trial Sites', COUNT(*) FROM trial_sites
UNION ALL
SELECT 'Trial Results', COUNT(*) FROM trial_results
UNION ALL
SELECT 'Publications', COUNT(*) FROM publications
UNION ALL
SELECT 'Publication Authors', COUNT(*) FROM publication_authors
UNION ALL
SELECT 'Partnerships', COUNT(*) FROM partnerships
UNION ALL
SELECT 'Partnership Programs', COUNT(*) FROM partnership_programs
UNION ALL
SELECT 'Investors', COUNT(*) FROM investors
UNION ALL
SELECT 'Funding Rounds', COUNT(*) FROM funding_rounds
UNION ALL
SELECT 'Investor-Round Links', COUNT(*) FROM investor_funding_rounds
UNION ALL
SELECT 'Grants', COUNT(*) FROM grants
UNION ALL
SELECT 'Legal Entities', COUNT(*) FROM legal_entities
UNION ALL
SELECT 'Entity Locations', COUNT(*) FROM entity_locations
UNION ALL
SELECT 'Entity Relationships', COUNT(*) FROM entity_relationships
UNION ALL
SELECT 'Patents', COUNT(*) FROM patents
UNION ALL
SELECT 'Patent Inventors', COUNT(*) FROM patent_inventors
UNION ALL
SELECT 'Patent Claims', COUNT(*) FROM patent_claims
UNION ALL
SELECT 'Patent Technologies', COUNT(*) FROM patent_technologies
UNION ALL
SELECT 'Milestones', COUNT(*) FROM milestones;
