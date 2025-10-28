-- ============================================
-- ACM Biolabs Knowledge Graph - EXAMPLE QUERIES
-- Demonstrating Complex Relationship Queries
-- ============================================

-- ============================================
-- 1. TECHNOLOGY LINEAGE & PROGRAM RELATIONSHIPS
-- ============================================

-- Q1: Show complete technology evolution from A*STAR IMRE to current programs
SELECT
  tt.generation,
  tt.lineage_path,
  t.name as technology_name,
  t.code,
  t.origin_institution,
  t.origin_year,
  t.development_status,
  COUNT(DISTINCT pt.program_id) as programs_using_tech
FROM vw_technology_evolution tt
INNER JOIN technologies t ON tt.id = t.id
LEFT JOIN program_technologies pt ON t.id = pt.technology_id
GROUP BY tt.generation, tt.lineage_path, t.name, t.code, t.origin_institution, t.origin_year, t.development_status
ORDER BY tt.generation, t.name;

-- Q2: All programs using ATP™ with their clinical status and results
SELECT * FROM vw_atp_programs;

-- Q3: Programs by development stage with technology details
SELECT
  rp.development_stage,
  rp.therapeutic_area,
  rp.program_code,
  rp.program_name,
  rp.indication,
  string_agg(DISTINCT t.name, ', ' ORDER BY t.name) as technologies_used,
  ct.nct_id,
  ct.status as trial_status,
  tr.result_type,
  tr.announcement_date as last_result_date
FROM research_programs rp
LEFT JOIN program_technologies pt ON rp.id = pt.program_id
LEFT JOIN technologies t ON pt.technology_id = t.id
LEFT JOIN clinical_trials ct ON rp.id = ct.program_id
LEFT JOIN trial_results tr ON ct.id = tr.trial_id
GROUP BY rp.id, rp.development_stage, rp.therapeutic_area, rp.program_code, rp.program_name,
         rp.indication, ct.nct_id, ct.status, tr.result_type, tr.announcement_date
ORDER BY
  CASE rp.development_stage
    WHEN 'Phase 2' THEN 1
    WHEN 'Phase 1 Ongoing' THEN 2
    WHEN 'Phase 1 Completed' THEN 3
    WHEN 'IND-Enabling' THEN 4
    WHEN 'Preclinical' THEN 5
    WHEN 'Discovery' THEN 6
  END,
  rp.program_code;

-- ============================================
-- 2. FUNDING TIMELINE & INVESTOR NETWORK
-- ============================================

-- Q4: Complete funding history with investors and cumulative total
WITH funding_history AS (
  SELECT
    fr.close_date,
    fr.round_type,
    fr.amount_usd,
    i.investor_name as lead,
    string_agg(DISTINCT i2.investor_name, ', ' ORDER BY i2.investor_name) as all_investors
  FROM funding_rounds fr
  LEFT JOIN investors i ON fr.lead_investor_id = i.id
  LEFT JOIN investor_funding_rounds ifr ON fr.id = ifr.funding_round_id
  LEFT JOIN investors i2 ON ifr.investor_id = i2.id
  GROUP BY fr.id, fr.close_date, fr.round_type, fr.amount_usd, i.investor_name
)
SELECT
  close_date,
  round_type,
  amount_usd,
  lead,
  all_investors,
  SUM(COALESCE(amount_usd, 0)) OVER (ORDER BY close_date) as cumulative_funding_usd
FROM funding_history
ORDER BY close_date;

-- Q5: Investor portfolio analysis - which investors participated in multiple rounds?
SELECT
  i.investor_name,
  i.investor_type,
  i.country,
  COUNT(DISTINCT ifr.funding_round_id) as rounds_participated,
  string_agg(DISTINCT fr.round_type, ', ' ORDER BY fr.round_type) as round_types,
  MIN(fr.close_date) as first_investment,
  MAX(fr.close_date) as latest_investment
