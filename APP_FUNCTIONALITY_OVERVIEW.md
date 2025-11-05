# ACM Research Agents — Functional Overview

This document captures how the current Next.js application is organized so the product can be reimplemented on a new tech stack. Each section maps user-facing experiences to the underlying pages, components, API routes, and data models that drive them.

## 1. Platform architecture
- **Framework & shell.** The app uses the Next.js App Router with a global `RootLayout` that wraps every route in the NextAuth session provider, a reusable toast system, and the persistent navigation bar so every screen inherits authentication context and top navigation.【F:app/layout.tsx†L1-L34】【F:components/ToastProvider.tsx†L1-L117】
- **Authentication & access control.** Credentials-based sign-in/registration flows are implemented with NextAuth and guarded in middleware so query, workflow, history, and query API routes require an authenticated session.【F:lib/auth.ts†L1-L85】【F:app/auth/signin/page.tsx†L1-L128】【F:app/auth/register/page.tsx†L1-L176】【F:middleware.ts†L1-L17】
- **Database & query helper.** A pooled connection to Postgres (Neon) is exposed through `lib/db.ts`, while `schema.sql` defines core tables for workflows, queries, LLM responses, consensus, and seed templates used across the experience.【F:lib/db.ts†L1-L34】【F:schema.sql†L1-L117】

## 2. Global navigation & layout
- **Navigation chrome.** `components/Navigation` renders the authenticated top bar with quick links to research, workflow, history, knowledge graph, competitor map, and admin tools (only shown to admin-role users). It also handles dropdown dismissal and sign-out actions.【F:components/Navigation.tsx†L1-L185】
- **Styling.** Tailwind utility classes (augmented by custom tokens in `app/globals.css`) drive the glassmorphism-heavy marketing surfaces, dark competitor dashboards, and CTA treatments referenced throughout the UI.

## 3. Landing experience (`/`)
- **Marketing hero & CTAs.** The home page fetches workflow templates and recent history (for stats) once a session is available, then renders hero CTAs that branch into the query workspace or workflow library.【F:app/page.tsx†L23-L158】
- **Value proof points.** Animated stat cards for total queries, consensus rate, and workflow count are computed from history/workflow API responses to reinforce platform coverage.【F:app/page.tsx†L160-L185】
- **Workflow showcase.** Below the hero, additional sections (How it works, feature grids, etc.) reuse Tailwind components to explain the four-step process and highlight bundled workflows (see file for full markup).【F:app/page.tsx†L190-L200】

## 4. Research query workspace (`/query`)
- **Configuration surface.** Users can pick a workflow, type a research question, and optionally expand “Advanced Options” to choose ACM knowledge-base depth, workflow-specific data sources, and trigger a pre-run cost estimate.【F:app/query/page.tsx†L314-L398】【F:components/ContextLevelSelector.tsx†L85-L200】【F:components/DataSourceSelector.tsx†L29-L200】【F:components/CostEstimator.tsx†L40-L200】
- **Execution flow.** Submitting the form posts to `/api/query`, which (a) enforces auth, (b) reuses cached responses where possible, (c) enriches prompts with Google Patent context, and (d) fan-outs to Anthropic, OpenAI, Gemini, and Grok clients before saving responses to Postgres.【F:app/query/page.tsx†L67-L149】【F:app/api/query/route.ts†L1-L172】【F:lib/llm-clients.ts†L1-L198】
- **Results presentation.** Responses render in provider-branded cards with confidence bars, timing, token counts, copy/export affordances, and consensus messaging that highlights agreement or conflict between models.【F:app/query/page.tsx†L400-L552】
- **Aggregated insights.** The workspace auto-generates a unified summary, displays patent intelligence cards, and offers a “Human Decision” panel for selecting a preferred answer or exporting all responses.【F:app/query/page.tsx†L554-L715】【F:components/PatentCard.tsx†L1-L105】

## 5. Workflow library (`/workflows`)
- **Template gallery.** `WorkflowsTab` fetches template workflows from `/api/workflows?is_template=true`, presenting cards with iconography, duration, usage count, and sample prompts.【F:components/WorkflowsTab.tsx†L7-L121】
- **Detail modal & execution.** Selecting a template opens `WorkflowDetailModal`, which lists examples, parameter inputs, and funnels the user into `/api/workflows/[id]/execute` to launch the curated prompt directly into the query workspace.【F:components/WorkflowDetailModal.tsx†L12-L200】【F:app/api/workflows/[id]/execute/route.ts†L1-L200】

## 6. Query history (`/history`)
- **Analytics & filtering.** `HistoryTab` loads paginated query records with optional filters for workflow category, consensus levels, model providers, status, search text, and date range.【F:components/HistoryTab.tsx†L9-L173】
- **Management actions.** Users can expand items (via supporting components), delete prior runs, or re-run a query—each invoking dedicated API routes (`/api/history`, `/api/history/[id]`, `/api/history/[id]/re-run`).【F:components/HistoryTab.tsx†L86-L131】【F:app/api/history/route.ts†L1-L200】【F:app/api/history/[id]/re-run/route.ts†L1-L200】

