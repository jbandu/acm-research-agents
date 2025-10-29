-- Seed Competitor Data
-- Migration: 007_seed_competitors.sql

-- Insert Major Biotech & Pharma Competitors
INSERT INTO competitors (
  name, short_name, website_url,
  headquarters_city, headquarters_state, headquarters_country, latitude, longitude,
  company_type, ticker_symbol, founded_year,
  primary_focus, technology_platforms,
  threat_level, competitive_overlap_score, strategic_notes
) VALUES

-- Direct mRNA Competitors
(
  'Moderna, Inc.', 'Moderna', 'https://www.modernatx.com',
  'Cambridge', 'Massachusetts', 'United States', 42.3736, -71.1097,
  'public', 'MRNA', 2010,
  ARRAY['mRNA therapeutics', 'mRNA vaccines', 'cancer immunotherapy'],
  ARRAY['mRNA', 'lipid nanoparticles'],
  'critical', 95,
  'Direct competitor in mRNA space. Leader in mRNA vaccines, expanding into cancer immunotherapy. Strong partnership with Merck on personalized cancer vaccines.'
),

(
  'BioNTech SE', 'BioNTech', 'https://www.biontech.com',
  'Mainz', NULL, 'Germany', 49.9929, 8.2473,
  'public', 'BNTX', 2008,
  ARRAY['mRNA therapeutics', 'cancer immunotherapy', 'infectious diseases'],
  ARRAY['mRNA', 'CAR-T', 'TCR', 'antibodies'],
  'critical', 90,
  'Pioneer in mRNA cancer vaccines. Partnership with Pfizer on COVID vaccine. Strong oncology pipeline with multiple Phase 2 trials.'
),

(
  'CureVac N.V.', 'CureVac', 'https://www.curevac.com',
  'Tübingen', NULL, 'Germany', 48.5216, 9.0576,
  'public', 'CVAC', 2000,
  ARRAY['mRNA therapeutics', 'cancer vaccines', 'protein replacement'],
  ARRAY['mRNA', 'non-modified mRNA'],
  'high', 75,
  'Developing second-generation mRNA technology. Focus on unmodified mRNA. Partnerships with GSK and Bayer.'
),

(
  'Translate Bio (Sanofi)', 'Translate Bio', 'https://www.sanofi.com',
  'Lexington', 'Massachusetts', 'United States', 42.4473, -71.2245,
  'subsidiary', NULL, 2011,
  ARRAY['mRNA therapeutics', 'rare diseases', 'cystic fibrosis'],
  ARRAY['mRNA'],
  'medium', 60,
  'Acquired by Sanofi in 2021. Focus on rare diseases. Less direct overlap but watch for portfolio expansion.'
),

-- Big Pharma with Immuno-Oncology Focus
(
  'Pfizer Inc.', 'Pfizer', 'https://www.pfizer.com',
  'New York', 'New York', 'United States', 40.7128, -74.0060,
  'public', 'PFE', 1849,
  ARRAY['oncology', 'immunology', 'vaccines', 'rare diseases'],
  ARRAY['small molecules', 'biologics', 'mRNA'],
  'high', 70,
  'Partnership with BioNTech. Expanding into mRNA. Strong oncology pipeline. Acquired Seagen for ADC technology.'
),

(
  'Merck & Co.', 'Merck', 'https://www.merck.com',
  'Rahway', 'New Jersey', 'United States', 40.6082, -74.2779,
  'public', 'MRK', 1891,
  ARRAY['oncology', 'immunotherapy', 'vaccines'],
  ARRAY['antibodies', 'small molecules'],
  'high', 75,
  'Keytruda leader in checkpoint inhibitors. Partnership with Moderna on personalized cancer vaccines. Strong clinical trial network.'
),

(
  'Bristol Myers Squibb', 'BMS', 'https://www.bms.com',
  'New York', 'New York', 'United States', 40.7128, -74.0060,
  'public', 'BMY', 1887,
  ARRAY['oncology', 'immunology', 'cardiovascular'],
  ARRAY['antibodies', 'small molecules', 'CAR-T'],
  'medium', 65,
  'Opdivo/Yervoy combinations. Acquired Celgene with CAR-T portfolio. Strong immuno-oncology focus.'
),