FROM investors i
INNER JOIN investor_funding_rounds ifr ON i.id = ifr.investor_id
INNER JOIN funding_rounds fr ON ifr.funding_round_id = fr.id
GROUP BY i.id, i.investor_name, i.investor_type, i.country
HAVING COUNT(DISTINCT ifr.funding_round_id) > 0
ORDER BY rounds_participated DESC, first_investment;

-- Q6: Grants by program showing total non-dilutive funding
SELECT
  rp.program_code,
  rp.program_name,
  rp.therapeutic_area,
  COUNT(g.id) as grant_count,
  string_agg(DISTINCT g.grantor_organization, '; ' ORDER BY g.grantor_organization) as grantors,
  SUM(COALESCE(g.amount_usd, 0)) as total_grant_funding_usd,
  string_agg(g.amount_description, '; ') as amounts_description
FROM research_programs rp
INNER JOIN grants g ON rp.id = g.program_id
GROUP BY rp.id, rp.program_code, rp.program_name, rp.therapeutic_area
ORDER BY total_grant_funding_usd DESC NULLS LAST;

-- ============================================
-- 3. PUBLICATION NETWORK & CO-AUTHORSHIP
-- ============================================

-- Q7: Publication network with author counts and program validation
SELECT * FROM vw_publication_network;

-- Q8: Most prolific authors ranked by publication count
SELECT
  p.full_name,
  p.primary_role,
  p.entity_affiliation,
  COUNT(DISTINCT pa.publication_id) as publication_count,
  COUNT(DISTINCT CASE WHEN pa.author_position = 1 THEN pa.publication_id END) as first_author_count,
  COUNT(DISTINCT CASE WHEN pa.is_corresponding THEN pa.publication_id END) as corresponding_author_count,
  string_agg(DISTINCT pub.journal_or_venue, '; ' ORDER BY pub.journal_or_venue) as journals
FROM people p
INNER JOIN publication_authors pa ON p.id = pa.person_id
INNER JOIN publications pub ON pa.publication_id = pub.id
GROUP BY p.id, p.full_name, p.primary_role, p.entity_affiliation
ORDER BY publication_count DESC, first_author_count DESC;

-- Q9: Co-authorship matrix - who collaborates with whom?
SELECT
  p1.full_name as author_1,
  p2.full_name as author_2,
  COUNT(DISTINCT pa1.publication_id) as co_authored_papers,
  string_agg(DISTINCT pub.title, '; ' ORDER BY pub.publication_date DESC) as paper_titles
FROM publication_authors pa1
INNER JOIN publication_authors pa2 ON pa1.publication_id = pa2.publication_id AND pa1.person_id < pa2.person_id
INNER JOIN people p1 ON pa1.person_id = p1.id
INNER JOIN people p2 ON pa2.person_id = p2.id
INNER JOIN publications pub ON pa1.publication_id = pub.id
GROUP BY p1.id, p1.full_name, p2.id, p2.full_name
HAVING COUNT(DISTINCT pa1.publication_id) > 0
ORDER BY co_authored_papers DESC, author_1, author_2;

-- Q10: Publications validating specific programs
SELECT
  pub.title,
  pub.pub_type,
  pub.journal_or_venue,
  pub.publication_date,
  pub.doi,
  rp.program_code,
  rp.program_name,
  pp.relationship_type,
  string_agg(DISTINCT p.full_name, ', ' ORDER BY pa.author_position) as authors
FROM publications pub
INNER JOIN publication_programs pp ON pub.id = pp.publication_id
INNER JOIN research_programs rp ON pp.program_id = rp.id
LEFT JOIN publication_authors pa ON pub.id = pa.publication_id
LEFT JOIN people p ON pa.person_id = p.id
GROUP BY pub.id, pub.title, pub.pub_type, pub.journal_or_venue, pub.publication_date,
         pub.doi, rp.program_code, rp.program_name, pp.relationship_type
ORDER BY pub.publication_date DESC, rp.program_code;

-- ============================================
-- 4. PARTNERSHIP IMPACT ANALYSIS
-- ============================================

-- Q11: Partnership impact on program development
SELECT * FROM vw_partnership_impact
ORDER BY funding_amount DESC NULLS LAST, partner_name;

