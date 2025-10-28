# ACM Biolabs Comprehensive Knowledge Graph - Entity Relationship Diagram

## Overview
This document describes the complete entity-relationship model for the ACM Biolabs Knowledge Graph, comprising **10 normalized ontology domains** with **42 core tables** and **15+ junction tables** representing complex relationships across the organization's research, clinical, business, and intellectual property landscape.

---

## Domain Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ACM BIOLABS KNOWLEDGE GRAPH                             │
│                          10 Ontology Domains                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Domain 1: PEOPLE (22 individuals)
    ├── people (core table)
    ├── person_education (degrees & institutions)
    ├── person_roles (multiple roles per person)
    └── person_technology_contributions (inventors/developers)

Domain 2: TECHNOLOGY PLATFORMS (4 platforms)
    ├── technologies (ATP™, ACM, BNP, ACM-CpG)
    ├── technology_specifications (detailed attributes)
    ├── technology_advantages (competitive differentiation)
    └── technology_lineage (evolution & derivation)

Domain 3: RESEARCH PROGRAMS (8 programs)
    ├── research_programs (core programs)
    ├── program_technologies (junction: which tech enables which program)
    └── program_status_history (development progression)

Domain 4: CLINICAL TRIALS (2 trials)
    ├── clinical_trials (NCT05385991, NCT06587295)
    ├── trial_sites (geographic locations)
    ├── trial_investigators (people involved)
    └── trial_results (outcomes & announcements)

Domain 5: PUBLICATIONS (15 outputs)
    ├── publications (papers, conferences, press releases)
    ├── publication_authors (junction: co-authorship network)
    └── publication_programs (junction: which pubs validate which programs)

Domain 6: PARTNERSHIPS (4 strategic collaborations)
    ├── partnerships (CEPI, DIOSynVax, NCCS, UH Zurich)
    └── partnership_programs (junction: which partnerships enable which programs)

Domain 7: FINANCIAL (investors, rounds, grants)
    ├── investors (6 investors)
    ├── funding_rounds (6 rounds totaling $26M)
    ├── investor_funding_rounds (junction: who invested in what)
    └── grants (4 grants from government agencies)

Domain 8: ORGANIZATION (3 legal entities)
    ├── legal_entities (Singapore HQ, Basel, Sydney)
    ├── entity_locations (addresses & contacts)
    └── entity_relationships (parent-subsidiary structure)

Domain 9: INTELLECTUAL PROPERTY (6 patents)
    ├── patents (core patent records)
    ├── patent_inventors (junction: who invented what)
    ├── patent_claims (individual claims)
    ├── patent_technologies (junction: which patents protect which tech)
    └── patent_jurisdictions (multi-country filings)

Domain 10: MILESTONES (15 key events 2013-2025)
    └── milestones (timeline with links to programs, trials, partnerships, funding, pubs)
```

---

## Core Entity Relationships

### Primary Relationships

```
PEOPLE ←→ TECHNOLOGIES
    • person_technology_contributions
    • Madhavan Nallani → Invented ATP™, ACM platforms
    • Katherine Schultheis → Developed BNP formulations
    • Steve Pascolo → Validated mRNA delivery technology

TECHNOLOGIES ←→ TECHNOLOGIES
    • technology_lineage (self-referential)
    • ACM (2009) → ATP™ (2013) → BNP (2020)
    • ATP™ → ACM-CpG (2020)

TECHNOLOGIES ←→ RESEARCH PROGRAMS
    • program_technologies (junction)
    • ATP™ platform → enables 7 of 8 programs
    • ACM-CpG platform → enables oncology program

RESEARCH PROGRAMS ←→ CLINICAL TRIALS
    • clinical_trials.program_id (FK)
    • ACM-001 program → NCT05385991 trial
    • ACM-CpG program → NCT06587295 trial

PEOPLE ←→ CLINICAL TRIALS
    • trial_investigators (junction)
    • Pierre Vandepapelière (CMO) → oversees trials
    • Dr. Amit Jain (NCCS) → Principal Investigator

