# Kogvantage — Implementation Plan

**Version:** 1.0
**Date:** 13 April 2026
**Timeline:** 12 weeks (10 phases)
**Platform:** Next.js 15 on VPS (Docker + Caddy)

---

## Current Status

### Completed (Phases 1, 3, 4, 5, 7)

| Phase | What Was Built | Files | Status |
|---|---|---|---|
| **1. Scaffold** | Next.js 15 project, SQLite schema (25 tables, 15 indexes), unified types (core, RBAC, codewords, coordinator), Docker deployment, Caddy config, 13 CSV templates, test fixtures | 34 | Done |
| **3. Gantt View** | 4 components ported from Gemini-Roadmap: GanttView (drag/drop), TaskBars (SVG bars), TimelineHeader (dual-tier), DependencyLines (Bezier). 5-level zoom, ganttAdapter mock data | 5 | Done |
| **4. Subway View** | 7 components decomposed from 1,297-line monolith: SubwayView, SubwayCanvas, StationMarker (6 shapes), StationTooltip, StationEditModal, AddStationModal, SubwayLegend. subwayAdapter mock data | 8 | Done |
| **5. Financial Coordinator** | 5 import services (Timesheet, Actuals, LabourRates, Resource, FinanceLedger), tRPC router (projects, tasks, settings, coordinator), 3 UI components (CoordinatorDashboard, DataImport, VarianceAlerts) | 17 | Done |
| **7. AI Integration** | ClaudeService (9 methods via @anthropic-ai/sdk), AssistantPanel (chat UI with quick actions), 8 Cowork SKILL.md files | 10 | Done |

**Total files created:** 74
**Build status:** Passing (Next.js production build)
**Git commits:** 4

---

## Remaining Phases

### Phase 2: Onboarding Wizard (Week 5)

**Goal:** Guide first-time users through complete platform setup.

**Tasks:**
- [ ] `src/components/Onboarding/OnboardingWizard.tsx` — 8-step multi-step form
- [ ] Step 1: Role setup (Admin/PM/Financial/Stakeholder)
- [ ] Step 2: Org profile (name, logo upload, brand colors, currency, fiscal year, date format)
- [ ] Step 3: Data source connections (SAP, Jira, ADO, ServiceNow — card-based selector)
- [ ] Step 4: "Drop your data pack" file upload zone
- [ ] Step 5: Governance template upload (PPTX/DOCX/XLSX)
- [ ] Step 6: Security config (codewords, RBAC roles for team)
- [ ] Step 7: Default view preference (Gantt vs Subway preview)
- [ ] Step 8: AI assistant demo chat
- [ ] Resume-safe: each step saves to `app_settings` table
- [ ] Redirect logic: if `onboarding_complete = false`, show wizard instead of dashboard
- [ ] "Re-run Setup Wizard" button in Settings

**Verify:** Fresh app → wizard completes all steps → dashboard shows imported data

---

### Phase 6: Universal Data Ingestion Engine (Week 6-7)

**Goal:** AI-powered "drop anything" import that replaces manual CSV field mapping.

**Tasks:**
- [ ] `src/server/services/ingestion/UniversalIngestor.ts` — orchestrates file scanning, type detection, mapping
- [ ] `src/server/services/ingestion/DataTransformer.ts` — date normalization, currency conversion, name deduplication
- [ ] `src/server/services/ingestion/ImageScraper.ts` — Claude Vision for table extraction from screenshots/PDFs
- [ ] `src/components/Ingestion/DataPackUploader.tsx` — drag-drop zone for folders/ZIPs/multi-file
- [ ] `src/components/Ingestion/GapAnalysis.tsx` — displays AI gap report (found/missing/ambiguous)
- [ ] `src/components/Ingestion/FieldMapper.tsx` — manual override for column mapping
- [ ] `src/server/trpc/ingestion.ts` — tRPC procedures for upload, analyze, transform, import
- [ ] Support formats: CSV, XLSX (via SheetJS), JSON, PDF (text extraction), images (Claude Vision)
- [ ] Fuzzy column matching: "Emp No" → personnel_number, "Hrs" → hours
- [ ] Date format auto-detection: DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD, "January 15, 2025"

**Verify:** Drop a folder with mixed CSVs + a dashboard screenshot → AI identifies all files, maps columns, reports gaps, imports valid data

---

### Phase 8: Governance Templates + Codewords UI (Week 8-9)

**Goal:** Organizations upload their report templates; AI learns and reproduces the style. Codeword system protects sensitive data.

**Tasks:**

#### Governance Templates
- [ ] `src/server/services/TemplateService.ts` — analyze uploaded template, extract style profile
- [ ] `src/components/Modules/TemplateManager.tsx` — upload UI, template list, preview
- [ ] Template analysis: extract colors (hex), fonts, section headers, language tone
- [ ] Store as `governance_templates` row with TemplateProfile
- [ ] Report generation: AI produces content matching org style
- [ ] Support PPTX (via pptxgenjs), DOCX (via docx), XLSX (via SheetJS)

#### Codeword System
- [ ] `src/server/services/security/CodewordService.ts` — CRUD, encryption, filtering
- [ ] `src/components/Security/CodewordManager.tsx` — add/edit/delete codeword mappings
- [ ] `src/components/Security/CodewordFilter.tsx` — React context provider for display filtering
- [ ] `src/hooks/useCodewordFilter.ts` — hook to filter text, dates, amounts per user role
- [ ] Date shifting: configurable ±N days offset
- [ ] Financial masking: exact / range / percentage / hidden
- [ ] "See as [Role]" preview button for admins
- [ ] Bulk import codewords from CSV
- [ ] AI awareness: Claude uses codewords in responses for restricted roles

