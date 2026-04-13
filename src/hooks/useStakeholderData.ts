'use client';

// ============================================================
// KOGVANTAGE -- Stakeholder Dashboard Data Hook
// Fetches portfolio snapshot from tRPC and polls every 30s.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PortfolioSnapshot } from '@/server/services/reports/ReportDataService';

// -- tRPC fetch helper (same pattern as usePortfolioData) ------

async function trpcQuery<T>(procedure: string): Promise<T> {
  const res = await fetch(`/api/trpc/${procedure}`);
  if (!res.ok) {
    throw new Error(`tRPC query "${procedure}" failed: ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  const envelope = Array.isArray(body) ? body[0] : body;

  if (envelope?.result?.data?.json !== undefined) {
    return envelope.result.data.json as T;
  }
  if (envelope?.result?.data !== undefined) {
    return envelope.result.data as T;
  }
  throw new Error(`Unexpected tRPC response shape for "${procedure}"`);
}

// -- Hook return type ------------------------------------------

export interface StakeholderData {
  snapshot: PortfolioSnapshot | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

// -- Poll interval ---------------------------------------------

const POLL_INTERVAL_MS = 30_000;

// -- Hook ------------------------------------------------------

export function useStakeholderData(): StakeholderData {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await trpcQuery<PortfolioSnapshot>('reports.getSnapshot');
      if (!mountedRef.current) return;
      setSnapshot(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load stakeholder data';
      setError(message);
      console.error('[useStakeholderData]', message, err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchData();

    intervalRef.current = setInterval(() => {
      if (mountedRef.current) fetchData();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return {
    snapshot,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchData,
  };
}
