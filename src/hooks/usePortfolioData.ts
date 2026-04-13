'use client';

// ============================================================
// KOGVANTAGE -- Portfolio Data Hook
// Fetches all portfolio data from tRPC HTTP endpoints and
// transforms raw DB rows into Gantt and Subway view shapes.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GanttProject, GanttTask } from '@/constants/gantt';
import type { SubwayRoute, SubwayLane, SubwayStop, StationType } from '@/constants/subway';
import { DEFAULT_STATION_TYPES } from '@/lib/adapters/subwayAdapter';

// -- Raw DB row types (mirrors SQLite schema) -----------------

interface RawProject {
  id: string;
  title: string;
  description: string;
  status: string;
  start_date: string;   // DD-MM-YYYY
  end_date: string;     // DD-MM-YYYY
  budget_cents: number;
  financial_treatment: string;
  lane: string;
  pm_name: string;
  row_position: number;
  health: number;
  subway_color: string | null;
  subway_sort_order: number;
  created_at: string;
  updated_at: string;
}

interface RawTask {
  id: string;
  project_id: string;
  epic_id: string | null;
  title: string;
  status: string;
  start_date: string;   // DD-MM-YYYY
  end_date: string;     // DD-MM-YYYY
  effort_hours: number;
  assigned_resources: string;
  percent_complete: number;
  subway_station_type: string | null;
  subway_label_top: string | null;
  subway_label_bottom: string | null;
  subway_description: string | null;
  created_at: string;
  updated_at: string;
}

interface RawEpic {
  id: string;
  project_id: string;
  title: string;
  subway_lane_type: 'trunk' | 'sublane';
  subway_merge_date: string | null;
}

interface CoordinatorSummary {
  timesheetRows: number;
  actualsRows: number;
  resources: number;
  unacknowledgedAlerts: number;
}

// -- Public hook return type ----------------------------------

export interface FinancialSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  activeAlerts: number;
}

export interface PortfolioData {
  projects: RawProject[];
  ganttProjects: GanttProject[];
  subwayRoutes: SubwayRoute[];
  stationTypes: StationType[];
  financialSummary: FinancialSummary;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// -- Date helpers ---------------------------------------------

/**
 * Convert DD-MM-YYYY to a JavaScript Date object.
 * Falls back to current date if the string is empty or malformed.
 */
function parseDDMMYYYY(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Try DD-MM-YYYY first
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length <= 2) {
    const [dd, mm, yyyy] = parts;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d;
  }
  // Try ISO / other parseable formats as fallback
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

/**
 * Convert DD-MM-YYYY to YYYY-MM-DD (for Subway stops which use ISO date strings).
 */
function toISODateStr(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length <= 2) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  // Already ISO or other format -- try parsing then formatting
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

// -- tRPC fetch helper ----------------------------------------

/**
 * Fetch from a tRPC HTTP endpoint and unwrap the superjson response.
 *
 * For queries (GET):  /api/trpc/<procedure>
 * Response shape:     [{ result: { data: { json: ... } } }]   (batched)
 *   or non-batched:   { result: { data: { json: ... } } }
 *
 * superjson wraps the payload under `.json` with an optional `.meta` sibling.
 */
async function trpcQuery<T>(procedure: string): Promise<T> {
  const res = await fetch(`/api/trpc/${procedure}`);
  if (!res.ok) {
    throw new Error(`tRPC query "${procedure}" failed: ${res.status} ${res.statusText}`);
  }
  const body = await res.json();

  // httpBatchLink returns an array; httpLink returns an object.
  const envelope = Array.isArray(body) ? body[0] : body;

  if (envelope?.result?.data?.json !== undefined) {
    return envelope.result.data.json as T;
  }
  // Fallback: if superjson wrapper is absent (e.g. plain value)
  if (envelope?.result?.data !== undefined) {
    return envelope.result.data as T;
  }
  throw new Error(`Unexpected tRPC response shape for "${procedure}"`);
}

// -- Data transformation --------------------------------------

function buildGanttProjects(projects: RawProject[], tasks: RawTask[]): GanttProject[] {
  const tasksByProject = new Map<string, RawTask[]>();
  for (const t of tasks) {
    const list = tasksByProject.get(t.project_id) ?? [];
    list.push(t);
    tasksByProject.set(t.project_id, list);
  }

  return projects.map((p) => {
    const projectTasks = tasksByProject.get(p.id) ?? [];
    const ganttTasks: GanttTask[] = projectTasks.map((t, idx) => ({
      id: t.id,
      projectId: p.id,
      name: t.title,
      startDate: parseDDMMYYYY(t.start_date),
      endDate: parseDDMMYYYY(t.end_date),
      percentComplete: t.percent_complete,
      dependencies: idx > 0 ? [projectTasks[idx - 1].id] : [],
    }));

    return {
      id: p.id,
      name: p.title,
      status: p.status,
      startDate: parseDDMMYYYY(p.start_date),
      endDate: parseDDMMYYYY(p.end_date),
      budget: p.budget_cents,
      spent: 0, // Actual spend comes from finance ledger; 0 until wired
      health: p.health,
      tasks: ganttTasks,
    };
  });
}

/**
 * Build SubwayRoute[] from projects, tasks, and (optionally) epics.
 *
 * Model mapping:
 *   Project  -> SubwayRoute  (uses subway_color, title)
 *   Epic     -> SubwayLane   (uses subway_lane_type, subway_merge_date, title)
 *   Task     -> SubwayStop   (uses subway_station_type, subway_label_top/bottom, subway_description)
 *
 * When no epics exist for a project, a single "trunk" lane is synthesised
 * from the project itself, and all tasks are placed on it.
 */
function buildSubwayRoutes(
  projects: RawProject[],
  tasks: RawTask[],
  epics: RawEpic[],
): SubwayRoute[] {
  // Index tasks by project and by epic
  const tasksByProject = new Map<string, RawTask[]>();
  const tasksByEpic = new Map<string, RawTask[]>();

  for (const t of tasks) {
    // Only include tasks that have subway metadata
    const list = tasksByProject.get(t.project_id) ?? [];
    list.push(t);
    tasksByProject.set(t.project_id, list);

    if (t.epic_id) {
      const epicList = tasksByEpic.get(t.epic_id) ?? [];
      epicList.push(t);
      tasksByEpic.set(t.epic_id, epicList);
    }
  }

  // Index epics by project
  const epicsByProject = new Map<string, RawEpic[]>();
  for (const e of epics) {
    const list = epicsByProject.get(e.project_id) ?? [];
    list.push(e);
    epicsByProject.set(e.project_id, list);
  }

  // Default colour palette when project has no subway_color
  const defaultColors = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899',
    '#ef4444', '#10b981', '#64748b', '#f59e0b',
  ];

