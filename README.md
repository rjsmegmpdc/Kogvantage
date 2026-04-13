# Kogvantage

**AI-powered portfolio intelligence platform with multi-view roadmaps, financial coordination, and governance.**

Kogvantage unifies project roadmap visualization, financial tracking, governance oversight, and AI-powered analytics into a single web application. Built with Next.js 15, React 19, and Claude AI.

---

## Features

### Multi-View Roadmap
Switch between two visualization modes of the same portfolio data:

- **Gantt View** — Custom SVG timeline with 5 zoom levels (Day to Year), drag-and-drop task management, resize handles, Bezier dependency curves, and progress indicators
- **Subway Map View** — Metro-style visualization with routes, lanes, stations (6 marker shapes), sublane merge paths, multi-level hover dimming, and interactive legend filtering

### Financial Coordinator
- Import SAP timesheets (CATS), actuals (FI), labour rates, and resources from CSV
- P&L dashboard with Budget / Forecast / Actual / Variance by workstream
- Variance detection engine (commitment, effort, cost, schedule) with severity alerts
- CAPEX/OPEX tracking and resource capacity planning

### AI Assistant (Claude Sonnet)
- Portfolio analysis chat with project context
- WBS generation from plain-text descriptions
- Variance narrative — AI explains alerts in plain English
- Budget forecasting from burn rate trends
- Stakeholder report drafting
- Natural language data querying

### Security
- RBAC with 6 roles (Admin, Portfolio Manager, Project Manager, Financial Controller, Stakeholder, Viewer)
- Codeword system — encrypted name/date/financial masking per role
- AES-256-GCM encryption for sensitive values
- Date shifting for confidential timelines

### Cowork Integration
8 SKILL.md files for Claude Code automation:
- Universal data pack ingestion
- Timesheet, actuals, labour rate, resource imports
- Portfolio analysis and WBS generation
- Governance template processing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript 5.9, Tailwind CSS 4 |
| Database | SQLite (OLTP) + DuckDB (OLAP analytics) |
| AI | Claude Sonnet via @anthropic-ai/sdk |
| Auth | Auth.js (NextAuth v5) |
| API | tRPC 11 (type-safe) |
| State | Zustand + React Query |
| Deployment | Docker + Caddy on VPS |

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Install & Run
```bash
git clone https://github.com/rjsmegmpdc/Kogvantage.git
cd Kogvantage
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables
Create a `.env.local` file:
```env
ANTHROPIC_API_KEY=your-claude-api-key
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
DATA_DIR=./data
```

---

## Project Structure

```
Kogvantage/
├── .claude/skills/          # 8 Cowork automation skills
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/trpc/        # tRPC API handler
│   │   └── page.tsx         # Main dashboard
│   ├── components/
│   │   ├── Gantt/           # GanttView, TaskBars, TimelineHeader, DependencyLines
│   │   ├── Subway/          # SubwayView, SubwayCanvas, StationMarker, modals, legend
│   │   ├── AI/              # AssistantPanel (Claude chat)
│   │   └── Financial/       # CoordinatorDashboard, DataImport, VarianceAlerts
│   ├── server/
│   │   ├── db/sqlite.ts     # SQLite schema (25 tables)
│   │   ├── trpc/            # Type-safe API routes
│   │   ├── services/
│   │   │   ├── ai/          # ClaudeService
│   │   │   └── coordinator/ # Financial import services
│   │   └── types/           # Core, RBAC, codeword types
│   ├── lib/adapters/        # Gantt + Subway data adapters
│   ├── constants/           # Gantt zoom config, Subway layout config
│   └── styles/              # Tailwind + CSS variables (dark/light/system)
├── templates/               # 13 CSV import templates
├── tests/fixtures/          # Sample projects, resources, tasks
├── docs/                    # PRD, Implementation Plan
└── docker/                  # Dockerfile, docker-compose, Caddyfile
```

---

## Database Schema

25 tables organized by domain:

| Domain | Tables |
|---|---|
| **Core** | projects, epics, tasks, features, dependencies, station_types |
| **Calendar** | calendar_years, calendar_months, public_holidays |
| **Financial** | raw_timesheets, raw_actuals, raw_labour_rates, financial_resources, resource_commitments, feature_allocations, financial_workstreams, project_financial_detail, variance_thresholds, variance_alerts, finance_ledger_entries |
| **Integration** | ado_config, integration_configs |
| **Security** | users, codewords |
| **Governance** | governance_templates |
| **System** | app_settings, audit_events |

---

## Docker Deployment

```bash
cd docker
cp ../.env.local .env
docker-compose up -d
```

Caddy auto-provisions HTTPS. Update `Caddyfile` with your domain:
```
kogvantage.yourdomain.com {
  reverse_proxy app:3000
}
```

**VPS Requirements:** 2+ vCPU, 4+ GB RAM, 40+ GB SSD

---

## Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run format       # Prettier
npm run typecheck    # TypeScript validation
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed sample data
```

---

## Origin

Kogvantage was created by consolidating three existing projects:

1. **Electron-Roadmap** — Enterprise financial coordinator, ADO integration, SQLite data layer
2. **Gemini-Roadmap** — AI-powered Gantt visualization, stakeholder reporting
3. **Subway-Roadmap** — Metro-style interactive roadmap visualization

The best features from each were unified into a single platform with a shared data model, modern Next.js architecture, and Claude AI integration.

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| Scaffold + Data Layer | Done | Next.js 15, SQLite, types, Docker |
| Gantt View | Done | 4 SVG components, zoom/drag/dependencies |
| Subway View | Done | 7 components, shapes/lanes/merge paths |
| Financial Coordinator | Done | 5 import services, dashboard, alerts |
| AI Integration | Done | Claude chat, WBS gen, variance analysis |
| Onboarding Wizard | Planned | 8-step guided setup |
| Universal Data Ingestion | Planned | AI-powered "drop anything" import |
| Governance Templates | Planned | Org template analysis + report gen |
| Codeword System UI | Planned | Sensitive data protection interface |
| API Integrations | Planned | ADO, Jira, ServiceNow connectors |
| Documentation + Tests | Planned | 9 doc files, E2E tests, CI/CD |

---

## License

Private — All rights reserved.

---

## Author

**RJ Harkness** — [@rjsmegmpdc](https://github.com/rjsmegmpdc)

Built with [Claude Code](https://claude.ai/claude-code)
