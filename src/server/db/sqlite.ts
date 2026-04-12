// ============================================================
// KOGVANTAGE — SQLite Database Connection & Schema
// Hybrid: SQLite (OLTP) + DuckDB (OLAP analytics sidecar)
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'kogvantage.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    // Performance pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 3000');
    db.pragma('synchronous = NORMAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database): void {
  const version = db.pragma('user_version', { simple: true }) as number;

  if (version < 1) {
    db.exec(SCHEMA_V1);
    db.pragma('user_version = 1');
  }
  // Future migrations: if (version < 2) { ... }
}

// ============================================================
// Schema V1 — Unified schema merging all 3 projects
// ============================================================
const SCHEMA_V1 = `
-- =====================
-- CORE TABLES
-- =====================

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','in-progress','blocked','done','archived')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  budget_cents INTEGER DEFAULT 0,
  financial_treatment TEXT DEFAULT 'OPEX' CHECK(financial_treatment IN ('CAPEX','OPEX','MIXED')),
  lane TEXT DEFAULT '',
  pm_name TEXT DEFAULT '',
  row_position INTEGER DEFAULT 0,
  health INTEGER DEFAULT 50 CHECK(health >= 0 AND health <= 100),
  subway_color TEXT DEFAULT NULL,
  subway_sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS epics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  state TEXT DEFAULT 'New' CHECK(state IN ('New','Active','Resolved','Closed')),
  effort REAL DEFAULT 0,
  business_value REAL DEFAULT 0,
  time_criticality REAL DEFAULT 0,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  assigned_to TEXT DEFAULT '',
  risk_level TEXT DEFAULT 'Low' CHECK(risk_level IN ('Low','Medium','High','Critical')),
  sizing TEXT DEFAULT 'M' CHECK(sizing IN ('XS','S','M','L','XL')),
  area_path TEXT DEFAULT '',
  iteration_path TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  subway_lane_type TEXT DEFAULT 'trunk' CHECK(subway_lane_type IN ('trunk','sublane')),
  subway_merge_date TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  epic_id TEXT DEFAULT NULL REFERENCES epics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'planned' CHECK(status IN ('planned','in-progress','blocked','done')),
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  effort_hours REAL DEFAULT 0,
  assigned_resources TEXT DEFAULT '[]',
  percent_complete INTEGER DEFAULT 0 CHECK(percent_complete >= 0 AND percent_complete <= 100),
  subway_station_type TEXT DEFAULT NULL,
  subway_label_top TEXT DEFAULT NULL,
  subway_label_bottom TEXT DEFAULT NULL,
  subway_description TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  epic_id TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  state TEXT DEFAULT 'New' CHECK(state IN ('New','Active','Resolved','Closed')),
  effort REAL DEFAULT 0,
  business_value REAL DEFAULT 0,
  assigned_to TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  area_path TEXT DEFAULT '',
  iteration_path TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dependencies (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK(source_type IN ('project','task','epic','feature')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('project','task','epic','feature')),
  target_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'FS' CHECK(dependency_type IN ('FS','SS','FF','SF')),
  lag_days INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================
-- SUBWAY VIEW
-- =====================

CREATE TABLE IF NOT EXISTS station_types (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  shape TEXT NOT NULL CHECK(shape IN ('Circle','SmallCircle','Diamond','Square','Person','Star')),
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- Seed 6 default station types
INSERT OR IGNORE INTO station_types (id, label, shape, sort_order, is_active) VALUES
  ('majorMilestone', 'Major Milestone', 'Circle', 1, 1),
  ('minorMilestone', 'Minor Milestone', 'SmallCircle', 2, 1),
  ('issueResolution', 'Resolution', 'Diamond', 3, 1),
  ('workEnvironment', 'Environment', 'Square', 4, 1),
  ('humanEvent', 'Team', 'Person', 5, 1),
  ('companyEvent', 'Company', 'Star', 6, 1);

-- =====================
-- CALENDAR
-- =====================

CREATE TABLE IF NOT EXISTS calendar_years (
  year INTEGER PRIMARY KEY,
  total_working_days INTEGER DEFAULT 0,
  total_weekend_days INTEGER DEFAULT 0,
  total_holidays INTEGER DEFAULT 0,
  work_hours_per_day REAL DEFAULT 8.0
);

CREATE TABLE IF NOT EXISTS calendar_months (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
  working_days INTEGER DEFAULT 0,
  weekend_days INTEGER DEFAULT 0,
  public_holidays INTEGER DEFAULT 0,
  work_hours REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public_holidays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  is_recurring INTEGER DEFAULT 0,
  recurrence_type TEXT DEFAULT NULL
);

-- =====================
-- FINANCIAL COORDINATOR
-- =====================

CREATE TABLE IF NOT EXISTS raw_timesheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stream TEXT,
  month TEXT,
  name TEXT,
  personnel_number TEXT,
  date TEXT,
  activity_type TEXT,
  wbse TEXT,
  hours REAL,
  processed INTEGER DEFAULT 0,
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS raw_actuals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT,
  posting_date TEXT,
  cost_element TEXT,
  wbs_element TEXT,
  value_nzd REAL,
  personnel_number TEXT DEFAULT '0',
  category TEXT DEFAULT 'labour',
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS raw_labour_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  band TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  fiscal_year TEXT NOT NULL,
  hourly_rate REAL DEFAULT 0,
  daily_rate REAL DEFAULT 0,
  uplift_amount REAL DEFAULT 0,
  uplift_percent REAL DEFAULT 0,
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS financial_resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  work_area TEXT DEFAULT '',
  activity_type_cap TEXT DEFAULT '',
  activity_type_opx TEXT DEFAULT '',
  contract_type TEXT DEFAULT 'FTE' CHECK(contract_type IN ('FTE','SOW','External Squad')),
  employee_id TEXT DEFAULT '',
  ado_identity_id TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resource_commitments (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES financial_resources(id),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  commitment_type TEXT DEFAULT 'per-day' CHECK(commitment_type IN ('per-day','per-week','per-fortnight')),
  committed_hours REAL DEFAULT 0,
  total_available_hours REAL DEFAULT 0,
  allocated_hours REAL DEFAULT 0,
  remaining_capacity REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feature_allocations (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES financial_resources(id),
  feature_id TEXT DEFAULT NULL,
  epic_id TEXT DEFAULT NULL,
  project_id TEXT DEFAULT NULL,
  allocated_hours REAL DEFAULT 0,
  forecast_start TEXT DEFAULT '',
  forecast_end TEXT DEFAULT '',
  actual_hours REAL DEFAULT 0,
  actual_cost REAL DEFAULT 0,
  variance_hours REAL DEFAULT 0,
  variance_cost REAL DEFAULT 0,
  status TEXT DEFAULT 'on-track' CHECK(status IN ('on-track','at-risk','over','under')),
  source TEXT DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS financial_workstreams (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  workstream_name TEXT NOT NULL,
  wbse TEXT DEFAULT '',
  wbse_desc TEXT DEFAULT '',
  sme_resource_id TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS project_financial_detail (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  sentinel_number TEXT DEFAULT '',
  delivery_goal TEXT DEFAULT '',
  wbse TEXT DEFAULT '',
  auc_number TEXT DEFAULT '',
  final_asset TEXT DEFAULT '',
  sap_code TEXT DEFAULT '',
  io_code TEXT DEFAULT '',
  original_budget REAL DEFAULT 0,
  forecast_budget REAL DEFAULT 0,
  actual_cost REAL DEFAULT 0,
  variance REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS variance_thresholds (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('resource','project','feature','epic','global')),
  entity_id TEXT DEFAULT NULL,
  hours_variance_percent REAL DEFAULT 10,
  cost_variance_percent REAL DEFAULT 10,
  schedule_variance_days INTEGER DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS variance_alerts (
  id TEXT PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK(alert_type IN ('commitment','effort','cost','schedule','unauthorized')),
  severity TEXT DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT DEFAULT '{}',
  variance_amount REAL DEFAULT 0,
  variance_percent REAL DEFAULT 0,
  acknowledged INTEGER DEFAULT 0,
  acknowledged_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS finance_ledger_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  workstream_id TEXT DEFAULT NULL,
  wbse TEXT DEFAULT '',
  period_month INTEGER,
  period_year INTEGER,
  fiscal_year TEXT DEFAULT '',
  budget_type TEXT DEFAULT 'CAPEX' CHECK(budget_type IN ('CAPEX','OPEX')),
  expenditure_type TEXT DEFAULT '',
  forecast_amount REAL DEFAULT 0,
  actual_amount REAL DEFAULT 0,
  variance_amount REAL DEFAULT 0,
  source_type TEXT DEFAULT '',
  source_ids TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================
-- ADO INTEGRATION
-- =====================

CREATE TABLE IF NOT EXISTS ado_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  org_url TEXT DEFAULT '',
  project_name TEXT DEFAULT '',
  auth_mode TEXT DEFAULT 'pat' CHECK(auth_mode IN ('pat','oauth2')),
  pat_token_encrypted TEXT DEFAULT '',
  pat_token_expiry TEXT DEFAULT '',
  webhook_secret TEXT DEFAULT '',
  is_connected INTEGER DEFAULT 0,
  last_sync TEXT DEFAULT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO ado_config (id) VALUES (1);

-- =====================
-- SECURITY: USERS & CODEWORDS
-- =====================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('admin','portfolio_manager','project_manager','financial_controller','stakeholder','viewer')),
  password_hash TEXT NOT NULL,
  assigned_project_ids TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  last_login TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS codewords (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK(category IN ('project','person','date','financial','location','custom')),
  real_value_encrypted TEXT NOT NULL,
  codeword TEXT NOT NULL,
  applies_to_roles TEXT NOT NULL DEFAULT '["admin","portfolio_manager"]',
  date_shift_days INTEGER DEFAULT 0,
  financial_mask_type TEXT DEFAULT 'exact' CHECK(financial_mask_type IN ('exact','range','percentage','hidden')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================
-- GOVERNANCE TEMPLATES
-- =====================

CREATE TABLE IF NOT EXISTS governance_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('status_report','gate_review','steering_committee','executive_brief')),
  format TEXT NOT NULL CHECK(format IN ('pptx','docx','xlsx')),
  color_palette TEXT DEFAULT '[]',
  font_primary TEXT DEFAULT 'Calibri',
  font_heading TEXT DEFAULT 'Calibri',
  language_style TEXT DEFAULT 'formal' CHECK(language_style IN ('formal','semi-formal','concise')),
  section_structure TEXT DEFAULT '[]',
  tone_examples TEXT DEFAULT '[]',
  logo_path TEXT DEFAULT NULL,
  original_file_path TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================
-- APP SETTINGS
-- =====================

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('theme', 'dark'),
  ('language', 'en'),
  ('date_format', 'DD-MM-YYYY'),
  ('fiscal_year_start', '01-07'),
  ('default_zoom', 'Month'),
  ('default_view', 'GANTT'),
  ('currency', 'NZD'),
  ('org_name', ''),
  ('org_colors', '[]'),
  ('auto_save', 'true'),
  ('onboarding_complete', 'false'),
  ('onboarding_step', '0');

-- =====================
-- AUDIT LOG
-- =====================

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  user_id TEXT DEFAULT '',
  action_type TEXT NOT NULL,
  module TEXT DEFAULT '',
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  details TEXT DEFAULT '{}',
  route TEXT DEFAULT '',
  source TEXT DEFAULT ''
);

-- =====================
-- INTEGRATION CONFIGS
-- =====================

CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  base_url TEXT DEFAULT '',
  auth_type TEXT DEFAULT 'token' CHECK(auth_type IN ('token','oauth2','basic','none')),
  auth_token_encrypted TEXT DEFAULT '',
  field_mapping TEXT DEFAULT '{}',
  sync_schedule TEXT DEFAULT 'manual' CHECK(sync_schedule IN ('manual','daily','weekly')),
  is_active INTEGER DEFAULT 0,
  last_sync TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_epics_project ON epics(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_epic ON tasks(epic_id);
CREATE INDEX IF NOT EXISTS idx_features_epic ON features(epic_id);
CREATE INDEX IF NOT EXISTS idx_deps_source ON dependencies(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_deps_target ON dependencies(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON raw_timesheets(date);
CREATE INDEX IF NOT EXISTS idx_actuals_date ON raw_actuals(posting_date);
CREATE INDEX IF NOT EXISTS idx_allocations_resource ON feature_allocations(resource_id);
CREATE INDEX IF NOT EXISTS idx_allocations_feature ON feature_allocations(feature_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON variance_alerts(severity, acknowledged);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_codewords_category ON codewords(category, is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_ledger_project ON finance_ledger_entries(project_id, period_year, period_month);
`;

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
