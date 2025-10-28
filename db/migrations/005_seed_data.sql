-- ============================================
-- ACM Biolabs Knowledge Graph - SEED DATA
-- Migration: 005_seed_data.sql
-- Complete data from ACM Biolabs Comprehensive Research Report
-- ============================================

-- Note: Run this AFTER 005_acm_comprehensive_knowledge_graph.sql

-- ============================================
-- DOMAIN 1: PEOPLE (22 Individuals)
-- ============================================

-- Executive Leadership
INSERT INTO people (id, full_name, title, primary_role, entity_affiliation, email, phone, linkedin_url, orcid, google_scholar_url, expertise, bio, is_active) VALUES
-- Madhavan Nallani
('00000000-0000-0000-0001-000000000001', 'Madhavan Nallani', 'PhD', 'CEO', 'ACM Biolabs', 'contact@acmbiolabs.com', '+65 6265 5646', 'https://www.linkedin.com/in/madhavan-nallani', NULL, 'https://scholar.google.com',
 ARRAY['Polymer Chemistry', 'Drug Delivery', 'Nanoparticle Technology', 'Polymersomes', 'Artificial Cell Membranes'],
 'Founder, CEO, CSO, and Chairman of ACM Biolabs and ACM Biosciences. Developed core IP at IMRE (A*STAR), Radboud University, TU Eindhoven, and NTU. Attended 11th International mRNA Health Conference where he met Nobel laureate Katalin Kariko.',
 true),

-- Pierre Vandepapelière
('00000000-0000-0000-0001-000000000002', 'Pierre Vandepapelière', 'MD, PhD', 'CMO', 'ACM Biolabs', NULL, NULL, 'https://www.linkedin.com/in/pierre-vandepapelière-a295122a', NULL, NULL,
 ARRAY['Vaccine Development', 'Clinical Development', 'Immunotherapeutics', 'Global Clinical Operations', 'Vaccine Adjuvants'],
 'Chief Medical Officer with 30+ years pharma R&D expertise. Former Head of Early Clinical Research at GSK Biologicals. CEO of Imcyse (2014-2019, €35M Series B) and Amyl Therapeutics (2020-present).',
 true);

-- Board of Directors
INSERT INTO people (id, full_name, title, primary_role, entity_affiliation, expertise, bio, is_active) VALUES
('00000000-0000-0000-0001-000000000003', 'Erich Erber', NULL, 'Board Member', 'Board',
 ARRAY['Corporate Governance', 'Animal Nutrition', 'International Business', 'Venture Capital'],
 'Board Director and investor. Founded Erber Group (now DSM), established San Pacific Investments. Austrian Export Award, Ernst & Young Entrepreneur of the Year, Honorary Senator at Vienna universities.',
 true),

('00000000-0000-0000-0001-000000000004', 'Ong Sang Bin', NULL, 'Board Member', 'Board',
 ARRAY['Venture Capital', 'Technology Investment', 'Engineering', 'Business Strategy'],
 'Board member managing Ritz Venture Capital. 30+ years venture investment experience focused on early-stage technology companies.',
 true),

('00000000-0000-0000-0001-000000000005', 'David Lawrence', NULL, 'Board Member', 'Board',
 ARRAY['CFO', 'Life Sciences', 'M&A', 'Strategic Partnering', 'Investor Relations', 'NASDAQ IPO'],
 'Appointed April 2023. 30+ years life sciences leadership. Former CFO of Sensorion and Valneva. Led Management Board, Investor Relations, multiple financings including NASDAQ IPO at Valneva. Director at EnteroBiotix Limited.',
 true),

('00000000-0000-0000-0001-000000000006', 'Maria Halasz', 'BSc, MBA, GAICD', 'Board Member', 'Board',
 ARRAY['Biotech Commercialization', 'Corporate Finance', 'Venture Capital', 'CEO Leadership'],
 'Non-Executive Director. 15 years CEO/Managing Director of Cellmid Limited (ASX-listed). Founded Stride Equity (Australia first VC-backed equity crowdfunding platform). BSc Microbiology (UWA), MBA (UWA).',
 true);

