# ACM Biolabs Comprehensive Knowledge Graph - Migration Guide

## Overview

This migration creates a **complete 10-domain knowledge graph** for ACM Biolabs with:
- **42 core tables** + **15+ junction tables** = **57 total tables**
- **22 people** (executives, scientists, board, staff)
- **4 technology platforms** (ATP™, ACM, BNP, ACM-CpG)
- **8 research programs** (infectious diseases, oncology, ophthalmology)
- **2 clinical trials** (NCT05385991, NCT06587295)
- **15 publications** (peer-reviewed, conferences, press releases)
- **4 strategic partnerships** (CEPI, DIOSynVax, NCCS, UH Zurich)
- **6 investors**, **6 funding rounds** ($26M total), **4 grants**
- **3 legal entities** (Singapore HQ, Basel, Sydney)
- **6 patents** protecting platform technologies
- **15 key milestones** (2013-2025 timeline)

---

## Files Included

```
db/migrations/
├── 005_acm_comprehensive_knowledge_graph.sql    # DDL: Schema, tables, indexes, views, constraints
├── 005_seed_data.sql                            # DML Part 1: People (22) + Technologies (4)
├── 005_seed_data_part2.sql                      # DML Part 2: Programs, Trials, Publications, Partnerships
├── 005_seed_data_part3.sql                      # DML Part 3: Financial, Organization, Patents, Milestones
├── 005_example_queries.sql                      # 30 example queries demonstrating relationships
├── 005_ER_DIAGRAM_DESCRIPTION.md                # Complete ER diagram documentation
└── 005_README.md                                # This file
```

---

## Installation Instructions

### Prerequisites

1. **Database**: Neon PostgreSQL (or any PostgreSQL 12+)
2. **Existing tables**: You should already have these from previous migrations:
   - `workflows`, `queries`, `llm_responses`, `human_decisions`
   - `acm_knowledge_base`, `acm_domains`, `acm_nodes`, `acm_relationships` (from migration 003)
   - `data_sources`, `workflow_data_sources`, `query_cost_estimates` (from migration 004)

3. **Required function**: `update_updated_at_column()` should exist (created in schema.sql)

### Step 1: Run the DDL (Schema Creation)

Execute in **Neon SQL Editor**:

```sql
-- Copy and paste the entire contents of:
-- 005_acm_comprehensive_knowledge_graph.sql
```

This creates:
- 42 core tables (people, technologies, programs, trials, publications, partnerships, financial, organization, patents, milestones)
- 15+ junction tables (connecting relationships)
- 60+ indexes for performance
- 7 views for common queries
- Constraints and triggers

**Expected output**: `CREATE TABLE` statements succeed, ending with `COMMENT ON TABLE` statements.

### Step 2: Run Seed Data Part 1 (People & Technologies)

Execute in **Neon SQL Editor**:

```sql
-- Copy and paste the entire contents of:
-- 005_seed_data.sql
```

This inserts:
- 22 people with education, roles, and technology contributions
- 4 technology platforms with specifications and advantages
- Technology lineage relationships

**Expected output**: `INSERT 0 X` for each INSERT statement.

### Step 3: Run Seed Data Part 2 (Programs, Trials, Publications, Partnerships)

Execute in **Neon SQL Editor**:

```sql
-- Copy and paste the entire contents of:
-- 005_seed_data_part2.sql
```

This inserts:
- 8 research programs with technology links
- 2 clinical trials with sites, investigators, results
- 7+ publications with author networks
- 4 partnerships with program links

**Expected output**: More `INSERT 0 X` statements.

### Step 4: Run Seed Data Part 3 (Financial, Organization, Patents, Milestones)

Execute in **Neon SQL Editor**:

```sql
-- Copy and paste the entire contents of:
-- 005_seed_data_part3.sql
```

This inserts:
- 6 investors, 6 funding rounds, 4 grants
- 3 legal entities with locations and relationships
- 6 patents with inventors, claims, technologies
- 15 milestones from 2013-2025

**Expected output**: Final `INSERT` statements + summary statistics query.

### Step 5: Verify Installation

Run the summary query at the end of Part 3:

```sql
SELECT 'People' as domain, COUNT(*) as count FROM people
UNION ALL
SELECT 'Education Records', COUNT(*) FROM person_education
UNION ALL
SELECT 'Person Roles', COUNT(*) FROM person_roles
-- ... (full query in 005_seed_data_part3.sql)
```

**Expected counts**:
- People: 22
- Education Records: 20+
- Person Roles: 30+
- Technologies: 4
- Research Programs: 8
- Clinical Trials: 2
- Publications: 7+ (abbreviated version)
- Partnerships: 4
- Investors: 6
- Funding Rounds: 6
- Grants: 4
- Legal Entities: 3
- Patents: 6
- Milestones: 15

---

## Testing the Knowledge Graph

### Test Query 1: Technology Lineage

```sql
SELECT * FROM vw_technology_evolution;
```

**Expected result**: Shows ACM (2009) → ATP™ (2013) → BNP (2020) lineage.

### Test Query 2: All Programs Using ATP™

```sql
SELECT * FROM vw_atp_programs;
```

**Expected result**: 7 of 8 programs using ATP™ platform.

### Test Query 3: Funding Timeline

```sql
SELECT * FROM vw_funding_timeline ORDER BY close_date;
```

**Expected result**: 6 funding rounds from 2016-2025 totaling $26M+.

### Test Query 4: Publication Co-Authorship

```sql
SELECT * FROM vw_publication_network;
```

**Expected result**: Publications with concatenated author lists.

### Test Query 5: Complete Dashboard

```sql
-- Run Query 30 from 005_example_queries.sql
-- Shows: Total funding, grants, programs, trials, patents, publications, partnerships, tech platforms, team size, global presence
```

---

## Advanced Queries

See `005_example_queries.sql` for **30 sophisticated queries** including:

1. **Technology Validation Trail** (Q28): Patents → Publications → Programs → Trials → Results
2. **Co-Authorship Network** (Q9): Who collaborates with whom?
3. **Investment ROI** (Q29): Funding correlated with milestones achieved
4. **Program Readiness** (Q27): Multi-dimensional assessment (tech, clinical, partnerships, publications, patents)
5. **Partnership Impact** (Q11): Which partnerships enabled which programs
6. **Geographic Footprint** (Q20): Countries with ACM presence
7. **People Expertise** (Q22): Team capabilities map
8. **Patent Portfolio** (Q16): Complete IP protection status
9. **Milestone Timeline** (Q24): Company evolution 2013-2025
10. **Complete Dashboard** (Q30): Executive summary metrics

---

## Schema Details

See `005_ER_DIAGRAM_DESCRIPTION.md` for:
- Complete entity-relationship diagrams
- Detailed table schemas
- Cardinality documentation
- Index strategy
- Junction table mappings
- Query complexity examples

---

## Integration with Existing Platform

### How This Connects to Your Research Agent Platform:

1. **Context Loading** (from migration 003):
   - `acm_knowledge_base` → provides company context to LLMs
   - New `people`, `technologies`, `programs` → can be queried to enrich context

2. **Data Sources** (from migration 004):
   - `data_sources` → 17 research databases
   - New `publications` → shows ACM's own research output
   - New `clinical_trials` → links to ClinicalTrials.gov

3. **Workflows** (from schema.sql):
   - Existing workflows → can now query knowledge graph
   - Example: "Literature Mining" workflow → could search `publications` table for ACM papers

4. **Query Enhancement**:
   ```javascript
   // In /app/api/query/route.ts, you could add:
   const acmContext = await query(`
     SELECT jsonb_build_object(
       'programs', (SELECT json_agg(program_code) FROM research_programs WHERE is_active = true),
       'technologies', (SELECT json_agg(name) FROM technologies),
       'latest_publications', (SELECT json_agg(title) FROM publications ORDER BY publication_date DESC LIMIT 5)
     ) as context
   `);
   // Pass this context to LLMs for ACM-specific queries
   ```

---

## Query Examples for Your Platform

### Example 1: Competitive Intelligence Workflow