PEOPLE ←→ PUBLICATIONS
    • publication_authors (junction)
    • Co-authorship network
    • Jian Hang Lam → Lead author on BNP thermostability paper
    • Madhavan Nallani → Senior/corresponding author on most papers

PUBLICATIONS ←→ RESEARCH PROGRAMS
    • publication_programs (junction)
    • Biomacromolecules 2025 → validates ATP™ platform, ACM-001, bird flu, rabies
    • ACS Nano 2021/2022 → validates ACM-001

PARTNERSHIPS ←→ RESEARCH PROGRAMS
    • partnership_programs (junction)
    • CEPI → funds rabies program
    • DIOSynVax → enables bird flu vaccine
    • NCCS → conducts ACM-CpG trial
    • University Hospital Zurich → validates mRNA technology

PARTNERSHIPS ←→ GRANTS
    • grants.partnership_id (implicit)
    • CEPI partnership → $2.87M grant
    • UH Zurich partnership → Innosuisse grant

INVESTORS ←→ FUNDING ROUNDS
    • investor_funding_rounds (junction)
    • San Pacific Investments → led Series A
    • Ritz Venture Capital → led $6.8M round
    • Multiple investors per round

PATENTS ←→ PEOPLE
    • patent_inventors (junction)
    • Madhavan Nallani → inventor on 3 core patents
    • Plus Fabien Decaillot, Thomas Andrew Cornell, Amit Kumar Khan

PATENTS ←→ TECHNOLOGIES
    • patent_technologies (junction)
    • US 2022/0105176 A1 → protects ACM surface conjugation
    • WO 2019/145475 A2 → protects ACM encapsulation
    • WO 2021/019102 A2 → protects dual-population method

LEGAL ENTITIES ←→ LEGAL ENTITIES
    • entity_relationships (self-referential)
    • ACM Biolabs Pte Ltd (Singapore) → parent
    •     ├── ACM Biosciences AG (Basel) → subsidiary (infectious disease focus)
    •     └── ACM Biolabs Pty Ltd (Sydney) → subsidiary (clinical operations)

MILESTONES → ALL DOMAINS
    • Links to programs, trials, partnerships, funding_rounds, publications
    • Complete timeline from founding (2013) to latest results (2025)