-- ACM Biosciences Leadership
INSERT INTO people (id, full_name, title, primary_role, entity_affiliation, phone, linkedin_url, expertise, bio, is_active, end_date) VALUES
('00000000-0000-0000-0001-000000000007', 'Alexander Breidenbach', 'Dr., MBA', 'Former CBO', 'ACM Biosciences', '+41 61 975 85 88', 'https://ch.linkedin.com/in/dr-alexander-breidenbach-32a57a13',
 ARRAY['Business Development', 'Licensing', 'M&A', 'Strategic Partnerships', 'Neuroscience', 'Rare Disease'],
 'Chief Development Officer/Chief Business Officer (2020-2023), moved to Pharming Group N.V. (Sept 2023). Veterinary sciences doctorate (Hannover), Executive MBA (ESSEC/Mannheim). 20+ years Roche as VP Neuroscience/Ophthalmology/Rare Disease Partnering. Led 12 licensing deals and 2 M&As totaling $5B. Co-founded Argo Therapeutics.',
 false, '2023-09-01'),

('00000000-0000-0000-0001-000000000008', 'Katherine Schultheis', 'MSc', 'Head of Discovery Research', 'ACM Biosciences', NULL, NULL,
 ARRAY['DNA Vaccines', 'mRNA Delivery', 'Infectious Diseases', 'Oncology', 'Immunology', 'Biochemistry'],
 'Head of Discovery Research (joined 2022). Master Biochemistry (University of Potsdam, Germany). 10+ years at Inovio Pharmaceuticals (San Diego) leading DNA vaccine research. Co-author on multiple ACM publications including Biomacromolecules 2025 thermostability paper. Presented at 11th International mRNA Health Conference Berlin.',
 true, NULL);

-- Senior Scientific Staff (Singapore)
INSERT INTO people (id, full_name, title, primary_role, entity_affiliation, expertise, bio, is_active, orcid) VALUES
('00000000-0000-0000-0001-000000000009', 'Shaoqiong Liu', 'Dr.', 'Senior Scientist', 'ACM Biolabs',
 ARRAY['Biomedical Science', 'Bioengineering', 'Chemical Engineering', 'Nanoparticles'],
 'PhD Chemical & Biomolecular Engineering (NUS). 5 patents, 42 papers including Nature Communications and Advanced Materials. 15+ years biomedical science and bioengineering.',
 true, NULL),

('00000000-0000-0000-0001-000000000010', 'Jian Hang Lam', 'Dr.', 'Preclinical Scientist', 'ACM Biolabs',
 ARRAY['Virology', 'Immunology', 'Vaccine Development', 'Dengue', 'Preclinical Studies'],
 'PhD (Yong Loo Lin School of Medicine, NUS). Specializes in preclinical dengue vaccine development. Lead/co-author on multiple ACM publications. Presented thermostability data (Poster #P69) at ISV Annual Congress 2024.',
 true, '0000-0003-3378-350X'),

('00000000-0000-0000-0001-000000000011', 'Ser Yue Loo', 'Dr.', 'Senior Scientist', 'ACM Biolabs',
 ARRAY['Oncology', 'Triple Negative Breast Cancer', 'Therapeutics', 'Clinical Translation'],
 'PhD (NUS 2014). Postdoctoral research at Genome Institute of Singapore on triple negative breast cancer therapeutics. Successfully translated work to BEXMET clinical trial at National Cancer Centre Singapore.',
 true, NULL),

('00000000-0000-0000-0001-000000000012', 'Gaurav Sinsinbar', 'Dr.', 'Scientist', 'ACM Biolabs',
 ARRAY['Materials Science', 'Point-of-Care Diagnostics', 'Block Copolymer Nanoparticles'],
 'PhD Materials Science (NTU 2021). Specialized in point-of-care diagnostics. Co-author on 2024 Biomacromolecules perspective article on ABCP delivery platforms.',
 true, NULL),

('00000000-0000-0000-0001-000000000013', 'Yan Jun Lee', 'Dr.', 'Scientist', 'ACM Biolabs',
 ARRAY['Neuroscience', 'Molecular Biology', 'Drug Delivery'],
 'PhD (NTU 2021). NUS postdoctoral work in molecular and system neuroscience. Applies neuroscience expertise to drug delivery research.',
 true, NULL),

('00000000-0000-0000-0001-000000000014', 'Melvin', 'Dr.', 'Scientist', 'ACM Biolabs',
 ARRAY['Materials Science', 'Biomimetic Nanoparticles'],
 'PhD Materials Science (NTU 2023). Specializes in biomimetic nanoparticles.',
 true, NULL);

