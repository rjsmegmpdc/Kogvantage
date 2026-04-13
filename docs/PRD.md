# Kogvantage — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 13 April 2026
**Author:** RJ Harkness
**Status:** Active Development

---

## 1. Product Overview

### 1.1 Vision
Kogvantage is an AI-powered portfolio intelligence platform that unifies roadmap visualization, financial coordination, governance, and stakeholder reporting into a single web application. It replaces fragmented spreadsheet-based portfolio management with a modern, multi-view platform that leverages Claude AI for data ingestion, analysis, and report generation.

### 1.2 Problem Statement
Portfolio managers and PMOs currently juggle multiple disconnected tools:
- Gantt charts in MS Project or Smartsheet
- Financial tracking in SAP/Excel
- Governance checklists in SharePoint
- Status reports in PowerPoint
- Resource planning in spreadsheets
- Work items in Azure DevOps or Jira

This fragmentation causes data staleness, reporting overhead, missed variances, and lack of real-time portfolio visibility.

### 1.3 Solution
A single platform that:
- Displays the same portfolio data in multiple visual formats (Gantt + Subway Map)
- Automates financial data ingestion from any source (SAP, CSV, images, PDFs)
- Uses Claude AI to analyze portfolios, generate reports, and explain variances
- Enforces governance through templates, stage gates, and compliance tracking
- Protects sensitive data with codewords, RBAC, and financial masking

### 1.4 Target Users
| Role | Primary Use Case |
|---|---|
| Portfolio Manager | Full portfolio oversight, financial health, governance |
| Project Manager | Individual project roadmap, task management, WBS |
| Financial Controller | Budget vs actuals, variance detection, P&L |
| Stakeholder / Executive | Read-only dashboards, codeword-filtered reports |
| PMO Administrator | System setup, RBAC, integrations, templates |

---

## 2. Product Architecture

### 2.1 Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript 5.9 |
| Backend | Next.js API routes, tRPC 11 (type-safe RPC) |
| Primary DB | SQLite (better-sqlite3) — OLTP, 25+ tables |
| Analytics DB | DuckDB — columnar OLAP sidecar for financial queries |
| AI | Claude Sonnet via @anthropic-ai/sdk |
| Auth | Auth.js (NextAuth v5) with 6 RBAC roles |
| State | Zustand (client) + React Query (server cache) |
| Styling | Tailwind CSS 4 + CSS custom properties (dark/light/system) |
| Deployment | Docker + Caddy on VPS (HTTPS auto-provisioned) |

### 2.2 Data Model — The Core Insight
Both visualization modes read the same underlying data:

| Subway Concept | Database Entity | Gantt Equivalent |
|---|---|---|
| Route (category) | `projects` table | Project bar |
| Lane (trunk/sublane) | `epics` table | Epic grouping |
| Stop (station) | `tasks` table | Task bar |

Subway-specific metadata (color, station type, merge date) is stored as nullable columns, ignored by the Gantt view. Gantt-specific fields (percent_complete, effort_hours) are ignored by the Subway view.

---

## 3. Feature Requirements

### 3.1 Multi-View Roadmap Visualization

#### 3.1.1 Gantt View
- Custom SVG-based Gantt chart (no third-party library)
- 5 zoom levels: Day (40px/day), Week (10px), Month (2px), Quarter (0.5px), Year (0.1px)
- Drag-and-drop task movement with day-level snapping
- Resize task bars from left or right edges
- Dependency rendering with Bezier curves (4 types: FS, SS, FF, SF)
- Today line indicator with auto-scroll
- Right-click canvas panning
- Status color coding: Active (blue), At Risk (red), Completed (green), Planned (gray)
- Progress overlay (percent complete shading)