```

---

## Detailed Entity Schemas

### Domain 1: People

**people** (Core Table)
- PK: id (UUID)
- Attributes: full_name, title, primary_role, entity_affiliation, email, phone, linkedin_url, orcid, google_scholar_url
- Arrays: expertise[]
- Text: bio
- Timestamps: created_at, updated_at
- **22 individuals**: 2 executives, 4 board members, 2 ACM Biosciences leads, 6 Singapore scientists, 6 research staff, 2 advisors

**person_education**
- PK: id (UUID)
- FK: person_id → people(id) CASCADE
- Attributes: degree, field_of_study, institution, country, start_year, end_year, is_primary
- **Example**: Madhavan Nallani → PhD Polymer Chemistry, TU Eindhoven, Netherlands

**person_roles**
- PK: id (UUID)
- FK: person_id → people(id) CASCADE
- Attributes: role_type (executive|board|scientist|advisor), role_title, organization, start_date, end_date, is_current
- **Supports multiple concurrent roles**: Madhavan = CEO + CSO + Chairman

**person_technology_contributions**
- PK: (person_id, technology_id) - Composite
- FK: person_id → people(id) CASCADE
- FK: technology_id → technologies(id) CASCADE
- Attributes: contribution_type (Inventor|Developer|Researcher), description

### Domain 2: Technologies

**technologies** (Core Table)
- PK: id (UUID)
- UK: name UNIQUE
- Attributes: code (ATP|ACM|BNP|ACM-CpG), platform_type, description, technical_summary, development_status
- Specifications: storage_temperature_celsius, storage_duration
- Arrays: administration_routes[], payload_types[]
- Origin: origin_institution, origin_year
- **4 platforms**: ATP™, ACM, BNP, ACM-CpG

**technology_specifications**
- PK: id (UUID)
- FK: technology_id → technologies(id) CASCADE
- Attributes: spec_category (composition|performance|manufacturing), spec_name, spec_value, spec_unit, evidence_source
- **Example**: ATP™ → Storage Stability = ">1 year at 4°C" (Biomacromolecules 2025)

**technology_advantages**
- PK: id (UUID)
- FK: technology_id → technologies(id) CASCADE
- Attributes: advantage_category (stability|immunogenicity|cost|manufacturing), advantage_title, advantage_description
- Comparison: comparison_baseline ("vs LNPs"), priority_rank, evidence_strength
- **Example**: ATP™ → "Eliminates Ultra-Cold Storage" vs LNPs (priority 1, clinical evidence)

**technology_lineage** (Self-Referential)
- PK: id (UUID)
- FK: parent_technology_id → technologies(id)
- FK: child_technology_id → technologies(id)
- Attributes: relationship_type (derived_from|enables|incorporates), description, transition_year
- CONSTRAINT: no_self_lineage CHECK (parent != child)
- **Example**: ACM → ATP™ (derived_from, 2013)

### Domain 3: Research Programs

**research_programs** (Core Table)
- PK: id (UUID)
- UK: program_code UNIQUE (ACM-001, ACM-005, ACM-010, ACM-011, H5Nx-001, RABIES-001, LUNG-001, OPTHAL-001)
- Attributes: program_name, therapeutic_area (Infectious Diseases|Oncology|Ophthalmology), indication, development_stage, priority_level
- Text: description, scientific_rationale
- Timeline: start_date, expected_ind_filing, expected_first_patient
- Status: is_active, status_notes
- **8 programs**: 2 clinical, 2 IND-enabling, 2 preclinical, 2 discovery

**program_technologies** (Junction)
- PK: (program_id, technology_id) - Composite
- FK: program_id → research_programs(id) CASCADE
- FK: technology_id → technologies(id) CASCADE
- Attributes: relationship_type (primary_platform|incorporates|evaluates), description
- **Example**: ACM-001 → uses ATP™ as primary_platform

**program_status_history**
- PK: id (UUID)
- FK: program_id → research_programs(id) CASCADE
- Attributes: old_stage, new_stage, transition_date, notes, announced_via
- **Tracks progression**: Discovery → Preclinical → IND-Enabling → Phase 1 → Phase 2

### Domain 4: Clinical Trials

**clinical_trials** (Core Table)
- PK: id (UUID)
- UK: nct_id UNIQUE (NCT05385991, NCT06587295)
- FK: program_id → research_programs(id)
- Attributes: trial_title, phase (Phase 1|Phase 1/2|Phase 2), design, indication
- Enrollment: enrollment_target, enrollment_actual
- Status: status (Active|Completed|Recruiting), start_date, completion_date, sponsor
- Administration: administration_route, dosing_schedule
- Endpoints: primary_endpoints, secondary_endpoints

**trial_sites**
- PK: id (UUID)
- FK: trial_id → clinical_trials(id) CASCADE
- Attributes: site_name, city, country, site_number
- **Example**: NCT05385991 → 6 Australian sites (Sydney, Melbourne, Brisbane, Perth, Adelaide, Canberra)

**trial_investigators**
- PK: id (UUID)
- FK: trial_id → clinical_trials(id) CASCADE
- FK: person_id → people(id)
- Attributes: investigator_type (Principal Investigator|Co-Investigator|Site PI), affiliation

**trial_results**
- PK: id (UUID)
- FK: trial_id → clinical_trials(id) CASCADE
- Attributes: result_type (Topline|Interim|Final|Safety), announcement_date
- Safety: no_serious_adverse_events (BOOLEAN), safety_summary
- Efficacy: efficacy_summary, results_text, publication_reference

### Domain 5: Publications

**publications** (Core Table)
- PK: id (UUID)
- Attributes: pub_type (Peer-Reviewed|Conference|Press Release|Preprint), title, journal_or_venue, publication_date
- Identifiers: doi, pmid (PubMed ID), url
- Content: abstract, key_findings
- Metrics: citation_count
- **15 outputs**: 5 peer-reviewed, 2 preprints, 2 conferences, 6 press releases

**publication_authors** (Junction - Co-Authorship Network)
- PK: (publication_id, person_id) - Composite
- FK: publication_id → publications(id) CASCADE
- FK: person_id → people(id) CASCADE
- Attributes: author_position (1 = first author), is_corresponding
- **Example**: Biomacromolecules 2025 → 12 authors (Lam JH first, Nallani M last/corresponding)

**publication_programs** (Junction)
- PK: (publication_id, program_id) - Composite
- FK: publication_id → publications(id) CASCADE
- FK: program_id → research_programs(id) CASCADE
- Attributes: relationship_type (validates|supports|announces)

### Domain 6: Partnerships

**partnerships** (Core Table)
- PK: id (UUID)
- Attributes: partner_name, partner_type (Government|Non-profit|Industry|Academic), partner_country, partnership_type
- Timeline: start_date, end_date, status (Active|Completed)
- Text: description, objectives, deliverables
- Financial: funding_amount, funding_currency
- Announcement: announcement_date, announcement_source
- **4 partnerships**: CEPI, DIOSynVax, NCCS, University Hospital Zurich

**partnership_programs** (Junction)
- PK: (partnership_id, program_id) - Composite
- FK: partnership_id → partnerships(id) CASCADE
- FK: program_id → research_programs(id) CASCADE
- Attributes: role_description (how partnership supports program)

### Domain 7: Financial

**investors** (Core Table)
- PK: id (UUID)
- UK: investor_name UNIQUE
- Attributes: investor_type (Venture Capital|Family Office|Corporate|University|Accelerator), country
- Text: description, website
- Array: focus_areas[]
- **6 investors**: Ritz VC, San Pacific, Efung, Nagase, NTUitive, Venturelab

**funding_rounds** (Core Table)
- PK: id (UUID)
- Attributes: round_type (Seed|Series A|Series B|Grant), round_name, amount_usd, amount_currency
- Timeline: close_date, announced_date
- FK: lead_investor_id → investors(id)
- Text: description, use_of_funds
- **6 rounds**: First (2016), Series A ($5M, 2020), ACM Bio Seed (2021), Venturelab Seed (2021), Series B ($6.8M, 2022), CEPI Grant ($2.87M, 2025)

**investor_funding_rounds** (Junction - Many-to-Many)
- PK: (investor_id, funding_round_id) - Composite
- FK: investor_id → investors(id) CASCADE
- FK: funding_round_id → funding_rounds(id) CASCADE
- Attributes: participation_type (Lead|Co-Lead|Participant)
- **Example**: Series A → San Pacific (Lead) + Efung + Nagase (Participants)

**grants** (Core Table)
- PK: id (UUID)
- Attributes: grant_name, grantor_organization, grantor_country, amount_usd, amount_description
- Timeline: award_date, start_date, end_date
- Text: purpose, deliverables
- FK: program_id → research_programs(id) (which program benefits)
- **4 grants**: CEPI ($2.87M), Innosuisse, Innovate UK, IAF-PP

### Domain 8: Organization

**legal_entities** (Core Table)
- PK: id (UUID)
- Attributes: entity_name, entity_type (Parent Company|Subsidiary|Branch), entity_legal_structure (Pte Ltd|AG|Pty Ltd)
- Incorporation: incorporation_date, incorporation_country, jurisdiction
- Registration: registration_number, tax_id
- Status: is_active
- Text: description, business_purpose
- **3 entities**: ACM Biolabs Pte Ltd (Singapore), ACM Biosciences AG (Basel), ACM Biolabs Pty Ltd (Sydney)

**entity_locations**
- PK: id (UUID)
- FK: entity_id → legal_entities(id) CASCADE
- Attributes: location_type (Headquarters|Office|Laboratory|Manufacturing)
- Address: address_line1, address_line2, city, state_province, postal_code, country
- Contact: phone, email
- Flag: is_primary

**entity_relationships** (Self-Referential Parent-Subsidiary)
- PK: (parent_entity_id, child_entity_id) - Composite
- FK: parent_entity_id → legal_entities(id) CASCADE
- FK: child_entity_id → legal_entities(id) CASCADE
- Attributes: relationship_type (Parent-Subsidiary|Affiliate|Joint Venture), ownership_percentage, start_date, end_date
- CONSTRAINT: no_self_relationship CHECK (parent != child)
- **Example**: Singapore (parent) → Basel (100% subsidiary, infectious disease license)

### Domain 9: Intellectual Property

**patents** (Core Table)
- PK: id (UUID)
- UK: patent_number UNIQUE (US 2022/0105176 A1, WO 2019/145475 A2, WO 2021/019102 A2, EP3849600A1, CN201980021354.5A, BR112020013405-8A)
- Attributes: patent_title, filing_date, priority_date, publication_date, grant_date
- Status: patent_status (Filed|Published|Granted|Pending), jurisdiction
- FK: assignee_entity_id → legal_entities(id)
- Text: abstract, description, patent_url
- **6 patents**: 3 core patents + 3 additional jurisdictions

**patent_inventors** (Junction)
- PK: (patent_id, person_id) - Composite
- FK: patent_id → patents(id) CASCADE
- FK: person_id → people(id) CASCADE
- Attributes: inventor_position

**patent_claims**
- PK: id (UUID)
- FK: patent_id → patents(id) CASCADE
- Attributes: claim_number, claim_type (Independent|Dependent), claim_text

**patent_technologies** (Junction - IP Protection)
- PK: (patent_id, technology_id) - Composite
- FK: patent_id → patents(id) CASCADE
- FK: technology_id → technologies(id) CASCADE
- Attributes: protection_scope (what aspect is protected)

**patent_jurisdictions** (Multi-Country Filings)
- PK: id (UUID)
- FK: patent_id → patents(id) CASCADE
- Attributes: jurisdiction_code (US|EP|CN|BR|AU), application_number, status, filing_date

### Domain 10: Milestones

**milestones** (Core Table - Timeline Hub)
- PK: id (UUID)
- Attributes: milestone_date, milestone_category (Founding|Funding|Clinical|Partnership|Regulatory|Publication), title
- Text: description, significance, announcement_source, announcement_url
- **Links to ALL domains** (nullable FKs):
  - FK: program_id → research_programs(id)
  - FK: trial_id → clinical_trials(id)
  - FK: partnership_id → partnerships(id)
  - FK: funding_round_id → funding_rounds(id)
  - FK: publication_id → publications(id)
- **15 events**: 2013 founding → 2025-10-22 ACM-CpG results

---

## Index Strategy (Performance Optimization)

```sql
-- People Domain
idx_people_role (primary_role)
idx_people_affiliation (entity_affiliation)
idx_people_active (is_active)
idx_education_person (person_id)
idx_person_roles_person (person_id)
idx_person_roles_type (role_type)