-- Research Staff
INSERT INTO people (id, full_name, title, primary_role, entity_affiliation, expertise, bio, is_active) VALUES
('00000000-0000-0000-0001-000000000015', 'Qiwei', NULL, 'Finance Manager', 'ACM Biolabs',
 ARRAY['Finance', 'Accounting', 'CPA'],
 'Finance/Accounting Manager. CPA Australia and Singapore Chartered Accountant.',
 true),

('00000000-0000-0000-0001-000000000016', 'Chia Teck Wan', 'BSc', 'Research Assistant', 'ACM Biolabs',
 ARRAY['Chemistry'],
 'BSc Chemistry (NTU 2019). Research assistant.',
 true),

('00000000-0000-0000-0001-000000000017', 'Eunice Chia Yoong Eng', 'BSc', 'Research Assistant', 'ACM Biolabs',
 ARRAY['Chemistry'],
 'BSc Chemistry (NTU 2021). Research assistant.',
 true),

('00000000-0000-0000-0001-000000000018', 'Jing Yi Fong', NULL, 'Research Assistant', 'ACM Biolabs',
 ARRAY['Research'],
 'Research assistant.',
 true),

('00000000-0000-0000-0001-000000000019', 'Salmah Humairoh Binte Zamri', 'BEng', 'Research Assistant', 'ACM Biolabs',
 ARRAY['Bioengineering'],
 'BEng Bioengineering (NTU 2024). Research assistant.',
 true),

('00000000-0000-0000-0001-000000000020', 'Wei Xiang Poh', 'BSc', 'Research Assistant', 'ACM Biolabs',
 ARRAY['Chemistry'],
 'BSc Chemistry (NTU 2021). Research assistant.',
 true);

-- Scientific Advisors
INSERT INTO people (id, full_name, title, primary_role, entity_affiliation, expertise, bio, is_active, orcid) VALUES
('00000000-0000-0000-0001-000000000021', 'Steve Pascolo', 'Dr., Professor', 'Scientific Advisor', 'External',
 ARRAY['mRNA Vaccines', 'Immunology', 'Vaccine Development', 'COVID-19'],
 'Professor, University of Zurich; Director, Department of Immunology, University Hospital Zurich. Global mRNA vaccine pioneer and CureVac co-founder. Key scientific collaborator, co-author on ACM publications. Leads Innosuisse-funded mRNA COVID-19 vaccine partnership.',
 true, NULL),

('00000000-0000-0000-0001-000000000022', 'Rocco Roberto Penna', NULL, 'Scientific Collaborator', 'External',
 ARRAY['Dermatology', 'mRNA Delivery'],
 'Department of Dermatology, University Hospital Zurich and Faculty of Science, University of Zurich. Collaborates on mRNA delivery research.',
 true, '0009-0007-9784-016X');

-- Education Records
INSERT INTO person_education (person_id, degree, field_of_study, institution, country) VALUES
-- Madhavan Nallani
('00000000-0000-0000-0001-000000000001', 'PhD', 'Polymer Chemistry', 'TU Eindhoven', 'Netherlands'),
('00000000-0000-0000-0001-000000000001', 'Studies', 'Science', 'Jacobs University Bremen', 'Germany'),

-- Pierre Vandepapelière
('00000000-0000-0000-0001-000000000002', 'MD', 'Medicine', 'Université catholique de Louvain', 'Belgium'),
('00000000-0000-0000-0001-000000000002', 'PhD', 'Medical Sciences', 'University of Gent', 'Belgium'),
('00000000-0000-0000-0001-000000000002', 'Degree', 'Tropical Medicine', 'Institute of Tropical Medicine, Antwerp', 'Belgium'),

-- Alexander Breidenbach
('00000000-0000-0000-0001-000000000007', 'Dr.', 'Veterinary Sciences', 'University of Hannover', 'Germany'),
('00000000-0000-0000-0001-000000000007', 'MBA', 'Business Administration', 'ESSEC/Mannheim', 'France/Germany'),

-- Katherine Schultheis
('00000000-0000-0000-0001-000000000008', 'MSc', 'Biochemistry', 'University of Potsdam', 'Germany'),

-- Shaoqiong Liu
('00000000-0000-0000-0001-000000000009', 'PhD', 'Chemical & Biomolecular Engineering', 'National University of Singapore', 'Singapore'),