#### 3.1.2 Subway Map View
- Metro/transit metaphor with routes, lanes, and station markers
- 6 station marker shapes: Circle, SmallCircle, Diamond, Square, Person, Star
- Trunk lanes (straight) and sublanes with cubic Bezier merge paths
- Multi-level hover dimming: route level, lane level, station level
- Duration bars for events with start and end dates
- Interactive legend with type filtering
- Drag-to-scroll navigation
- Dark/light/system theme with computed color palette
- Station CRUD via modals (edit, add)
- Route and station type management via settings

#### 3.1.3 View Switcher
- Toggle button in header switches between Gantt and Subway
- Both views show identical underlying data
- Edits in one view immediately reflect in the other

### 3.2 Financial Coordinator

#### 3.2.1 Data Import Services
- **Timesheet Import** — SAP CATS format (Stream, Month, Name, Personnel Number, Date, Activity Type, WBSE, Hours)
- **Actuals Import** — SAP FI format with auto-categorization (Labour/Software/Hardware/Contractor)
- **Labour Rates Import** — Band-based rates (N1-N6 + External) with hourly/daily validation
- **Resource Import** — UPSERT by employee_id with contract type validation (FTE/SOW/External Squad)

#### 3.2.2 Financial Dashboard
- Summary cards: Total Budget, Total Spent, Remaining, Active Alerts
- Health indicator with progress bar
- Quick navigation to Import, Resources, P&L, Alerts
- Recent alerts preview

#### 3.2.3 Variance Detection
- 4 alert types: Commitment, Effort, Cost, Schedule
- 4 severity levels: Critical, High, Medium, Low
- Configurable thresholds per entity
- Acknowledge workflow
- AI-powered explanation ("Explain with AI" button)

#### 3.2.4 P&L Dashboard
- Budget/Forecast/Actual/Variance by workstream
- Month-based filtering
- Currency: NZD (stored in cents, displayed in dollars)
- CAPEX/OPEX breakdown

### 3.3 AI Integration (Claude Sonnet)

#### 3.3.1 Portfolio Assistant (Chat)
- Right sidebar chat panel with Claude Sonnet badge
- Portfolio context auto-injected from SQLite
- Quick action buttons: Analyze risks, Draft report, Check compliance, Budget forecast
- Multi-turn conversation with history
- Demo mode fallback when API key not configured

#### 3.3.2 AI Capabilities (16 Touch Points)
| # | Feature | Category |
|---|---|---|
| 1 | Smart CSV Import (auto-detect columns) | Data Ingestion |
| 2 | Data Validation & Cleansing | Data Ingestion |
| 3 | Intelligent Categorization | Data Ingestion |
| 4 | Natural Language Import | Data Ingestion |
| 5 | WBS Generation from description | Planning |
| 6 | Dependency Suggestion | Planning |
| 7 | Effort Estimation | Planning |
| 8 | Schedule Optimization | Planning |
| 9 | Variance Narrative | Financial |
| 10 | Budget Forecasting | Financial |
| 11 | Rate Anomaly Detection | Financial |
| 12 | P&L Summary Generation | Financial |
| 13 | Portfolio Health Analysis | Reporting |
| 14 | Stakeholder Report Drafting | Reporting |
| 15 | Governance Compliance Check | Reporting |
| 16 | Natural Language Querying | Reporting |

### 3.4 Universal Data Ingestion Engine

#### 3.4.1 "Drop a Pack" Workflow
1. User provides a data pack (folder, ZIP, or individual files)
2. AI reads all files (CSV, XLSX, JSON, PDF, images)
3. AI identifies data types and maps columns to schema (fuzzy matching)
4. AI reports what's found AND what's missing (gap analysis)
5. Data normalized: dates, currencies, names deduplicated
6. Valid data imported, ambiguous data queued for review

#### 3.4.2 Image & Document Scraping
- Claude Vision extracts tables from dashboard screenshots
- PDF table extraction for financial reports
- Whiteboard photo → structured data conversion

### 3.5 Governance