## 7. Competitor intelligence (`/competitors`)
- **Multi-view dashboard.** The page fetches enriched competitor records and lets users toggle between map, grid, and list views while filtering by threat level, geography, or fuzzy text search.【F:app/competitors/page.tsx†L1-L200】
- **Data service.** `/api/competitors` aggregates competitor, update, trial, and publication data with optional filters so the UI can render threat badges, stats, and map markers.【F:app/api/competitors/route.ts†L1-L100】

## 8. Knowledge graph (`/ontology`)
- **Visualization.** `ACMKnowledgeGraph` leverages React Flow to render domain-colored nodes, hover interactions, animated counters, and control panels for exploring ACM’s ontology, while the page dynamically imports the component to avoid SSR issues.【F:app/ontology/page.tsx†L1-L28】【F:components/ACMKnowledgeGraph.tsx†L1-L200】
- **API & context.** Knowledge graph data (domains, nodes, relationships, stats) is served via dedicated ontology API routes described in existing implementation docs; the component expects that JSON contract.

## 9. Admin & automation surfaces (`/admin/*`)
- **Database migration console.** `/admin/migrate` checks table readiness via `/api/admin/migrate`, runs migrations with an admin secret, and shows seeded row counts plus CLI instructions for alternative execution paths.【F:app/admin/migrate/page.tsx†L1-L200】
- **Intelligence operations.** `/admin/intelligence` provides CTA cards to run the weekly competitor research job, generate newsletters, send drafts, and review subscriber metrics, all wrapped in the shared confirmation dialog and toast system.【F:app/admin/intelligence/page.tsx†L1-L400】
- **Automation endpoints.**
  - `/api/research/weekly` iterates over every active competitor, calls Anthropic for JSON summaries, persists AI insights, and stores run metadata for auditing.【F:app/api/research/weekly/route.ts†L1-L200】
  - `/api/newsletter/generate` collates recent competitive activity, requests a long-form newsletter from Anthropic, and saves the result as a draft newsletter record.【F:app/api/newsletter/generate/route.ts†L1-L200】
  - `/api/newsletter/send` retrieves active subscribers, (currently) simulates delivery, and marks newsletters as sent while exposing subscriber listings on GET.【F:app/api/newsletter/send/route.ts†L1-L133】

## 10. Supporting systems
- **Context management.** `lib/contextStrategies` and `lib/contextLoader` define minimal/standard/deep context bundles, fetch ACM knowledge-base entries, and track usage analytics, feeding both the query workspace and workflow executor.【F:lib/contextStrategies.ts†L1-L39】【F:lib/contextLoader.ts†L1-L120】
- **LLM abstraction.** `lib/llm-clients.ts` normalizes interactions with Claude, GPT-4o, Gemini, and Grok (plus an Ollama helper), returning provider-tagged responses with confidence, source extraction, timing, and token metadata used across the UI and APIs.【F:lib/llm-clients.ts†L1-L198】
- **User feedback.** The toast provider and branded confirmation dialog give all pages a non-blocking way to report success/failure states, replacing browser alerts across the admin tooling and elsewhere.【F:components/ToastProvider.tsx†L1-L117】【F:components/ConfirmDialog.tsx†L1-L73】

## 11. API surface summary
Key REST endpoints powering the UI include:
- `/api/workflows` (list/create templates) and `/api/workflows/[id]/execute` (run curated prompts).【F:app/api/workflows/route.ts†L1-L87】【F:app/api/workflows/[id]/execute/route.ts†L1-L200】
- `/api/query` & `/api/query/summarize` for multi-LLM orchestration and summary generation; `/api/estimate-cost` (used by the cost estimator) provides budget previews (implementation not shown here but invoked from the UI).【F:app/api/query/route.ts†L1-L172】【F:components/CostEstimator.tsx†L51-L114】
- `/api/history` plus nested routes for detail management; `/api/workflows/[id]/data-sources` supplies the workflow-specific source catalog rendered in the advanced query panel.【F:app/api/history/route.ts†L1-L200】【F:components/DataSourceSelector.tsx†L29-L200】
- `/api/competitors`, `/api/research/weekly`, `/api/newsletter/*`, `/api/context/preview`, and ontology endpoints power the intelligence dashboards, knowledge graph, and admin automations.【F:app/api/competitors/route.ts†L1-L100】【F:app/api/research/weekly/route.ts†L1-L200】【F:app/api/newsletter/generate/route.ts†L1-L200】

---
This map should give you a complete view of what needs to be replicated—feature by feature—when rebuilding ACM Research Agents with a new architecture, tech stack, and UI.