-- Technology Domain
idx_tech_code (code)
idx_tech_status (development_status)
idx_tech_specs_tech (technology_id)
idx_tech_adv_tech (technology_id)
idx_lineage_parent (parent_technology_id)
idx_lineage_child (child_technology_id)

-- Research Programs Domain
idx_programs_code (program_code)
idx_programs_area (therapeutic_area)
idx_programs_stage (development_stage)
idx_status_history_program (program_id)

-- Clinical Trials Domain
idx_trials_nct (nct_id)
idx_trials_program (program_id)
idx_trials_status (status)
idx_trial_sites_trial (trial_id)
idx_investigators_trial (trial_id)
idx_investigators_person (person_id)
idx_trial_results_trial (trial_id)

-- Publications Domain
idx_pubs_type (pub_type)
idx_pubs_date (publication_date DESC)
idx_pubs_doi (doi)
idx_pubs_pmid (pmid)
idx_pub_authors_pub (publication_id)
idx_pub_authors_person (person_id)

-- Partnerships Domain
idx_partnerships_partner (partner_name)
idx_partnerships_type (partner_type)
idx_partnerships_status (status)

-- Financial Domain
idx_investors_type (investor_type)
idx_rounds_date (close_date DESC)
idx_rounds_type (round_type)
idx_grants_grantor (grantor_organization)
idx_grants_program (program_id)