#### 3.5.1 Template System
- Upload organizational report templates (PPTX, DOCX, XLSX)
- AI extracts: colors, fonts, language style, section structure, tone
- Stored as TemplateProfile
- Future reports generated matching the org's visual identity

#### 3.5.2 Stage Gates & Compliance
- Gate definitions with criteria checklists
- Project progression tracking (not-started → in-review → passed/failed)
- Policy compliance monitoring
- Decision logging

### 3.6 Security

#### 3.6.1 RBAC (Role-Based Access Control)
| Role | Projects | Financials | Governance | Settings | AI Context |
|---|---|---|---|---|---|
| Admin | All | Full | Full | Full | Full |
| Portfolio Manager | All | Full | Full | — | Full |
| Project Manager | Own only | Own project | View | — | Own project |
| Financial Controller | All | Full | — | — | Financial |
| Stakeholder | Codeworded | Masked | View | — | Filtered |
| Viewer | Codeworded | Hidden | — | — | Filtered |

#### 3.6.2 Codeword System
- Category-based codewords: project, person, date, financial, location, custom
- Real values encrypted at rest (AES-256-GCM)
- Display filter applied to all UI components
- Date shifting: ±N days for sensitive timelines
- Financial masking: exact, range, percentage, or hidden
- "See as [Role]" preview for admins

### 3.7 Integrations (API & MCP)
| Source | Method | Data Provided |
|---|---|---|
| Azure DevOps | REST API | Work items, sprints, boards |
| Jira | REST API / MCP | Issues, epics, sprints |
| ServiceNow | REST API | Incidents, changes |
| Google Calendar | MCP | Team availability |
| Gmail | MCP | Stakeholder communications |
| SAP | OData / CSV | Timesheets, actuals, cost centers |
| GitHub | REST / CLI | Repos, PRs, issues |

### 3.8 Onboarding Wizard (8 Steps)
1. Welcome & Role Setup
2. Organization Profile (name, logo, colors, currency, fiscal year)
3. Connect Your Data Sources
4. Import Initial Data (Drop a Pack)
5. Upload Governance Templates
6. Configure Security (Codewords, RBAC)
7. Choose Default View (Gantt vs Subway)
8. Meet Your AI Assistant

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load < 2 seconds
- Gantt render < 500ms for 100 projects
- SQLite queries < 100ms for dashboard aggregations
- DuckDB analytics < 1 second for P&L calculations

### 4.2 Data
- Date format: DD-MM-YYYY (NZ standard)
- Currency: NZD (stored as integer cents)
- Financial treatment: CAPEX / OPEX / MIXED
- Activity types: N1-N6_CAP/OPX bands

### 4.3 Deployment
- VPS: 2-4 vCPU, 4-8GB RAM, 40-80GB SSD
- Docker containerized with Caddy reverse proxy
- HTTPS auto-provisioned via Let's Encrypt
- Data volumes mounted for SQLite + DuckDB persistence

### 4.4 Monetisation Path
- Phase 1: Personal use (single-tenant)
- Phase 2: Multi-tenant SaaS with Stripe billing
- Architecture designed for easy tenant isolation (SQLite per tenant)

---

## 5. Success Metrics

| Metric | Target |
|---|---|
| Portfolio visibility | Single source of truth for all projects |
| Reporting time | 80% reduction (AI-generated reports) |
| Data ingestion | < 5 minutes from raw CSV to dashboard |
| Variance detection | Real-time alerts vs monthly manual review |
| Stakeholder access | Self-service filtered views (no manual report creation) |

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Claude API costs at scale | High AI usage costs | Per-query caching, BYOK option for tenants |
| SQLite concurrency limits | Write contention under load | WAL mode, DuckDB for read-heavy analytics |
| Subway decomposition bugs | SVG rendering regression | Snapshot testing comparing output |
| Governance module complexity | Scope creep | Phased delivery, parked until core stable |
| Multi-tenant data isolation | Security breach | Separate SQLite files per tenant, encrypted at rest |