(
  'Regeneron Pharmaceuticals', 'Regeneron', 'https://www.regeneron.com',
  'Tarrytown', 'New York', 'United States', 41.0762, -73.8588,
  'public', 'REGN', 1988,
  ARRAY['oncology', 'immunology', 'ophthalmology'],
  ARRAY['antibodies', 'gene therapy'],
  'high', 70,
  'Acquired Checkmate Pharma (TLR9 agonist). Strong antibody platform. Focus on combinations with checkpoint inhibitors.'
),

-- TLR Agonist Competitors (Direct overlap)
(
  'Dynavax Technologies', 'Dynavax', 'https://www.dynavax.com',
  'Emeryville', 'California', 'United States', 37.8314, -122.2856,
  'public', 'DVAX', 1996,
  ARRAY['immuno-oncology', 'vaccines'],
  ARRAY['TLR9 agonist', 'CpG oligonucleotides'],
  'critical', 85,
  'SD-101 (intratumoral TLR9 agonist) in Phase 2 with pembrolizumab. Direct competitive threat. Different delivery vs ACM.'
),

(
  'Checkmate Pharmaceuticals (Regeneron)', 'Checkmate', NULL,
  'Cambridge', 'Massachusetts', 'United States', 42.3736, -71.1097,
  'subsidiary', NULL, 2015,
  ARRAY['immuno-oncology'],
  ARRAY['TLR9 agonist', 'CpG-A'],
  'critical', 90,
  'CMP-001 intratumoral TLR9 agonist. Acquired by Regeneron 2023. Phase 2 melanoma trials. Key competitive benchmark.'
),

-- Other Immuno-Oncology Innovators
(
  'Iovance Biotherapeutics', 'Iovance', 'https://www.iovance.com',
  'San Carlos', 'California', 'United States', 37.5072, -122.2605,
  'public', 'IOVA', 2007,
  ARRAY['cell therapy', 'immuno-oncology'],
  ARRAY['TIL therapy'],
  'medium', 55,
  'Tumor-infiltrating lymphocyte (TIL) therapy. Different mechanism but targeting similar patient populations.'
),

(
  'Adaptimmune Therapeutics', 'Adaptimmune', 'https://www.adaptimmune.com',
  'Philadelphia', 'Pennsylvania', 'United States', 39.9526, -75.1652,
  'public', 'ADAP', 2008,
  ARRAY['cell therapy', 'immuno-oncology'],
  ARRAY['TCR therapy', 'SPEAR T-cells'],
  'medium', 50,
  'Engineered TCR T-cell therapy. Approved TECELRA for synovial sarcoma. Different approach but immuno-oncology space.'
),

-- Gene Therapy & Advanced Therapeutics
(
  'Beam Therapeutics', 'Beam', 'https://www.beamtx.com',
  'Cambridge', 'Massachusetts', 'United States', 42.3736, -71.1097,
  'public', 'BEAM', 2017,
  ARRAY['gene editing', 'base editing'],
  ARRAY['base editing', 'mRNA delivery'],
  'low', 30,
  'Base editing technology. mRNA delivery platform could be relevant. Watch for oncology expansion.'
),

(
  'Intellia Therapeutics', 'Intellia', 'https://www.intelliatx.com',
  'Cambridge', 'Massachusetts', 'United States', 42.3736, -71.1097,
  'public', 'NTLA', 2014,
  ARRAY['gene editing', 'CRISPR therapeutics'],
  ARRAY['CRISPR/Cas9', 'LNP delivery'],
  'low', 35,
  'In vivo CRISPR gene editing. LNP delivery expertise. Moving into oncology - monitor closely.'
),

-- International Players
(
  'Roche (Genentech)', 'Roche', 'https://www.roche.com',
  'Basel', NULL, 'Switzerland', 47.5596, 7.5886,
  'public', 'RHHBY', 1896,
  ARRAY['oncology', 'diagnostics', 'immunology'],
  ARRAY['antibodies', 'small molecules', 'ADCs'],
  'high', 65,
  'Global leader in oncology. Tecentriq checkpoint inhibitor. Strong diagnostics + therapeutics integration.'
),

(
  'Novartis AG', 'Novartis', 'https://www.novartis.com',
  'Basel', NULL, 'Switzerland', 47.5596, 7.5886,
  'public', 'NVS', 1996,
  ARRAY['oncology', 'immunology', 'gene therapy'],
  ARRAY['CAR-T', 'radioligand therapy', 'small molecules'],
  'medium', 55,
  'Kymriah CAR-T therapy. Strong radioligand therapy portfolio. Diverse oncology platform.'
),