-- Organization Domain
idx_entities_type (entity_type)
idx_entities_active (is_active)
idx_locations_entity (entity_id)

-- IP Domain
idx_patents_number (patent_number)
idx_patents_status (patent_status)
idx_patents_jurisdiction (jurisdiction)
idx_claims_patent (patent_id)
idx_patent_juris_patent (patent_id)

-- Milestones Domain
idx_milestones_date (milestone_date DESC)
idx_milestones_category (milestone_category)
```

---

## Cardinality

```
PEOPLE (22) ←→ PERSON_EDUCATION (35+)           [1:M]
PEOPLE (22) ←→ PERSON_ROLES (40+)               [1:M]
PEOPLE (22) ←→ PERSON_TECH_CONTRIB (5)          [M:M via junction]
PEOPLE (22) ←→ PUBLICATIONS (15)                [M:M via publication_authors]
PEOPLE (22) ←→ PATENTS (6)                      [M:M via patent_inventors]

TECHNOLOGIES (4) ←→ TECH_LINEAGE (3)            [Self M:M]
TECHNOLOGIES (4) ←→ TECH_SPECS (13+)            [1:M]
TECHNOLOGIES (4) ←→ TECH_ADV (9+)               [1:M]
TECHNOLOGIES (4) ←→ PROGRAMS (8)                [M:M via program_technologies]
TECHNOLOGIES (4) ←→ PATENTS (6)                 [M:M via patent_technologies]