  return projects.map((p, pIdx) => {
    const projectEpics = epicsByProject.get(p.id) ?? [];
    const color = p.subway_color ?? defaultColors[pIdx % defaultColors.length];

    let lanes: SubwayLane[];

    if (projectEpics.length > 0) {
      // Build lanes from epics
      lanes = projectEpics.map((epic) => {
        const epicTasks = tasksByEpic.get(epic.id) ?? [];
        const stops: SubwayStop[] = epicTasks
          .filter((t) => t.subway_station_type)
          .map((t) => ({
            id: t.id,
            startDate: toISODateStr(t.start_date),
            endDate: t.end_date ? toISODateStr(t.end_date) : null,
            type: t.subway_station_type ?? 'majorMilestone',
            labelTop: t.subway_label_top ?? t.title,
            labelBottom: t.subway_label_bottom ?? undefined,
            description: t.subway_description ?? undefined,
            status: t.status,
          }));

        return {
          id: epic.id,
          type: epic.subway_lane_type ?? 'trunk',
          mergeDate: epic.subway_merge_date ? toISODateStr(epic.subway_merge_date) : null,
          label: epic.title,
          stops,
        };
      });
    } else {
      // No epics -- synthesise a single trunk lane from the project
      const projectTasks = tasksByProject.get(p.id) ?? [];
      const stops: SubwayStop[] = projectTasks
        .filter((t) => t.subway_station_type)
        .map((t) => ({
          id: t.id,
          startDate: toISODateStr(t.start_date),
          endDate: t.end_date ? toISODateStr(t.end_date) : null,
          type: t.subway_station_type ?? 'majorMilestone',
          labelTop: t.subway_label_top ?? t.title,
          labelBottom: t.subway_label_bottom ?? undefined,
          description: t.subway_description ?? undefined,
          status: t.status,
        }));

      lanes = [
        {
          id: `${p.id}-trunk`,
          type: 'trunk' as const,
          mergeDate: null,
          label: p.title,
          stops,
        },
      ];
    }

    return {
      id: p.id,
      categoryLabel: p.title,
      color,
      lanes,
    };
  });
}

function buildFinancialSummary(
  projects: RawProject[],
  coordSummary: CoordinatorSummary | null,
): FinancialSummary {
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget_cents ?? 0), 0);

  return {
    totalBudget,
    totalSpent: 0, // Will be populated once finance ledger is wired
    remaining: totalBudget,
    activeAlerts: coordSummary?.unacknowledgedAlerts ?? 0,
  };
}

// -- Hook -----------------------------------------------------

export function usePortfolioData(): PortfolioData {
  const [projects, setProjects] = useState<RawProject[]>([]);
  const [ganttProjects, setGanttProjects] = useState<GanttProject[]>([]);
  const [subwayRoutes, setSubwayRoutes] = useState<SubwayRoute[]>([]);
  const [stationTypes] = useState<StationType[]>(DEFAULT_STATION_TYPES);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    activeAlerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard against state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fire all queries in parallel
      const [rawProjects, rawTasks, coordSummary] = await Promise.all([
        trpcQuery<RawProject[]>('projects.list'),
        trpcQuery<RawTask[]>('tasks.list'),
        trpcQuery<CoordinatorSummary>('coordinator.summary').catch(() => null),
      ]);

      if (!mountedRef.current) return;

      // Epics are not yet exposed via tRPC -- pass empty array.
      // When an epics router is added, add a fourth parallel query here.
      const rawEpics: RawEpic[] = [];

      setProjects(rawProjects);
      setGanttProjects(buildGanttProjects(rawProjects, rawTasks));
      setSubwayRoutes(buildSubwayRoutes(rawProjects, rawTasks, rawEpics));
      setFinancialSummary(buildFinancialSummary(rawProjects, coordSummary));
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load portfolio data';
      setError(message);
      console.error('[usePortfolioData]', message, err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    projects,
    ganttProjects,
    subwayRoutes,
    stationTypes,
    financialSummary,
    isLoading,
    error,
    refresh: fetchData,
  };
}