```sql
-- Find all competitor mentions in trials and publications
SELECT
  'Clinical Trial' as source_type,
  ct.nct_id as reference,
  ct.trial_title,
  rp.program_code
FROM clinical_trials ct
INNER JOIN research_programs rp ON ct.program_id = rp.id
WHERE ct.description ILIKE '%checkmate%' OR ct.description ILIKE '%dynavax%'

UNION ALL

SELECT
  'Publication' as source_type,
  pub.doi as reference,
  pub.title,
  NULL
FROM publications pub
WHERE pub.abstract ILIKE '%competitor%' OR pub.key_findings ILIKE '%regeneron%';
```

### Example 2: Program Status for CEO Dashboard

```sql
SELECT
  rp.program_code,
  rp.program_name,
  rp.development_stage,
  rp.therapeutic_area,
  ct.nct_id,
  ct.status as trial_status,
  COUNT(DISTINCT pub.id) as supporting_publications,
  COUNT(DISTINCT p.id) as active_partnerships,
  SUM(p.funding_amount) as partnership_funding_usd
FROM research_programs rp
LEFT JOIN clinical_trials ct ON rp.id = ct.program_id
LEFT JOIN publication_programs pp ON rp.id = pp.program_id
LEFT JOIN publications pub ON pp.publication_id = pub.id
LEFT JOIN partnership_programs parprog ON rp.id = parprog.program_id
LEFT JOIN partnerships p ON parprog.partnership_id = p.id AND p.status = 'Active'
WHERE rp.is_active = true
GROUP BY rp.id, rp.program_code, rp.program_name, rp.development_stage, rp.therapeutic_area, ct.nct_id, ct.status
ORDER BY
  CASE rp.priority_level WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
  rp.development_stage;
```

### Example 3: Research Team Expertise for Hiring Decisions

```sql
SELECT
  p.expertise[1] as primary_expertise,
  COUNT(DISTINCT p.id) as team_members_with_expertise,
  string_agg(DISTINCT p.full_name, ', ' ORDER BY p.full_name) as people,
  COUNT(DISTINCT pub.id) as publications,
  COUNT(DISTINCT pat.id) as patents
FROM people p
LEFT JOIN publication_authors pa ON p.id = pa.person_id
LEFT JOIN publications pub ON pa.publication_id = pub.id
LEFT JOIN patent_inventors pi ON p.id = pi.person_id
LEFT JOIN patents pat ON pi.patent_id = pat.id
WHERE p.is_active = true AND p.expertise IS NOT NULL
GROUP BY p.expertise[1]
ORDER BY team_members_with_expertise DESC;
```

---

## Maintenance & Updates

### Adding New People

```sql
INSERT INTO people (full_name, title, primary_role, entity_affiliation, expertise)
VALUES ('New Scientist Name', 'PhD', 'Scientist', 'ACM Biolabs', ARRAY['Immunology', 'mRNA']);

-- Add education
INSERT INTO person_education (person_id, degree, field_of_study, institution, country)
VALUES ((SELECT id FROM people WHERE full_name = 'New Scientist Name'), 'PhD', 'Immunology', 'Stanford', 'USA');

-- Add role
INSERT INTO person_roles (person_id, role_type, role_title, organization, is_current)
VALUES ((SELECT id FROM people WHERE full_name = 'New Scientist Name'), 'scientist', 'Research Scientist', 'ACM Biolabs', true);
```

### Adding New Program

```sql
INSERT INTO research_programs (program_code, program_name, therapeutic_area, indication, development_stage, priority_level, description)
VALUES ('NEW-001', 'New Program Name', 'Oncology', 'Melanoma', 'Discovery', 'Medium', 'Description here');

-- Link to technology
INSERT INTO program_technologies (program_id, technology_id, relationship_type)
VALUES (
  (SELECT id FROM research_programs WHERE program_code = 'NEW-001'),
  (SELECT id FROM technologies WHERE code = 'ATP'),
  'primary_platform'
);
```

### Adding New Publication