PROGRAMS (8) ←→ CLINICAL_TRIALS (2)             [1:M]
PROGRAMS (8) ←→ PUBLICATIONS (15)               [M:M via publication_programs]
PROGRAMS (8) ←→ PARTNERSHIPS (4)                [M:M via partnership_programs]
PROGRAMS (8) ←→ GRANTS (4)                      [1:M]

CLINICAL_TRIALS (2) ←→ TRIAL_SITES (7)          [1:M]
CLINICAL_TRIALS (2) ←→ TRIAL_INVESTIGATORS (1+) [M:M via junction]
CLINICAL_TRIALS (2) ←→ TRIAL_RESULTS (2)        [1:M]

PARTNERSHIPS (4) ←→ PROGRAMS (8)                [M:M via junction]

INVESTORS (6) ←→ FUNDING_ROUNDS (6)             [M:M via investor_funding_rounds]

LEGAL_ENTITIES (3) ←→ ENTITY_LOCATIONS (3)      [1:M]
LEGAL_ENTITIES (3) ←→ ENTITY_RELATIONSHIPS (2)  [Self M:M for parent-subsidiary]
LEGAL_ENTITIES (3) ←→ PATENTS (6)               [1:M as assignee]

PATENTS (6) ←→ PATENT_INVENTORS (3+)            [M:M]
PATENTS (6) ←→ PATENT_CLAIMS (6+)               [1:M]
PATENTS (6) ←→ PATENT_JURISDICTIONS (6+)        [1:M]
PATENTS (6) ←→ PATENT_TECHNOLOGIES (6+)         [M:M]

MILESTONES (15) → ALL DOMAINS                   [M:1 to each domain via nullable FKs]
```

---

## Views (Pre-Aggregated Queries)

```sql
vw_atp_programs
    • Programs using ATP™ with clinical status

vw_funding_timeline
    • Funding history with investor relationships

vw_publication_network
    • Publications with author lists and co-authorship

vw_partnership_impact
    • Partnerships linked to programs they enable

vw_technology_evolution
    • Recursive CTE showing tech lineage tree

vw_patent_portfolio
    • Patents with inventors and protected technologies

vw_clinical_trials_progress
    • Trials with site counts and progress metrics

vw_milestones_timeline
    • Complete milestone history with entity links

vw_knowledge_base_by_category (from migration 003)
    • ACM knowledge base statistics

vw_ontology_stats (from migration 003)
    • Ontology domain statistics