-- Jian Hang Lam
('00000000-0000-0000-0001-000000000010', 'PhD', 'Medicine', 'Yong Loo Lin School of Medicine, NUS', 'Singapore'),

-- Ser Yue Loo
('00000000-0000-0000-0001-000000000011', 'PhD', 'Biomedical Science', 'National University of Singapore', 'Singapore'),

-- Gaurav Sinsinbar
('00000000-0000-0000-0001-000000000012', 'PhD', 'Materials Science', 'Nanyang Technological University', 'Singapore'),

-- Yan Jun Lee
('00000000-0000-0000-0001-000000000013', 'PhD', 'Neuroscience', 'Nanyang Technological University', 'Singapore'),

-- Melvin
('00000000-0000-0000-0001-000000000014', 'PhD', 'Materials Science', 'Nanyang Technological University', 'Singapore'),

-- Maria Halasz
('00000000-0000-0000-0001-000000000006', 'BSc', 'Microbiology', 'University of Western Australia', 'Australia'),
('00000000-0000-0000-0001-000000000006', 'MBA', 'Business Administration', 'University of Western Australia', 'Australia'),

-- Research Assistants
('00000000-0000-0000-0001-000000000016', 'BSc', 'Chemistry', 'Nanyang Technological University', 'Singapore'),
('00000000-0000-0000-0001-000000000017', 'BSc', 'Chemistry', 'Nanyang Technological University', 'Singapore'),
('00000000-0000-0000-0001-000000000019', 'BEng', 'Bioengineering', 'Nanyang Technological University', 'Singapore'),
('00000000-0000-0000-0001-000000000020', 'BSc', 'Chemistry', 'Nanyang Technological University', 'Singapore');