-- Q12: Geographic distribution of partnerships
SELECT
  p.partner_country,
  COUNT(DISTINCT p.id) as partnership_count,
  COUNT(DISTINCT pp.program_id) as programs_enabled,
  SUM(p.funding_amount) as total_funding_usd,
  string_agg(DISTINCT p.partner_name, '; ' ORDER BY p.partner_name) as partners
FROM partnerships p
LEFT JOIN partnership_programs pp ON p.id = pp.partnership_id
GROUP BY p.partner_country
ORDER BY partnership_count DESC, total_funding_usd DESC NULLS LAST;

-- Q13: Partnership timeline with program milestones
SELECT
  p.announcement_date,
  p.partner_name,
  p.partner_type,
  p.partnership_type,
  p.funding_amount,
  rp.program_code,
  rp.program_name,
  rp.development_stage,
  m.title as related_milestone,
  m.milestone_date
FROM partnerships p
LEFT JOIN partnership_programs pp ON p.id = pp.partnership_id
LEFT JOIN research_programs rp ON pp.program_id = rp.id
LEFT JOIN milestones m ON p.id = m.partnership_id
ORDER BY p.announcement_date DESC;

-- ============================================
-- 5. CLINICAL TRIAL PROGRESS & RESULTS
-- ============================================

-- Q14: Clinical trials with detailed progress
SELECT * FROM vw_clinical_trials_progress;

-- Q15: Trial results timeline with investigator information
SELECT
  ct.nct_id,
  ct.trial_title,
  ct.phase,
  rp.program_code,
  tr.result_type,
  tr.announcement_date,
  tr.no_serious_adverse_events,
  tr.safety_summary,
  tr.efficacy_summary,
  string_agg(DISTINCT p.full_name, ', ' ORDER BY p.full_name) as investigators
FROM clinical_trials ct
INNER JOIN research_programs rp ON ct.program_id = rp.id
LEFT JOIN trial_results tr ON ct.id = tr.trial_id
LEFT JOIN trial_investigators ti ON ct.id = ti.trial_id
LEFT JOIN people p ON ti.person_id = p.id
GROUP BY ct.id, ct.nct_id, ct.trial_title, ct.phase, rp.program_code,
         tr.result_type, tr.announcement_date, tr.no_serious_adverse_events,
         tr.safety_summary, tr.efficacy_summary
ORDER BY tr.announcement_date DESC NULLS LAST;

-- ============================================
-- 6. PATENT PORTFOLIO & IP PROTECTION
-- ============================================

-- Q16: Complete patent portfolio with inventors and protected technologies
SELECT * FROM vw_patent_portfolio
ORDER BY filing_date DESC;

-- Q17: Patent coverage by technology platform
SELECT
  t.name as technology_name,
  t.code,
  COUNT(DISTINCT pt.patent_id) as patents_protecting,
  string_agg(DISTINCT pat.patent_number, ', ' ORDER BY pat.filing_date DESC) as patent_numbers,
  string_agg(DISTINCT pat.jurisdiction, ', ') as jurisdictions
FROM technologies t
LEFT JOIN patent_technologies pt ON t.id = pt.technology_id
LEFT JOIN patents pat ON pt.patent_id = pat.id
GROUP BY t.id, t.name, t.code
ORDER BY patents_protecting DESC NULLS LAST;

-- Q18: Patent family analysis - same invention in multiple jurisdictions
SELECT
  p.patent_number as primary_patent,
  p.patent_title,
  p.filing_date,
  COUNT(DISTINCT pj.jurisdiction_code) as jurisdiction_count,
  string_agg(DISTINCT pj.jurisdiction_code, ', ' ORDER BY pj.jurisdiction_code) as all_jurisdictions,
  string_agg(DISTINCT pj.application_number, '; ') as application_numbers
FROM patents p
LEFT JOIN patent_jurisdictions pj ON p.id = pj.patent_id
GROUP BY p.id, p.patent_number, p.patent_title, p.filing_date
ORDER BY jurisdiction_count DESC, filing_date DESC;

