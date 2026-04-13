// ============================================================
// KOGVANTAGE -- Report Data Service
// Queries SQLite to gather all data needed for report generation
// Server-side only -- no 'use client'
// ============================================================

import { getDb } from '@/server/db/sqlite';

// =====================
// Types
// =====================

export interface PortfolioSnapshot {
  generatedAt: string;
  orgName: string;

  // Project summary
  projects: ProjectSummary[];
  totalProjects: number;
  byStatus: Record<string, number>;
  averageHealth: number;

  // Financial summary
  totalBudget: number; // NZD dollars (not cents)
  totalActuals: number;
  totalVariance: number;
  burnRate: number; // avg monthly spend

  // Resource summary
  totalResources: number;
  byContractType: Record<string, number>;

  // Alerts
  activeAlerts: AlertSummary[];
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;

  // Recent activity
  recentTimesheetHours: number;
  recentTimesheetPeriod: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  health: number;
  budgetDollars: number;
  lane: string;
  startDate: string;
  endDate: string;
  taskCount: number;
  epicCount: number;
}

export interface AlertSummary {
  id: string;
  type: string;
  severity: string;
  message: string;
  variancePercent: number;
  createdAt: string;
}

export interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  health: number;
  budgetDollars: number;
  financialTreatment: string;
  lane: string;
  pmName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;

  epics: Array<{
    id: string;
    title: string;
    state: string;
    riskLevel: string;
    sizing: string;
    effort: number;
    businessValue: number;
    featureCount: number;
  }>;

  tasks: Array<{
    id: string;
    title: string;
    status: string;
    effortHours: number;
    percentComplete: number;
    epicId: string | null;
  }>;

  financialDetail: {
    sentinelNumber: string;
    originalBudget: number;
    forecastBudget: number;
    actualCost: number;
    variance: number;
  } | null;

  ledgerEntries: Array<{
    periodMonth: number;
    periodYear: number;
    budgetType: string;
    forecastAmount: number;
    actualAmount: number;
    varianceAmount: number;
  }>;

  alerts: AlertSummary[];

  allocations: Array<{
    resourceName: string;
    allocatedHours: number;
    actualHours: number;
    varianceHours: number;
    status: string;
  }>;
}

// =====================
// Service
// =====================