**Verify:** Upload a PPTX → AI extracts style → generate matching report. Create codeword → switch to Stakeholder view → real names replaced.

---

### Phase 9: API & MCP Integrations (Week 9-10)

**Goal:** Connect to external systems for bi-directional data sync.

**Tasks:**
- [ ] `src/server/trpc/integrations.ts` — CRUD for integration configs
- [ ] `src/components/Modules/IntegrationsManager.tsx` — settings UI with connection cards
- [ ] Azure DevOps connector: work item sync, webhook receiver (`/api/webhooks/ado`)
- [ ] Jira connector: issue/epic sync via REST API
- [ ] ServiceNow connector: incident/change sync
- [ ] Google Calendar integration (via existing MCP)
- [ ] Gmail integration (via existing MCP)
- [ ] Field mapping UI per integration (source field → Kogvantage field)
- [ ] Sync scheduling: manual, daily, weekly
- [ ] Connection test button with status indicator
- [ ] Webhook receiver for ADO/Jira push events

**Verify:** Configure ADO connection → pull work items → appear as epics/features in roadmap

---

### Phase 10: Documentation + Polish + Packaging (Week 11-12)

**Goal:** Production-ready release with comprehensive docs, tests, and deployment.

**Tasks:**

#### Documentation (9 files)
- [ ] `docs/USER-GUIDE.md` — end-user walkthrough
- [ ] `docs/ADMIN-GUIDE.md` — setup, RBAC, codewords, integrations
- [ ] `docs/DATA-INGESTION.md` — supported formats, mapping rules, troubleshooting
- [ ] `docs/AI-CAPABILITIES.md` — all 16 AI features with examples
- [ ] `docs/API-INTEGRATIONS.md` — ADO, Jira, ServiceNow setup guides
- [ ] `docs/GOVERNANCE-TEMPLATES.md` — template upload and report generation
- [ ] `docs/SECURITY.md` — encryption, codewords, RBAC, date shifting
- [ ] `docs/COWORK-SKILLS.md` — how to use Cowork for automation
- [ ] `docs/ONBOARDING.md` — wizard walkthrough with screenshots

#### Testing
- [ ] Vitest unit tests for adapters, services, tRPC procedures
- [ ] Playwright E2E: onboard → import → Gantt → Subway → financials → AI chat
- [ ] Test fixtures: expand CSV samples for all import types (valid + invalid)
- [ ] Error boundary testing for all views

#### Polish
- [ ] Loading states and skeleton screens for all views
- [ ] Error boundaries with recovery UI
- [ ] Toast notification system
- [ ] Keyboard shortcuts (Cmd+1 = Gantt, Cmd+2 = Subway, etc.)
- [ ] Responsive design for tablet viewport

#### Packaging
- [ ] Docker multi-stage build optimization
- [ ] Production environment variables documentation
- [ ] Health check endpoint (`/api/health`)
- [ ] Database backup/restore scripts
- [ ] GitHub Actions CI/CD pipeline

**Verify:** Full E2E: onboard → import data pack → Gantt + Subway → import financials → AI report → codeword-filtered export → Docker deploy on VPS

---

## Architecture Diagram

```
                    +------------------+
                    |   Caddy (HTTPS)  |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   Next.js 15     |
                    |   App Router     |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+       +-----------v-----------+
    |   React 19 (SSR)  |       |   tRPC API Routes     |
    |   - Gantt View    |       |   - projects.*        |
    |   - Subway View   |       |   - tasks.*           |
    |   - Financial UI  |       |   - coordinator.*     |
    |   - AI Panel      |       |   - settings.*        |
    |   - Onboarding    |       |   - ai.*              |
    +-------------------+       |   - ingestion.*       |
                                +-----------+-----------+
                                            |
                         +------------------+------------------+
                         |                                     |
               +---------v---------+              +------------v-----------+
               |   SQLite (OLTP)   |              |   DuckDB (OLAP)       |
               |   25+ tables      |              |   Financial analytics  |
               |   WAL mode        |              |   Columnar queries     |
               +-------------------+              +------------------------+
                                     \
                               +------v-------+
                               |  Claude API  |
                               |  (Sonnet)    |
                               +--------------+
```

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | Subway decomposition rendering bugs | Medium | High | Snapshot tests comparing SVG output | Dev |
| 2 | Claude API cost at scale | Medium | Medium | Query caching, BYOK for multi-tenant | Arch |
| 3 | SQLite write contention | Low | Medium | WAL mode, DuckDB for reads | Arch |
| 4 | Governance scope creep | High | Medium | Phased delivery, parked until core stable | PM |
| 5 | PPTX/DOCX generation quality | Medium | Medium | Validate with real org templates | Dev |
| 6 | Multi-tenant data isolation | Low | Critical | Separate SQLite files per tenant | Security |

---

## Milestones

| Milestone | Target | Definition of Done |
|---|---|---|
| **MVP** | Week 5 | Gantt + Subway + Financial import + AI chat working end-to-end |
| **Beta** | Week 8 | Onboarding wizard + data ingestion + governance templates |
| **RC1** | Week 10 | All integrations + codewords + RBAC functional |
| **v1.0** | Week 12 | Full docs + E2E tests + Docker deployment on VPS |