-- ============================================
-- 7. ORGANIZATIONAL STRUCTURE & GLOBAL FOOTPRINT
-- ============================================

-- Q19: Corporate structure with location details
SELECT
  le.entity_name,
  le.entity_type,
  le.entity_legal_structure,
  le.incorporation_country,
  el.location_type,
  el.city,
  el.country,
  el.phone,
  el.email,
  er.relationship_type,
  parent.entity_name as parent_company
FROM legal_entities le
LEFT JOIN entity_locations el ON le.id = el.entity_id AND el.is_primary = true
LEFT JOIN entity_relationships er ON le.id = er.child_entity_id
LEFT JOIN legal_entities parent ON er.parent_entity_id = parent.id
ORDER BY
  CASE le.entity_type
    WHEN 'Parent Company' THEN 1
    WHEN 'Subsidiary' THEN 2
    ELSE 3
  END,
  le.entity_name;

-- Q20: Geographic presence - countries with presence
SELECT
  el.country,
  COUNT(DISTINCT le.id) as entities,
  COUNT(DISTINCT el.id) as locations,
  string_agg(DISTINCT le.entity_name, '; ' ORDER BY le.entity_name) as entity_names,
  string_agg(DISTINCT el.location_type, ', ') as location_types
FROM legal_entities le
INNER JOIN entity_locations el ON le.id = el.entity_id
WHERE le.is_active = true
GROUP BY el.country
ORDER BY entities DESC, country;

-- ============================================
-- 8. PEOPLE & EXPERTISE NETWORK
-- ============================================

-- Q21: Leadership team with complete background
SELECT
  p.full_name,
  p.title,
  string_agg(DISTINCT pr.role_title, ' | ' ORDER BY pr.is_current DESC, pr.role_title) as all_roles,
  string_agg(DISTINCT pe.degree || ' ' || pe.field_of_study || ' (' || pe.institution || ')',
             '; ' ORDER BY pe.end_year DESC NULLS LAST) as education,
  p.expertise,
  p.linkedin_url,
  p.orcid
FROM people p
INNER JOIN person_roles pr ON p.id = pr.person_id
LEFT JOIN person_education pe ON p.id = pe.person_id
WHERE p.primary_role IN ('CEO', 'CMO', 'Board Member', 'Former CBO', 'Head of Discovery Research')
GROUP BY p.id, p.full_name, p.title, p.expertise, p.linkedin_url, p.orcid
ORDER BY
  CASE p.primary_role
    WHEN 'CEO' THEN 1
    WHEN 'CMO' THEN 2
    WHEN 'Former CBO' THEN 3
    WHEN 'Head of Discovery Research' THEN 4
    WHEN 'Board Member' THEN 5
  END,
  p.full_name;

-- Q22: Scientific team expertise map
SELECT
  p.primary_role,
  COUNT(DISTINCT p.id) as person_count,
  array_agg(DISTINCT unnest(p.expertise)) as all_expertise_areas,
  string_agg(DISTINCT p.full_name, ', ' ORDER BY p.full_name) as team_members
FROM people p
WHERE p.primary_role IN ('Senior Scientist', 'Preclinical Scientist', 'Scientist', 'Research Assistant')
  AND p.is_active = true
GROUP BY p.primary_role
ORDER BY
  CASE p.primary_role
    WHEN 'Senior Scientist' THEN 1
    WHEN 'Preclinical Scientist' THEN 2
    WHEN 'Scientist' THEN 3
    WHEN 'Research Assistant' THEN 4
  END;

-- Q23: People contributing to technology development
SELECT
  p.full_name,
  p.primary_role,
  t.name as technology,
  ptc.contribution_type,
  ptc.description,
  COUNT(DISTINCT pub.id) as related_publications
FROM people p
INNER JOIN person_technology_contributions ptc ON p.id = ptc.person_id
INNER JOIN technologies t ON ptc.technology_id = t.id
LEFT JOIN publication_authors pa ON p.id = pa.person_id
LEFT JOIN publications pub ON pa.publication_id = pub.id
GROUP BY p.id, p.full_name, p.primary_role, t.name, ptc.contribution_type, ptc.description
ORDER BY p.full_name, t.name;