(
  'AstraZeneca plc', 'AstraZeneca', 'https://www.astrazeneca.com',
  'Cambridge', NULL, 'United Kingdom', 52.2053, 0.1218,
  'public', 'AZN', 1999,
  ARRAY['oncology', 'immunology', 'rare diseases'],
  ARRAY['antibodies', 'ADCs', 'small molecules'],
  'medium', 60,
  'Imfinzi checkpoint inhibitor. Strong ADC pipeline. Global clinical trial network.'
),

-- Emerging Biotech
(
  'Gritstone bio', 'Gritstone', 'https://www.gritstonebio.com',
  'Emeryville', 'California', 'United States', 37.8314, -122.2856,
  'public', 'GRTS', 2015,
  ARRAY['personalized cancer vaccines', 'immunotherapy'],
  ARRAY['neoantigen vaccines', 'viral vectors'],
  'high', 80,
  'Personalized neoantigen vaccines. Partnerships with major pharma. Direct competition in cancer vaccine space.'
),

(
  'Genocea Biosciences', 'Genocea', 'https://www.genocea.com',
  'Cambridge', 'Massachusetts', 'United States', 42.3736, -71.1097,
  'public', 'GNCA', 2006,
  ARRAY['cancer immunotherapy', 'neoantigen vaccines'],
  ARRAY['ATLAS platform', 'peptide vaccines'],
  'medium', 70,
  'Personalized neoantigen cancer vaccines. GEN-009 in Phase 2. Different platform but similar therapeutic goal.'
),

(
  'Agenus Inc.', 'Agenus', 'https://www.agenusbio.com',
  'Lexington', 'Massachusetts', 'United States', 42.4473, -71.2245,
  'public', 'AGEN', 1994,
  ARRAY['cancer immunotherapy', 'vaccines', 'antibodies'],
  ARRAY['heat shock protein', 'checkpoint modulators'],
  'medium', 55,
  'Diversified immuno-oncology portfolio. Botensilimab (CTLA-4) showing promise. Multiple combination trials.'
)

ON CONFLICT (name) DO NOTHING;

-- Add some sample clinical trials for key competitors
INSERT INTO competitor_trials (
  competitor_id, nct_id, trial_title, phase, status,
  indication, intervention, start_date, relevance_score, competitive_notes
)
SELECT
  c.id,
  'NCT05933577',
  'mRNA-4157 Plus Pembrolizumab vs Pembrolizumab Alone in Melanoma (KEYNOTE-942)',
  'Phase 3',
  'Active, not recruiting',
  'Resected High-Risk Melanoma',
  'mRNA-4157 (personalized cancer vaccine) + Pembrolizumab',
  '2023-03-01',
  95,
  'Direct competition - personalized mRNA cancer vaccine. Positive Phase 2b results. Merck partnership.'
FROM competitors c
WHERE c.short_name = 'Moderna'

UNION ALL

SELECT
  c.id,
  'NCT04526899',
  'BNT111 With Cemiplimab in Anti-PD1-refractory/relapsed Melanoma',
  'Phase 2',
  'Active, not recruiting',
  'Advanced Melanoma',
  'BNT111 (FixVac) + Cemiplimab',
  '2020-11-01',
  90,
  'Fixed neoantigen mRNA vaccine. Combination with checkpoint inhibitor. Off-the-shelf approach.'
FROM competitors c
WHERE c.short_name = 'BioNTech'

UNION ALL

SELECT
  c.id,
  'NCT03831295',
  'SD-101 With Pembrolizumab in Melanoma (SYNERGY-001)',
  'Phase 2',
  'Active, not recruiting',
  'Metastatic Melanoma',
  'SD-101 (TLR9 agonist) + Pembrolizumab',
  '2019-03-01',
  90,
  'CRITICAL: Direct TLR9 competitor. Intratumoral injection. Key differentiation: ACM is IM vs intratumoral.'
FROM competitors c
WHERE c.short_name = 'Dynavax'

ON CONFLICT (nct_id) DO NOTHING;

-- Add newsletter subscriptions for testing (you'll replace with real employee data)
INSERT INTO newsletter_subscriptions (email, name, department, is_active)
VALUES
  ('leadership@acmbiolabs.com', 'Leadership Team', 'Executive', true),
  ('research@acmbiolabs.com', 'Research Team', 'R&D', true),
  ('clinical@acmbiolabs.com', 'Clinical Team', 'Clinical Development', true),
  ('bd@acmbiolabs.com', 'Business Development', 'BD & Strategy', true)
ON CONFLICT (email) DO NOTHING;