```

---

## Data Integrity Constraints

### Foreign Key Cascades
- **ON DELETE CASCADE**: All junction tables, child records (education, roles, specs, claims)
- **ON DELETE RESTRICT**: Would break (funding rounds → investors, programs → trials)

### Unique Constraints
- people: None (multiple people can have same name)
- technologies: name UNIQUE
- research_programs: program_code UNIQUE
- clinical_trials: nct_id UNIQUE
- investors: investor_name UNIQUE
- patents: patent_number UNIQUE

### Check Constraints
- technology_lineage: no_self_lineage (parent != child)
- entity_relationships: no_self_relationship (parent != child)
- acm_relationships: no_self_reference (source != target) [from migration 003]

### Triggers
- update_updated_at_column() → fires BEFORE UPDATE on:
  - people, technologies, research_programs, clinical_trials, publications, partnerships, legal_entities, patents

---

## Summary Statistics (After Full Seed)

```
Domain 1: People                   22 individuals
Domain 2: Technologies              4 platforms
Domain 3: Research Programs         8 programs
Domain 4: Clinical Trials           2 trials (7 sites)
Domain 5: Publications             15 outputs (12+ authors)
Domain 6: Partnerships              4 strategic
Domain 7: Financial                 6 investors, 6 rounds, 4 grants
Domain 8: Organization              3 legal entities (3 locations)
Domain 9: Intellectual Property     6 patents (6+ jurisdictions)
Domain 10: Milestones              15 key events (2013-2025)

Junction Tables:                   15+ connecting relationships
Total Tables:                      42 core + 15 junction = 57 tables
Total Indexed Columns:             60+ indexes for performance
```

---

## Query Complexity Capabilities

With this schema, you can answer complex multi-hop questions like:

1. **Technology Validation Trail**: "Show me all patents protecting ATP™, publications validating it, programs using it, clinical trials proving it, and partnerships funding it."

2. **Co-Authorship Network**: "Which ACM scientists have co-published? What's the collaboration frequency? Which papers?"

3. **Funding ROI Analysis**: "For each funding round, what milestones (clinical, publications, partnerships) happened in the following year?"

4. **Program Readiness Assessment**: "For each program, show technology maturity, patent protection, publication evidence, partnership support, clinical progress, and funding secured."

5. **Geographic Footprint**: "Map all ACM presence: where are legal entities, trial sites, partnerships, and investors located?"

6. **People Expertise Network**: "Which team members have experience in [specific area]? What have they published? What technologies have they developed?"

7. **Investment Lineage**: "Trace funding from initial seed → Series A → Series B → grants → total deployed. Which investors came in when? What was achieved with each round?"

8. **Patent Family Analysis**: "For each core invention, show all jurisdictions filed, inventors involved, technologies protected, and programs enabled."

9. **Partnership Impact**: "How did each partnership advance specific programs? What funding did they bring? What milestones resulted?"

10. **Company Evolution Timeline**: "Show founding → first funding → first publication → first patent → first trial → first results → partnerships → current state with all metrics."

---

## ER Diagram Visualization Notes

For visual diagram tools (Lucidchart, dbdiagram.io, draw.io):

**Core Entities** (10 domains, 42 tables) - Use color coding:
- 🔵 Blue: People domain
- 🟣 Purple: Technology domain
- 🟢 Green: Research Programs domain
- 🟡 Yellow: Clinical Trials domain
- 🔴 Red: Publications domain
- 🟠 Orange: Partnerships domain
- 💰 Gold: Financial domain
- 🏢 Gray: Organization domain
- 📜 Brown: IP domain
- ⏰ Cyan: Milestones domain

**Relationship Lines**:
- Solid line: 1:M (FK constraint)
- Dashed line: M:M (junction table)
- Double line: Self-referential (lineage, entity relationships)
- Dotted line: Nullable FK (milestones → all domains)

**Junction Tables** (diamonds in classic ERD):
- publication_authors
- program_technologies
- partnership_programs
- investor_funding_rounds
- patent_inventors
- patent_technologies
- person_technology_contributions
- publication_programs
- trial_investigators

This ERD represents a **comprehensive, normalized, production-ready knowledge graph** enabling sophisticated biotech R&D queries comparable to airline route optimization complexity.