-- Person Roles (multiple roles per person)
INSERT INTO person_roles (person_id, role_type, role_title, organization, is_current) VALUES
-- Madhavan Nallani
('00000000-0000-0000-0001-000000000001', 'executive', 'CEO & Founder', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000001', 'executive', 'CSO', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000001', 'board', 'Chairman of the Board', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000001', 'executive', 'CEO', 'ACM Biosciences', true),

-- Pierre Vandepapelière
('00000000-0000-0000-0001-000000000002', 'executive', 'Chief Medical Officer', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000002', 'executive', 'CEO', 'Amyl Therapeutics', true),

-- Board Members
('00000000-0000-0000-0001-000000000003', 'board', 'Board Director', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000004', 'board', 'Board Director', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000005', 'board', 'Board Director', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000006', 'board', 'Non-Executive Director', 'ACM Biolabs', true),

-- ACM Biosciences
('00000000-0000-0000-0001-000000000007', 'executive', 'Chief Development Officer / Chief Business Officer', 'ACM Biosciences', false),
('00000000-0000-0000-0001-000000000008', 'scientist', 'Head of Discovery Research', 'ACM Biosciences', true),

-- Scientists
('00000000-0000-0000-0001-000000000009', 'scientist', 'Senior Scientist', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000010', 'scientist', 'Preclinical Scientist', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000011', 'scientist', 'Senior Scientist', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000012', 'scientist', 'Scientist', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000013', 'scientist', 'Scientist', 'ACM Biolabs', true),
('00000000-0000-0000-0001-000000000014', 'scientist', 'Scientist', 'ACM Biolabs', true),

-- Advisors
('00000000-0000-0000-0001-000000000021', 'advisor', 'Scientific Advisor', 'External', true),
('00000000-0000-0000-0001-000000000022', 'advisor', 'Scientific Collaborator', 'External', true);

-- ============================================
-- DOMAIN 2: TECHNOLOGY PLATFORMS
-- ============================================

INSERT INTO technologies (id, name, code, platform_type, description, technical_summary, development_status, storage_temperature_celsius, storage_duration, administration_routes, payload_types, origin_institution, origin_year) VALUES
-- ATP™ Platform
('00000000-0000-0000-0002-000000000001', 'ATP™ (ACM Tunable Platform)', 'ATP', 'Delivery Platform',
 'Polymer/lipid hybrid, non-viral delivery platform built on Artificial Cell Membrane (ACM) technology using amphiphilic block copolymer nanostructures.',
 'Core formulation combines polybutadiene-b-poly(ethylene glycol) (PBD-b-PEO) amphiphilic block copolymer with ionizable lipid, helper lipid, and cholesterol to produce Block Copolymer Nanoparticles (BNPs). Represents over 15 years of development.',
 'Clinical', '2-8°C', '>1 year at 4°C',
 ARRAY['intramuscular', 'intranasal', 'topical', 'oral'],
 ARRAY['mRNA', 'oligonucleotides', 'small molecules', 'proteins', 'polypeptides', 'carbohydrates', 'polynucleotides'],
 'A*STAR IMRE', 2009),

-- ACM (Artificial Cell Membranes)
('00000000-0000-0000-0002-000000000002', 'ACM (Artificial Cell Membranes)', 'ACM', 'Nanoparticle',
 'Customized synthetic cell membranes that mimic live, targeted membrane proteins using amphiphilic block copolymers forming nanoscale polymersomes.',
 'Synthetic vesicles with hydrophobic core and hydrophilic corona. Incorporate functional, folded membrane proteins into non-immunogenic polymersome carriers. Surface-conjugated antigens produce stronger humoral immune responses versus free antigens and elicit CD8+ T cell-mediated immunity.',
 'Clinical', NULL, NULL,
 ARRAY['intramuscular', 'intranasal'],
 ARRAY['proteins', 'antigens', 'mRNA'],
 'A*STAR IMRE', 2009),

-- BNP (Block Copolymer Nanoparticles)
('00000000-0000-0000-0002-000000000003', 'BNP (Block Copolymer Nanoparticles)', 'BNP', 'Nanoparticle',
 'Specific mRNA formulation combining PBD-b-PEO with lipid components.',
 'Published in Biomacromolecules (2025). Luciferase mRNA-BNPs stored >1 year at 4°C showed no degradation. Demonstrated comparable protective efficacy to Comirnaty biosimilar in hamster SARS-CoV-2 challenge studies, potently suppressing pulmonary viral loads.',
 'Clinical', '2-8°C', '>1 year at 4°C',
 ARRAY['intramuscular'],
 ARRAY['mRNA'],
 NULL, NULL),

-- ACM-CpG Platform
('00000000-0000-0000-0002-000000000004', 'ACM-CpG Platform', 'ACM-CpG', 'Adjuvant',
 'TLR9 agonist (CpG 7909) formulated using proprietary polymersome technology.',
 'Currently in Phase 1 clinical trials for oncology (NCT06587295). Fundamentally alters CpG mechanism of action, enabling myeloid modulation through comprehensive TLR9 engagement in immunologically "cold" tumors. First-in-human polymersome-CpG therapy with excellent safety profile.',
 'Clinical', NULL, NULL,
 ARRAY['intramuscular'],
 ARRAY['TLR9 agonist'],
 NULL, NULL);

-- Technology Specifications
INSERT INTO technology_specifications (technology_id, spec_category, spec_name, spec_value, spec_unit, evidence_source) VALUES
('00000000-0000-0000-0002-000000000001', 'composition', 'Block Copolymer', 'PBD-b-PEO', NULL, 'Biomacromolecules 2025, 26(4), 2444-2457'),
('00000000-0000-0000-0002-000000000001', 'composition', 'Ionizable Lipid', 'Yes', NULL, 'Biomacromolecules 2025'),
('00000000-0000-0000-0002-000000000001', 'composition', 'Helper Lipid', 'Yes', NULL, 'Biomacromolecules 2025'),
('00000000-0000-0000-0002-000000000001', 'composition', 'Cholesterol', 'Yes', NULL, 'Biomacromolecules 2025'),
('00000000-0000-0000-0002-000000000001', 'performance', 'Storage Stability', '>1 year', 'at 4°C', 'Biomacromolecules 2025'),
('00000000-0000-0000-0002-000000000001', 'performance', 'mRNA Integrity', 'Zero degradation', 'after 1 year', 'Biomacromolecules 2025'),
('00000000-0000-0000-0002-000000000001', 'performance', 'Immunogenicity Retention', '24 weeks', 'at 4°C', 'ACS Publications'),
('00000000-0000-0000-0002-000000000001', 'performance', 'Lymphoid Organ Affinity', 'Greater than LNPs', NULL, 'Biomacromolecules 2025'),
('00000000-0000-0000-0002-000000000001', 'performance', 'Memory CD8+ T Cell Duration', '5+ months', NULL, 'Patsnap Synapse'),
('00000000-0000-0000-0002-000000000001', 'performance', 'Anti-PEG Antibody Boosting', 'None with repeated doses', NULL, 'ACS Publications'),
('00000000-0000-0000-0002-000000000004', 'composition', 'Active Ingredient', 'CpG 7909', NULL, 'Clinical trial NCT06587295'),
('00000000-0000-0000-0002-000000000004', 'performance', 'Minimum Effective Dose', '0.25mg', NULL, 'PR Newswire Oct 2025'),
('00000000-0000-0000-0002-000000000004', 'performance', 'Disease Control Duration', '8 months', 'at 0.25mg dose', 'PR Newswire Oct 2025');

-- Technology Advantages
INSERT INTO technology_advantages (technology_id, advantage_category, advantage_title, advantage_description, comparison_baseline, priority_rank, evidence_strength) VALUES
('00000000-0000-0000-0002-000000000001', 'stability', 'Eliminates Ultra-Cold Storage', 'mRNA storage at 2-8°C for >1 year vs -60°C to -90°C for LNPs', 'vs LNPs', 1, 'clinical'),
('00000000-0000-0000-0002-000000000001', 'immunogenicity', 'Enhanced Lymphoid Organ Targeting', 'Greater affinity for secondary lymphoid organs than mRNA-LNPs with efficient macrophage/dendritic cell internalization', 'vs LNPs', 2, 'clinical'),
('00000000-0000-0000-0002-000000000001', 'safety', 'No Anti-PEG Antibody Issues', 'Anti-PEG antibodies not boosted by repeated administration, enabling superior multi-dose regimens', 'vs LNPs', 3, 'clinical'),
('00000000-0000-0000-0002-000000000001', 'manufacturing', 'Flexible Processing', 'More flexible manufacturing timelines compared to inflexible LNP processes', 'vs LNPs', 4, 'published'),
('00000000-0000-0000-0002-000000000001', 'cost', 'Cost-Effective Production', 'Simpler structure yields potentially cheaper production and easier quality control', 'vs LNPs', 5, 'published'),
('00000000-0000-0000-0002-000000000001', 'safety', 'No Vector Neutralizing Antibodies', 'Unlike viral vectors, no neutralizing antibodies develop', 'vs viral vectors', 6, 'published'),
('00000000-0000-0000-0002-000000000001', 'manufacturing', 'Quick Strain Adaptability', 'Rapid adaptation for new viral variants', 'vs conventional vaccines', 7, 'published'),
('00000000-0000-0000-0002-000000000004', 'immunogenicity', 'Myeloid Modulation in Cold Tumors', 'Fundamentally alters CpG mechanism enabling comprehensive TLR9 engagement in immunologically cold tumors', 'vs naked CpG', 1, 'clinical'),
('00000000-0000-0000-0002-000000000004', 'safety', 'Excellent Safety Profile', 'No dose-limiting toxicities observed; highly favorable tolerability', 'vs conventional TLR9 agonists', 2, 'clinical');

-- Technology Lineage
INSERT INTO technology_lineage (parent_technology_id, child_technology_id, relationship_type, description, transition_year) VALUES
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0002-000000000001', 'derived_from', 'ATP™ platform built on ACM technology foundation', 2013),
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000003', 'incorporates', 'BNP represents specific mRNA formulation using ATP™ platform', 2020),
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0002-000000000004', 'enables', 'ACM polymersome technology enables ACM-CpG formulation', 2020);

-- Person-Technology Contributions
INSERT INTO person_technology_contributions (person_id, technology_id, contribution_type, description) VALUES
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'Inventor', 'Developed ATP™ platform at IMRE, Radboud University, TU Eindhoven, and NTU'),
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000002', 'Inventor', 'Pioneered ACM technology at A*STAR IMRE'),
('00000000-0000-0000-0001-000000000021', '00000000-0000-0000-0002-000000000001', 'Developer', 'Scientific collaborator validating ATP™ platform through mRNA research'),
('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0002-000000000003', 'Researcher', 'Discovery research lead for BNP formulations'),
('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0002-000000000003', 'Researcher', 'Lead author on BNP thermostability publication');

-- TO BE CONTINUED IN NEXT FILE DUE TO LENGTH...
-- This file will continue with remaining domains in a follow-up response