export function getSnapshot(): PortfolioSnapshot {
  const db = getDb();

  // Org name from settings
  const orgRow = db
    .prepare(`SELECT value FROM app_settings WHERE key = 'org_name'`)
    .get() as { value: string } | undefined;
  const orgName = orgRow?.value || 'Kogvantage';

  // Projects with task and epic counts
  const projects = db
    .prepare(
      `SELECT
        p.id,
        p.title,
        p.status,
        p.health,
        p.budget_cents,
        p.lane,
        p.start_date,
        p.end_date,
        COALESCE(tc.task_count, 0) AS task_count,
        COALESCE(ec.epic_count, 0) AS epic_count
      FROM projects p
      LEFT JOIN (
        SELECT project_id, COUNT(*) AS task_count
        FROM tasks
        GROUP BY project_id
      ) tc ON tc.project_id = p.id
      LEFT JOIN (
        SELECT project_id, COUNT(*) AS epic_count
        FROM epics
        GROUP BY project_id
      ) ec ON ec.project_id = p.id
      WHERE p.status != 'archived'
      ORDER BY p.title`
    )
    .all() as Array<{
    id: string;
    title: string;
    status: string;
    health: number;
    budget_cents: number;
    lane: string;
    start_date: string;
    end_date: string;
    task_count: number;
    epic_count: number;
  }>;

  const projectSummaries: ProjectSummary[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    health: p.health,
    budgetDollars: p.budget_cents / 100,
    lane: p.lane || '',
    startDate: p.start_date,
    endDate: p.end_date,
    taskCount: p.task_count,
    epicCount: p.epic_count,
  }));

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const p of projectSummaries) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  }

  // Average health
  const averageHealth =
    projectSummaries.length > 0
      ? Math.round(
          projectSummaries.reduce((sum, p) => sum + p.health, 0) / projectSummaries.length
        )
      : 0;

  // Financial summary from project_financial_detail
  const financials = db
    .prepare(
      `SELECT
        COALESCE(SUM(original_budget), 0) AS total_budget,
        COALESCE(SUM(actual_cost), 0) AS total_actuals,
        COALESCE(SUM(variance), 0) AS total_variance
      FROM project_financial_detail`
    )
    .get() as { total_budget: number; total_actuals: number; total_variance: number };

  // If no financial detail rows, fall back to project budget_cents
  let totalBudget = financials.total_budget;
  let totalActuals = financials.total_actuals;
  let totalVariance = financials.total_variance;

  if (totalBudget === 0 && projectSummaries.length > 0) {
    totalBudget = projectSummaries.reduce((sum, p) => sum + p.budgetDollars, 0);
  }

  // Burn rate: average monthly actuals from ledger
  const burnRateRow = db
    .prepare(
      `SELECT
        COALESCE(SUM(actual_amount), 0) AS total,
        COUNT(DISTINCT period_year || '-' || period_month) AS months
      FROM finance_ledger_entries
      WHERE actual_amount > 0`
    )
    .get() as { total: number; months: number };
  const burnRate = burnRateRow.months > 0 ? burnRateRow.total / burnRateRow.months : 0;

  // Resources
  const resourceStats = db
    .prepare(
      `SELECT
        COUNT(*) AS total,
        contract_type
      FROM financial_resources
      GROUP BY contract_type`
    )
    .all() as Array<{ total: number; contract_type: string }>;

  let totalResources = 0;
  const byContractType: Record<string, number> = {};
  for (const r of resourceStats) {
    totalResources += r.total;
    byContractType[r.contract_type] = r.total;
  }

  // Alerts (unacknowledged)
  const alertRows = db
    .prepare(
      `SELECT id, alert_type, severity, message, variance_percent, created_at
      FROM variance_alerts
      WHERE acknowledged = 0
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC`
    )
    .all() as Array<{
    id: string;
    alert_type: string;
    severity: string;
    message: string;
    variance_percent: number;
    created_at: string;
  }>;

  const activeAlerts: AlertSummary[] = alertRows.map((a) => ({
    id: a.id,
    type: a.alert_type,
    severity: a.severity,
    message: a.message,
    variancePercent: a.variance_percent,
    createdAt: a.created_at,
  }));

  const alertsByType: Record<string, number> = {};
  const alertsBySeverity: Record<string, number> = {};
  for (const a of activeAlerts) {
    alertsByType[a.type] = (alertsByType[a.type] || 0) + 1;
    alertsBySeverity[a.severity] = (alertsBySeverity[a.severity] || 0) + 1;
  }

  // Recent timesheet hours (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const timesheetRow = db
    .prepare(
      `SELECT COALESCE(SUM(hours), 0) AS total_hours
      FROM raw_timesheets
      WHERE date >= ?`
    )
    .get(thirtyDaysAgoStr) as { total_hours: number };

  return {
    generatedAt: new Date().toISOString(),
    orgName,
    projects: projectSummaries,
    totalProjects: projectSummaries.length,
    byStatus,
    averageHealth,
    totalBudget,
    totalActuals,
    totalVariance,
    burnRate: Math.round(burnRate * 100) / 100,
    totalResources,
    byContractType,
    activeAlerts,
    alertsByType,
    alertsBySeverity,
    recentTimesheetHours: Math.round(timesheetRow.total_hours * 100) / 100,
    recentTimesheetPeriod: 'Last 30 days',
  };
}

