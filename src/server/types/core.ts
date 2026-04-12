// ============================================================
// KOGVANTAGE — Unified Core Types
// Merges: Electron-Roadmap + Gemini-Roadmap + Subway-Roadmap
// ============================================================

// --- View Modes ---
export enum ViewMode {
  Gantt = 'GANTT',
  Subway = 'SUBWAY',
  Coordinator = 'COORDINATOR',
  Resources = 'RESOURCES',
  Governance = 'GOVERNANCE',
  Reporting = 'REPORTING',
  Settings = 'SETTINGS',
}

// --- Zoom Levels (Gantt) ---
export enum ZoomLevel {
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Quarter = 'Quarter',
  Year = 'Year',
}

// --- Project ---
export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'blocked' | 'done' | 'archived';
  start_date: string;           // DD-MM-YYYY
  end_date: string;             // DD-MM-YYYY
  budget_cents: number;         // NZD in cents
  financial_treatment: 'CAPEX' | 'OPEX' | 'MIXED';
  lane: string;                 // Category (e.g., "EUC", "Security")
  pm_name: string;
  row_position: number;
  health: number;               // 0-100 (from Gemini-Roadmap)
  // Subway view metadata
  subway_color: string | null;  // Hex color for route (e.g., "#3b82f6")
  subway_sort_order: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

// --- Epic (= Subway Lane) ---
export interface Epic {
  id: string;
  project_id: string;
  title: string;
  description: string;
  state: 'New' | 'Active' | 'Resolved' | 'Closed';
  effort: number;
  business_value: number;
  time_criticality: number;
  start_date: string;
  end_date: string;
  assigned_to: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  sizing: 'XS' | 'S' | 'M' | 'L' | 'XL';
  area_path: string;
  iteration_path: string;
  tags: string;                 // Semicolon-separated
  // Subway lane metadata
  subway_lane_type: 'trunk' | 'sublane';
  subway_merge_date: string | null;  // When sublane merges back to trunk
  // Timestamps
  created_at: string;
  updated_at: string;
}

// --- Task (= Subway Stop/Station) ---
export interface Task {
  id: string;
  project_id: string;
  epic_id: string | null;
  title: string;
  status: 'planned' | 'in-progress' | 'blocked' | 'done';
  start_date: string;
  end_date: string;
  effort_hours: number;
  assigned_resources: string;   // JSON array of resource IDs
  percent_complete: number;     // 0-100 (from Gemini-Roadmap)
  // Subway station metadata
  subway_station_type: string | null;  // References station_types.id
  subway_label_top: string | null;
  subway_label_bottom: string | null;
  subway_description: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

// --- Feature (child of Epic) ---
export interface Feature {
  id: string;
  epic_id: string;
  title: string;
  description: string;
  state: 'New' | 'Active' | 'Resolved' | 'Closed';
  effort: number;
  business_value: number;
  assigned_to: string;
  tags: string;
  area_path: string;
  iteration_path: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// --- Dependency ---
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface Dependency {
  id: string;
  source_type: 'project' | 'task' | 'epic' | 'feature';
  source_id: string;
  target_type: 'project' | 'task' | 'epic' | 'feature';
  target_id: string;
  dependency_type: DependencyType;
  lag_days: number;
  notes: string;
  created_at: string;
}

// --- Station Type (Subway shapes) ---
export interface StationType {
  id: string;
  label: string;
  shape: 'Circle' | 'SmallCircle' | 'Diamond' | 'Square' | 'Person' | 'Star';
  sort_order: number;
  is_active: boolean;
}

// --- App Settings ---
export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  language: string;
  date_format: string;          // 'DD-MM-YYYY' (NZ default)
  fiscal_year_start: string;    // '01-07' (July, NZ default)
  default_zoom: ZoomLevel;
  default_view: ViewMode;
  currency: string;             // 'NZD'
  org_name: string;
  org_logo_path: string | null;
  org_colors: string;           // JSON array of hex colors
  auto_save: boolean;
  onboarding_complete: boolean;
  onboarding_step: number;      // Resume-safe
}

// --- AI Chat ---
export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

// --- Audit Event ---
export interface AuditEvent {
  id: string;
  timestamp: string;
  user_id: string;
  action_type: string;
  module: string;
  entity_type: string;
  entity_id: string;
  details: string;              // JSON
}