-- ============================================
-- 9. MILESTONE TIMELINE & COMPANY EVOLUTION
-- ============================================

-- Q24: Complete milestone timeline with related entities
SELECT * FROM vw_milestones_timeline;

-- Q25: Milestones by category showing company progress
SELECT
  m.milestone_category,
  COUNT(*) as milestone_count,
  MIN(m.milestone_date) as first_milestone,
  MAX(m.milestone_date) as latest_milestone,
  string_agg(m.title, chr(10) ORDER BY m.milestone_date) as all_milestones
FROM milestones m
GROUP BY m.milestone_category
ORDER BY first_milestone;

-- Q26: Year-by-year company activity
SELECT
  EXTRACT(YEAR FROM m.milestone_date) as year,
  COUNT(*) as total_milestones,
  COUNT(DISTINCT m.milestone_category) as categories,
  string_agg(DISTINCT m.milestone_category, ', ' ORDER BY m.milestone_category) as milestone_types,
  string_agg(m.title, '; ' ORDER BY m.milestone_date) as milestone_titles
FROM milestones m
GROUP BY EXTRACT(YEAR FROM m.milestone_date)
ORDER BY year;

-- ============================================
-- 10. COMPLEX MULTI-DOMAIN QUERIES
-- ============================================

-- Q27: Program readiness assessment - show all dimensions
SELECT
  rp.program_code,
  rp.program_name,
  rp.therapeutic_area,
  rp.development_stage,
  rp.priority_level,

  -- Technology readiness
  string_agg(DISTINCT t.name, ', ' ORDER BY t.name) as technologies,
  string_agg(DISTINCT t.development_status, ', ') as tech_status,

  -- Clinical progress
  ct.nct_id,
  ct.status as trial_status,
  tr.result_type as latest_result,

  -- Partnership support
  COUNT(DISTINCT p.id) as partnership_count,
  SUM(p.funding_amount) as partnership_funding_usd,

  -- Publication evidence
  COUNT(DISTINCT pub.id) as supporting_publications,

  -- Patent protection
  COUNT(DISTINCT pat.id) as related_patents,

  -- Milestones achieved
  COUNT(DISTINCT m.id) as milestone_count

FROM research_programs rp
LEFT JOIN program_technologies pt ON rp.id = pt.program_id
LEFT JOIN technologies t ON pt.technology_id = t.id
LEFT JOIN clinical_trials ct ON rp.id = ct.program_id
LEFT JOIN trial_results tr ON ct.id = tr.trial_id
LEFT JOIN partnership_programs pp ON rp.id = pp.program_id
LEFT JOIN partnerships p ON pp.partnership_id = p.id
LEFT JOIN publication_programs pubprog ON rp.id = pubprog.program_id
LEFT JOIN publications pub ON pubprog.publication_id = pub.id
LEFT JOIN patent_technologies ptech ON t.id = ptech.technology_id
LEFT JOIN patents pat ON ptech.patent_id = pat.id
LEFT JOIN milestones m ON rp.id = m.program_id
GROUP BY rp.id, rp.program_code, rp.program_name, rp.therapeutic_area, rp.development_stage,
         rp.priority_level, ct.nct_id, ct.status, tr.result_type
ORDER BY
  CASE rp.priority_level
    WHEN 'High' THEN 1
    WHEN 'Medium' THEN 2
    WHEN 'Low' THEN 3
  END,
  CASE rp.development_stage
    WHEN 'Phase 2' THEN 1
    WHEN 'Phase 1 Ongoing' THEN 2
    WHEN 'Phase 1 Completed' THEN 3
    WHEN 'IND-Enabling' THEN 4
    WHEN 'Preclinical' THEN 5
    WHEN 'Discovery' THEN 6
  END;