export function getProjectDetails(projectId: string): ProjectDetail | null {
  const db = getDb();

  // Base project
  const project = db
    .prepare(
      `SELECT id, title, description, status, health, budget_cents, financial_treatment,
              lane, pm_name, start_date, end_date, created_at, updated_at
       FROM projects WHERE id = ?`
    )
    .get(projectId) as
    | {
        id: string;
        title: string;
        description: string;
        status: string;
        health: number;
        budget_cents: number;
        financial_treatment: string;
        lane: string;
        pm_name: string;
        start_date: string;
        end_date: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!project) return null;

  // Epics with feature counts
  const epics = db
    .prepare(
      `SELECT
        e.id, e.title, e.state, e.risk_level, e.sizing, e.effort, e.business_value,
        COALESCE(fc.feature_count, 0) AS feature_count
      FROM epics e
      LEFT JOIN (
        SELECT epic_id, COUNT(*) AS feature_count
        FROM features
        GROUP BY epic_id
      ) fc ON fc.epic_id = e.id
      WHERE e.project_id = ?
      ORDER BY e.title`
    )
    .all(projectId) as Array<{
    id: string;
    title: string;
    state: string;
    risk_level: string;
    sizing: string;
    effort: number;
    business_value: number;
    feature_count: number;
  }>;

  // Tasks
  const tasks = db
    .prepare(
      `SELECT id, title, status, effort_hours, percent_complete, epic_id
       FROM tasks WHERE project_id = ? ORDER BY title`
    )
    .all(projectId) as Array<{
    id: string;
    title: string;
    status: string;
    effort_hours: number;
    percent_complete: number;
    epic_id: string | null;
  }>;

  // Financial detail
  const finDetail = db
    .prepare(
      `SELECT sentinel_number, original_budget, forecast_budget, actual_cost, variance
       FROM project_financial_detail WHERE project_id = ?`
    )
    .get(projectId) as
    | {
        sentinel_number: string;
        original_budget: number;
        forecast_budget: number;
        actual_cost: number;
        variance: number;
      }
    | undefined;

  // Ledger entries
  const ledger = db
    .prepare(
      `SELECT period_month, period_year, budget_type, forecast_amount, actual_amount, variance_amount
       FROM finance_ledger_entries
       WHERE project_id = ?
       ORDER BY period_year, period_month`
    )
    .all(projectId) as Array<{
    period_month: number;
    period_year: number;
    budget_type: string;
    forecast_amount: number;
    actual_amount: number;
    variance_amount: number;
  }>;

  // Alerts for this project
  const alerts = db
    .prepare(
      `SELECT id, alert_type, severity, message, variance_percent, created_at
       FROM variance_alerts
       WHERE entity_id = ? AND acknowledged = 0
       ORDER BY severity, created_at DESC`
    )
    .all(projectId) as Array<{
    id: string;
    alert_type: string;
    severity: string;
    message: string;
    variance_percent: number;
    created_at: string;
  }>;

  // Resource allocations
  const allocations = db
    .prepare(
      `SELECT
        fr.name AS resource_name,
        fa.allocated_hours,
        fa.actual_hours,
        fa.variance_hours,
        fa.status
       FROM feature_allocations fa
       JOIN financial_resources fr ON fr.id = fa.resource_id
       WHERE fa.project_id = ?
       ORDER BY fr.name`
    )
    .all(projectId) as Array<{
    resource_name: string;
    allocated_hours: number;
    actual_hours: number;
    variance_hours: number;
    status: string;
  }>;

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    health: project.health,
    budgetDollars: project.budget_cents / 100,
    financialTreatment: project.financial_treatment,
    lane: project.lane || '',
    pmName: project.pm_name || '',
    startDate: project.start_date,
    endDate: project.end_date,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    epics: epics.map((e) => ({
      id: e.id,
      title: e.title,
      state: e.state,
      riskLevel: e.risk_level,
      sizing: e.sizing,
      effort: e.effort,
      businessValue: e.business_value,
      featureCount: e.feature_count,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      effortHours: t.effort_hours,
      percentComplete: t.percent_complete,
      epicId: t.epic_id,
    })),
    financialDetail: finDetail
      ? {
          sentinelNumber: finDetail.sentinel_number,
          originalBudget: finDetail.original_budget,
          forecastBudget: finDetail.forecast_budget,
          actualCost: finDetail.actual_cost,
          variance: finDetail.variance,
        }
      : null,
    ledgerEntries: ledger.map((l) => ({
      periodMonth: l.period_month,
      periodYear: l.period_year,
      budgetType: l.budget_type,
      forecastAmount: l.forecast_amount,
      actualAmount: l.actual_amount,
      varianceAmount: l.variance_amount,
    })),
    alerts: alerts.map((a) => ({
      id: a.id,
      type: a.alert_type,
      severity: a.severity,
      message: a.message,
      variancePercent: a.variance_percent,
      createdAt: a.created_at,
    })),
    allocations: allocations.map((a) => ({
      resourceName: a.resource_name,
      allocatedHours: a.allocated_hours,
      actualHours: a.actual_hours,
      varianceHours: a.variance_hours,
      status: a.status,
    })),
  };
}
