// ============================================================
// KOGVANTAGE — RBAC Types
// ============================================================

export enum UserRole {
  ADMIN = 'admin',
  PORTFOLIO_MANAGER = 'portfolio_manager',
  PROJECT_MANAGER = 'project_manager',
  FINANCIAL_CONTROLLER = 'financial_controller',
  STAKEHOLDER = 'stakeholder',
  VIEWER = 'viewer',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
  assigned_project_ids: string;   // JSON array (for project_manager scope)
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  view_all_projects: boolean;
  view_own_projects: boolean;
  edit_projects: boolean;
  view_financials: boolean;
  edit_financials: boolean;
  view_governance: boolean;
  edit_governance: boolean;
  manage_users: boolean;
  manage_codewords: boolean;
  manage_settings: boolean;
  view_audit_log: boolean;
  use_ai_full_context: boolean;
  export_data: boolean;
  import_data: boolean;
}

// Role → Permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  [UserRole.ADMIN]: {
    view_all_projects: true,
    view_own_projects: true,
    edit_projects: true,
    view_financials: true,
    edit_financials: true,
    view_governance: true,
    edit_governance: true,
    manage_users: true,
    manage_codewords: true,
    manage_settings: true,
    view_audit_log: true,
    use_ai_full_context: true,
    export_data: true,
    import_data: true,
  },
  [UserRole.PORTFOLIO_MANAGER]: {
    view_all_projects: true,
    view_own_projects: true,
    edit_projects: true,
    view_financials: true,
    edit_financials: true,
    view_governance: true,
    edit_governance: true,
    manage_users: false,
    manage_codewords: false,
    manage_settings: false,
    view_audit_log: true,
    use_ai_full_context: true,
    export_data: true,
    import_data: true,
  },
  [UserRole.PROJECT_MANAGER]: {
    view_all_projects: false,
    view_own_projects: true,
    edit_projects: true,
    view_financials: true,
    edit_financials: false,
    view_governance: true,
    edit_governance: false,
    manage_users: false,
    manage_codewords: false,
    manage_settings: false,
    view_audit_log: false,
    use_ai_full_context: false,
    export_data: true,
    import_data: true,
  },
  [UserRole.FINANCIAL_CONTROLLER]: {
    view_all_projects: true,
    view_own_projects: true,
    edit_projects: false,
    view_financials: true,
    edit_financials: true,
    view_governance: false,
    edit_governance: false,
    manage_users: false,
    manage_codewords: false,
    manage_settings: false,
    view_audit_log: false,
    use_ai_full_context: false,
    export_data: true,
    import_data: true,
  },
  [UserRole.STAKEHOLDER]: {
    view_all_projects: true, // codeword-filtered
    view_own_projects: true,
    edit_projects: false,
    view_financials: false, // masked
    edit_financials: false,
    view_governance: true,
    edit_governance: false,
    manage_users: false,
    manage_codewords: false,
    manage_settings: false,
    view_audit_log: false,
    use_ai_full_context: false,
    export_data: false,
    import_data: false,
  },
  [UserRole.VIEWER]: {
    view_all_projects: true, // codeword-filtered
    view_own_projects: true,
    edit_projects: false,
    view_financials: false, // hidden
    edit_financials: false,
    view_governance: false,
    edit_governance: false,
    manage_users: false,
    manage_codewords: false,
    manage_settings: false,
    view_audit_log: false,
    use_ai_full_context: false,
    export_data: false,
    import_data: false,
  },
};
