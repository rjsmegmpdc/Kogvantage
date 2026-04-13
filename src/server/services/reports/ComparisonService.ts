// ============================================================
// KOGVANTAGE -- Comparison Service
// Compares two portfolio snapshots to produce deltas
// Server-side only -- no 'use client'
// ============================================================

import { getDb } from '@/server/db/sqlite';
import { getSnapshot, type PortfolioSnapshot } from './ReportDataService';

// =====================
// Types
// =====================

export interface ComparisonResult {
  oldLabel: string;
  newLabel: string;
  oldDate: string;
  newDate: string;
  newProjects: { title: string; status: string; budget: number }[];
  removedProjects: { title: string; status: string; budget: number }[];
  projectChanges: {
    title: string;
    field: string;
    oldValue: string | number;
    newValue: string | number;
    delta?: number;
    direction: 'improved' | 'declined' | 'changed';
  }[];
  financialDelta: {
    budgetChange: number;
    actualsChange: number;
    varianceChange: number;
    burnRateChange: number;
  };
  alertsDelta: {
    newAlerts: number;
    resolvedAlerts: number;
    totalChange: number;
  };
  resourceDelta: {
    added: number;
    removed: number;
    totalChange: number;
  };
}

interface StoredSnapshot {
  id: string;
  label: string;
  created_at: string;
  data: string; // JSON-serialized PortfolioSnapshot
}

// =====================
// Helpers
// =====================

function determineDirection(
  field: string,
  oldVal: number,
  newVal: number
): 'improved' | 'declined' | 'changed' {
  if (field === 'health') {
    return newVal > oldVal ? 'improved' : newVal < oldVal ? 'declined' : 'changed';
  }
  if (field === 'budget') {
    // Budget increase is neutral/changed; staying on budget is improved
    return newVal <= oldVal ? 'improved' : 'changed';
  }
  if (field === 'status') {
    return 'changed';
  }
  return 'changed';
}

const STATUS_ORDER: Record<string, number> = {
  completed: 0,
  active: 1,
  'on-track': 1,
  'at-risk': 2,
  behind: 3,
  paused: 4,
  cancelled: 5,
};

function statusDirection(oldStatus: string, newStatus: string): 'improved' | 'declined' | 'changed' {
  const oldRank = STATUS_ORDER[oldStatus.toLowerCase()] ?? 3;
  const newRank = STATUS_ORDER[newStatus.toLowerCase()] ?? 3;
  if (newRank < oldRank) return 'improved';
  if (newRank > oldRank) return 'declined';
  return 'changed';
}

// =====================
// Core comparison logic
// =====================

export function compareSnapshots(
  oldSnap: PortfolioSnapshot,
  newSnap: PortfolioSnapshot,
  oldLabel = 'Previous',
  newLabel = 'Current'
): ComparisonResult {
  // Index projects by title
  const oldByTitle = new Map(oldSnap.projects.map((p) => [p.title, p]));
  const newByTitle = new Map(newSnap.projects.map((p) => [p.title, p]));

  // New projects (in new but not in old)
  const newProjects = newSnap.projects
    .filter((p) => !oldByTitle.has(p.title))
    .map((p) => ({ title: p.title, status: p.status, budget: p.budgetDollars }));

  // Removed projects (in old but not in new)
  const removedProjects = oldSnap.projects
    .filter((p) => !newByTitle.has(p.title))
    .map((p) => ({ title: p.title, status: p.status, budget: p.budgetDollars }));

  // Per-project field changes
  const projectChanges: ComparisonResult['projectChanges'] = [];

  for (const [title, oldProject] of oldByTitle) {
    const newProject = newByTitle.get(title);
    if (!newProject) continue; // removed project, already handled

    // Health change
    if (oldProject.health !== newProject.health) {
      projectChanges.push({
        title,
        field: 'health',
        oldValue: oldProject.health,
        newValue: newProject.health,
        delta: newProject.health - oldProject.health,
        direction: determineDirection('health', oldProject.health, newProject.health),
      });
    }

    // Budget change
    if (oldProject.budgetDollars !== newProject.budgetDollars) {
      projectChanges.push({
        title,
        field: 'budget',
        oldValue: oldProject.budgetDollars,
        newValue: newProject.budgetDollars,
        delta: newProject.budgetDollars - oldProject.budgetDollars,
        direction: determineDirection(
          'budget',
          oldProject.budgetDollars,
          newProject.budgetDollars
        ),
      });
    }

    // Status change
    if (oldProject.status !== newProject.status) {
      projectChanges.push({
        title,
        field: 'status',
        oldValue: oldProject.status,
        newValue: newProject.status,
        direction: statusDirection(oldProject.status, newProject.status),
      });
    }
  }

  // Financial deltas
  const financialDelta = {
    budgetChange: newSnap.totalBudget - oldSnap.totalBudget,
    actualsChange: newSnap.totalActuals - oldSnap.totalActuals,
    varianceChange: newSnap.totalVariance - oldSnap.totalVariance,
    burnRateChange: newSnap.burnRate - oldSnap.burnRate,
  };

  // Alert deltas
  const oldAlertIds = new Set(oldSnap.activeAlerts.map((a) => a.id));
  const newAlertIds = new Set(newSnap.activeAlerts.map((a) => a.id));

  const newAlertCount = newSnap.activeAlerts.filter((a) => !oldAlertIds.has(a.id)).length;
  const resolvedAlertCount = oldSnap.activeAlerts.filter((a) => !newAlertIds.has(a.id)).length;

  const alertsDelta = {
    newAlerts: newAlertCount,
    resolvedAlerts: resolvedAlertCount,
    totalChange: newSnap.activeAlerts.length - oldSnap.activeAlerts.length,
  };

  // Resource deltas
  const resourceDelta = {
    added: Math.max(0, newSnap.totalResources - oldSnap.totalResources),
    removed: Math.max(0, oldSnap.totalResources - newSnap.totalResources),
    totalChange: newSnap.totalResources - oldSnap.totalResources,
  };

  return {
    oldLabel,
    newLabel,
    oldDate: oldSnap.generatedAt,
    newDate: newSnap.generatedAt,
    newProjects,
    removedProjects,
    projectChanges,
    financialDelta,
    alertsDelta,
    resourceDelta,
  };
}

// =====================
// Compare stored snapshot with current state
// =====================

export function compareWithCurrent(oldSnapshotId: string): ComparisonResult {
  const db = getDb();

  const row = db
    .prepare(`SELECT id, label, created_at, data FROM portfolio_snapshots WHERE id = ?`)
    .get(oldSnapshotId) as StoredSnapshot | undefined;

  if (!row) {
    throw new Error(`Snapshot not found: ${oldSnapshotId}`);
  }

  const oldSnap: PortfolioSnapshot = JSON.parse(row.data);
  const currentSnap = getSnapshot();

  return compareSnapshots(oldSnap, currentSnap, row.label, 'Current');
}
