# Kogvantage — AI-Powered Portfolio Intelligence Platform

## Project Overview
Kogvantage is a Next.js 15 web application that unifies portfolio roadmap management with multi-view visualization (Gantt + Subway Map), financial coordination, governance, and AI-powered data ingestion.

## Tech Stack
- **Framework**: Next.js 15 (App Router, React 19, TypeScript 5.9)
- **Database**: SQLite (better-sqlite3) for CRUD + DuckDB for analytics
- **AI**: Claude Sonnet via @anthropic-ai/sdk
- **Auth**: Auth.js (NextAuth v5) with RBAC (6 roles)
- **State**: Zustand (client) + tRPC (server)
- **Styling**: Tailwind CSS 4 + CSS variables (dark/light/system themes)
- **Deployment**: Docker + Caddy on VPS

## Key Architecture Decisions
- **Data Model**: Projects = Subway Routes, Epics = Lanes, Tasks = Stops. Both views read the same SQLite tables with nullable subway-specific columns.
- **Adapter Pattern**: `ganttAdapter.ts` and `subwayAdapter.ts` transform the same data store into view-specific shapes.
- **IPC → tRPC**: Financial coordinator services from the Electron-Roadmap predecessor are converted from IPC handlers to tRPC procedures.
- **Codeword System**: AES-256-GCM encrypted real values with role-based display filtering.
- **Universal Data Ingestion**: AI-powered "Drop a Pack" workflow that auto-detects file types, maps columns, and identifies data gaps.

## Directory Structure
- `src/app/` — Next.js App Router pages
- `src/server/` — Server-side: database, tRPC, services, types
- `src/components/` — React components (Layout, Gantt, Subway, AI, Modules, etc.)
- `src/hooks/` — Custom React hooks
- `src/lib/` — Utilities, adapters, auth config
- `templates/` — CSV import templates
- `tests/` — Test fixtures, unit, integration, e2e
- `docs/` — Documentation (9 files)

## Date Format
All dates use DD-MM-YYYY (NZ standard). ISO format used only for SQLite datetime() defaults.

## Currency
NZD. Budget stored in cents (integer). Display converts to dollars.

## Testing
Run `npm test` for Vitest unit tests. Run `npm run test:e2e` for Playwright.