-- Q28: Technology validation trail - from invention to clinical proof
SELECT
  t.name as technology,
  t.code,
  t.origin_institution,
  t.origin_year,

  -- Patent protection
  COUNT(DISTINCT pat.id) as patents,
  string_agg(DISTINCT pat.patent_number, ', ' ORDER BY pat.filing_date) as patent_numbers,

  -- Scientific publications
  COUNT(DISTINCT pub.id) as publications,
  string_agg(DISTINCT pub.journal_or_venue, ', ') as journals,

  -- Programs using it
  COUNT(DISTINCT rp.id) as programs,
  string_agg(DISTINCT rp.program_code, ', ' ORDER BY rp.development_stage) as program_codes,

  -- Clinical validation
  COUNT(DISTINCT ct.id) as clinical_trials,
  string_agg(DISTINCT ct.nct_id, ', ') as nct_ids,
  MAX(tr.announcement_date) as latest_clinical_result

FROM technologies t
LEFT JOIN patent_technologies ptech ON t.id = ptech.technology_id
LEFT JOIN patents pat ON ptech.patent_id = pat.id
LEFT JOIN program_technologies pt ON t.id = pt.technology_id
LEFT JOIN research_programs rp ON pt.program_id = rp.id
LEFT JOIN clinical_trials ct ON rp.id = ct.program_id
LEFT JOIN trial_results tr ON ct.id = tr.trial_id
LEFT JOIN publication_programs pubprog ON rp.id = pubprog.program_id
LEFT JOIN publications pub ON pubprog.publication_id = pub.id
GROUP BY t.id, t.name, t.code, t.origin_institution, t.origin_year
ORDER BY t.origin_year, t.name;

-- Q29: Investment ROI indicators - correlate funding with progress
SELECT
  EXTRACT(YEAR FROM fr.close_date) as funding_year,
  fr.round_type,
  fr.amount_usd,
  i.investor_name as lead_investor,

  -- Progress metrics in following year
  (SELECT COUNT(*) FROM milestones m WHERE m.milestone_category = 'Clinical'
   AND EXTRACT(YEAR FROM m.milestone_date) = EXTRACT(YEAR FROM fr.close_date) + 1) as clinical_milestones_next_year,

  (SELECT COUNT(*) FROM publications pub WHERE pub.pub_type = 'Peer-Reviewed'
   AND EXTRACT(YEAR FROM pub.publication_date) = EXTRACT(YEAR FROM fr.close_date) + 1) as publications_next_year,

  (SELECT COUNT(*) FROM partnerships p WHERE EXTRACT(YEAR FROM p.start_date) = EXTRACT(YEAR FROM fr.close_date) + 1) as partnerships_next_year

FROM funding_rounds fr
LEFT JOIN investors i ON fr.lead_investor_id = i.id
WHERE fr.amount_usd IS NOT NULL
ORDER BY fr.close_date;

-- Q30: Complete company overview dashboard
SELECT
  'Total Funding Raised (USD)' as metric,
  TO_CHAR(SUM(COALESCE(fr.amount_usd, 0)), 'FM$999,999,999') as value
FROM funding_rounds fr

UNION ALL

SELECT 'Grant Funding (USD)',
  TO_CHAR(SUM(COALESCE(g.amount_usd, 0)), 'FM$999,999,999')
FROM grants g

UNION ALL

SELECT 'Active Programs', COUNT(*)::text
FROM research_programs WHERE is_active = true

UNION ALL

SELECT 'Clinical Trials', COUNT(*)::text
FROM clinical_trials

UNION ALL

SELECT 'Patents Filed', COUNT(*)::text
FROM patents

UNION ALL

SELECT 'Peer-Reviewed Publications', COUNT(*)::text
FROM publications WHERE pub_type = 'Peer-Reviewed'

UNION ALL

SELECT 'Strategic Partnerships', COUNT(*)::text
FROM partnerships WHERE status = 'Active'

UNION ALL

SELECT 'Technology Platforms', COUNT(*)::text
FROM technologies

UNION ALL

SELECT 'Team Members', COUNT(*)::text
FROM people WHERE is_active = true

UNION ALL

SELECT 'Countries with Presence', COUNT(DISTINCT el.country)::text
FROM entity_locations el
INNER JOIN legal_entities le ON el.entity_id = le.id
WHERE le.is_active = true;