```sql
-- Insert publication
INSERT INTO publications (pub_type, title, journal_or_venue, publication_date, doi, pmid)
VALUES ('Peer-Reviewed', 'Paper Title', 'Nature', '2025-12-01', '10.1234/nature.12345', '98765432');

-- Link authors
INSERT INTO publication_authors (publication_id, person_id, author_position, is_corresponding)
VALUES
  ((SELECT id FROM publications WHERE doi = '10.1234/nature.12345'),
   (SELECT id FROM people WHERE full_name = 'Jian Hang Lam'),
   1, true),
  ((SELECT id FROM publications WHERE doi = '10.1234/nature.12345'),
   (SELECT id FROM people WHERE full_name = 'Madhavan Nallani'),
   2, false);

-- Link to program
INSERT INTO publication_programs (publication_id, program_id, relationship_type)
VALUES (
  (SELECT id FROM publications WHERE doi = '10.1234/nature.12345'),
  (SELECT id FROM research_programs WHERE program_code = 'ACM-001'),
  'validates'
);
```

---

## Troubleshooting

### Issue: Foreign Key Violations

**Symptom**: `ERROR: insert or update on table "X" violates foreign key constraint`

**Solution**: Ensure parent records exist before inserting child records. Order matters:
1. People, Technologies, Legal Entities, Investors (no dependencies)
2. Research Programs (needs Technologies)
3. Clinical Trials (needs Programs)
4. Publications (standalone), then publication_authors (needs People + Publications)
5. Partnerships (standalone), then partnership_programs (needs Programs)
6. Funding Rounds (standalone), then investor_funding_rounds (needs Investors)
7. Patents (needs Legal Entities), then patent_inventors, patent_technologies
8. Milestones (needs everything - insert last)

### Issue: Unique Constraint Violations

**Symptom**: `ERROR: duplicate key value violates unique constraint`

**Solution**:
- `technologies.name`: Change technology name if duplicate
- `research_programs.program_code`: Use unique program codes
- `clinical_trials.nct_id`: NCT IDs must be unique
- `patents.patent_number`: Patent numbers must be unique
- `investors.investor_name`: Check for typos in investor names

### Issue: Views Not Working

**Symptom**: `ERROR: relation "vw_xxx" does not exist`

**Solution**: Ensure `005_acm_comprehensive_knowledge_graph.sql` ran successfully. Views are created at the end of that file.

---

## Performance Considerations

### For Large Datasets

If you add thousands of records:

1. **Indexes**: Already created on frequently queried columns
2. **Materialized Views**: Consider converting views to materialized:
   ```sql
   CREATE MATERIALIZED VIEW mvw_atp_programs AS
   SELECT * FROM vw_atp_programs;

   -- Refresh periodically
   REFRESH MATERIALIZED VIEW mvw_atp_programs;
   ```

3. **Partitioning**: For time-series data (milestones, publications):
   ```sql
   -- Example: Partition milestones by year
   CREATE TABLE milestones_2023 PARTITION OF milestones
   FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
   ```

---

## Next Steps

1. **Run all migrations** in Neon SQL Editor
2. **Verify data** using test queries above
3. **Explore example queries** (005_example_queries.sql)
4. **Read ER documentation** (005_ER_DIAGRAM_DESCRIPTION.md)
5. **Integrate with your platform**:
   - Update `/app/api/query/route.ts` to query knowledge graph
   - Add knowledge graph visualization (ReactFlow for people network, tech lineage, etc.)
   - Create admin UI for managing programs, publications, partnerships

---

## Support & Documentation

- **Schema Reference**: See 005_ER_DIAGRAM_DESCRIPTION.md
- **Query Examples**: See 005_example_queries.sql (30 queries)
- **Database Migrations**: All files in /db/migrations/
- **Platform Integration**: See /lib/contextLoader.ts for examples

---

## Success Criteria

After running all migrations, you should be able to:

✅ Query 22 people with their complete backgrounds
✅ Trace technology lineage from A*STAR (2009) to current programs
✅ See all 8 programs with linked technologies, trials, publications
✅ View clinical trial NCT05385991 with 6 Australian sites
✅ Browse publication co-authorship network
✅ Track $26M funding across 6 rounds and 6 investors
✅ Explore 4 strategic partnerships (CEPI, DIOSynVax, NCCS, UH Zurich)
✅ Review 6 patents protecting platform technologies
✅ Follow company timeline from 2013 founding to 2025 ACM-CpG results

**Your ACM Biolabs knowledge graph is now complete! 🎉**
