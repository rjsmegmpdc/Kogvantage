'use client';

// ============================================================
// KOGVANTAGE -- Portfolio Mutations Hook
// Provides mutation functions that POST to tRPC HTTP endpoints.
// Uses the httpBatchLink format with superjson serialisation.
// ============================================================

import { useCallback } from 'react';

// -- tRPC mutation helper -------------------------------------

/**
 * POST to a tRPC mutation endpoint using the httpBatchLink format.
 *
 * Request:
 *   POST /api/trpc/<procedure>
 *   Content-Type: application/json
 *   Body: { "0": { "json": { ...input } } }
 *
 * Response (batched):
 *   [{ "result": { "data": { "json": ... } } }]
 */
async function trpcMutate<TInput, TOutput = unknown>(
  procedure: string,
  input: TInput,
): Promise<TOutput> {
  const res = await fetch(`/api/trpc/${procedure}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ '0': { json: input } }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `tRPC mutation "${procedure}" failed: ${res.status} ${res.statusText}${text ? ` -- ${text}` : ''}`,
    );
  }

  const body = await res.json();

  // httpBatchLink returns an array
  const envelope = Array.isArray(body) ? body[0] : body;

  // Check for tRPC-level errors
  if (envelope?.error) {
    const msg =
      envelope.error?.json?.message ??
      envelope.error?.message ??
      'Unknown tRPC error';
    throw new Error(msg);
  }

  if (envelope?.result?.data?.json !== undefined) {
    return envelope.result.data.json as TOutput;
  }
  if (envelope?.result?.data !== undefined) {
    return envelope.result.data as TOutput;
  }

  return undefined as unknown as TOutput;
}

// -- Public hook return type ----------------------------------

export interface PortfolioMutations {
  updateTask: (
    projectId: string,
    taskId: string,
    updates: Record<string, unknown>,
  ) => Promise<{ id: string; updated: boolean }>;

  createProject: (data: {
    title: string;
    description?: string;
    status?: string;
    start_date: string;
    end_date: string;
    budget_cents?: number;
    financial_treatment?: string;
    subway_color?: string | null;
    subway_sort_order?: number;
    health?: number;
  }) => Promise<{ id: string }>;

  deleteProject: (id: string) => Promise<{ id: string; deleted: boolean }>;

  importCSV: (
    type: 'timesheets' | 'actuals' | 'labour_rates' | 'resources',
    csvContent: string,
    options?: { fiscalYear?: string },
  ) => Promise<{ success: boolean; recordsImported: number; errors: unknown[] }>;

  acknowledgeAlert: (id: string) => Promise<unknown>;

  aiChat: (
    messages: Array<{ role: string; content: string }>,
  ) => Promise<{ success: boolean; response: string }>;
}

// -- Hook -----------------------------------------------------

export function usePortfolioMutations(): PortfolioMutations {
  const updateTask = useCallback(
    async (
      _projectId: string,
      taskId: string,
      updates: Record<string, unknown>,
    ) => {
      return trpcMutate<
        { id: string } & Record<string, unknown>,
        { id: string; updated: boolean }
      >('tasks.update', { id: taskId, ...updates });
    },
    [],
  );

  const createProject = useCallback(
    async (data: {
      title: string;
      description?: string;
      status?: string;
      start_date: string;
      end_date: string;
      budget_cents?: number;
      financial_treatment?: string;
      subway_color?: string | null;
      subway_sort_order?: number;
      health?: number;
    }) => {
      return trpcMutate<typeof data, { id: string }>(
        'projects.create',
        data,
      );
    },
    [],
  );

  const deleteProject = useCallback(async (id: string) => {
    return trpcMutate<{ id: string }, { id: string; deleted: boolean }>(
      'projects.delete',
      { id },
    );
  }, []);

  const importCSV = useCallback(
    async (
      type: 'timesheets' | 'actuals' | 'labour_rates' | 'resources',
      csvContent: string,
      options?: { fiscalYear?: string },
    ) => {
      // Map the type to the correct coordinator procedure name
      const procedureMap: Record<string, string> = {
        timesheets: 'coordinator.importTimesheets',
        actuals: 'coordinator.importActuals',
        labour_rates: 'coordinator.importLabourRates',
        resources: 'coordinator.importResources',
      };

      const procedure = procedureMap[type];
      if (!procedure) {
        throw new Error(`Unknown import type: ${type}`);
      }

      // Labour rates requires a fiscalYear parameter
      const input: Record<string, string> =
        type === 'labour_rates'
          ? { csvContent, fiscalYear: options?.fiscalYear ?? 'FY26' }
          : { csvContent };

      return trpcMutate<
        typeof input,
        { success: boolean; recordsImported: number; errors: unknown[] }
      >(procedure, input);
    },
    [],
  );

  const acknowledgeAlert = useCallback(async (id: string) => {
    return trpcMutate<{ id: string }>('coordinator.acknowledgeAlert', { id });
  }, []);

  const aiChat = useCallback(
    async (messages: Array<{ role: string; content: string }>) => {
      return trpcMutate<
        { messages: Array<{ role: string; content: string }> },
        { success: boolean; response: string }
      >('ai.chat', { messages });
    },
    [],
  );

  return {
    updateTask,
    createProject,
    deleteProject,
    importCSV,
    acknowledgeAlert,
    aiChat,
  };
}
