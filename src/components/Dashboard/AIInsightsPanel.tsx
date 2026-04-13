'use client';

// ============================================================
// KOGVANTAGE -- AI Insights Panel
// Displays 3-5 AI-generated observations about the portfolio.
// Fetches from the AI tRPC endpoint on mount with refresh.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Lightbulb,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';

// -- Types -----------------------------------------------------

export interface AIInsightsPanelProps {
  insights?: string[];
}

// -- Insight icons (rotate through for visual variety) ----------

const INSIGHT_ICONS = [
  <Lightbulb key="0" size={16} />,
  <TrendingUp key="1" size={16} />,
  <AlertTriangle key="2" size={16} />,
  <Shield key="3" size={16} />,
  <Zap key="4" size={16} />,
];

const INSIGHT_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
];

// -- Skeleton loader -------------------------------------------

function InsightSkeleton() {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-lg animate-pulse"
      style={{ backgroundColor: 'var(--color-surface-raised)' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex-shrink-0"
        style={{ backgroundColor: 'var(--color-surface-overlay)', opacity: 0.4 }}
      />
      <div className="flex-1 space-y-2">
        <div
          className="h-3 rounded w-3/4"
          style={{ backgroundColor: 'var(--color-surface-overlay)', opacity: 0.4 }}
        />
        <div
          className="h-3 rounded w-1/2"
          style={{ backgroundColor: 'var(--color-surface-overlay)', opacity: 0.3 }}
        />
      </div>
    </div>
  );
}

// -- Main component --------------------------------------------

export default function AIInsightsPanel({ insights: propInsights }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<string[]>(propInsights ?? []);
  const [isLoading, setIsLoading] = useState(!propInsights);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/trpc/ai.analyzePortfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            query:
              'Provide 4 concise, actionable observations about the portfolio. Each observation should be 1-2 sentences. Cover: budget health, project risks, resource utilization, and timeline adherence. Return only the observations as a JSON array of strings.',
          },
        }),
      });

      if (!res.ok) throw new Error(`AI request failed: ${res.status}`);

      const body = await res.json();
      const envelope = Array.isArray(body) ? body[0] : body;
      const result =
        envelope?.result?.data?.json ?? envelope?.result?.data ?? null;

      if (!mountedRef.current) return;

      if (result?.success && result.response) {
        // Try parsing JSON array from AI response
        try {
          const parsed = JSON.parse(result.response);
          if (Array.isArray(parsed)) {
            setInsights(parsed.slice(0, 5));
            return;
          }
        } catch {
          // Not JSON -- split by newlines
        }

        // Fallback: split response into individual insights
        const lines = result.response
          .split('\n')
          .map((l: string) => l.replace(/^\d+\.\s*/, '').trim())
          .filter((l: string) => l.length > 10);
        setInsights(lines.slice(0, 5));
      } else {
        throw new Error('No insights returned');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Failed to generate insights';
      setError(msg);
      console.error('[AIInsightsPanel]', msg, err);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  // Fetch on mount if no prop insights
  useEffect(() => {
    if (!propInsights || propInsights.length === 0) {
      fetchInsights();
    }
  }, [propInsights, fetchInsights]);

  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-xl"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} style={{ color: 'var(--color-warning)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            AI Insights
          </h3>
        </div>
        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <RefreshCw
            size={12}
            className={isLoading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <InsightSkeleton />
          <InsightSkeleton />
          <InsightSkeleton />
        </div>
      ) : error ? (
        <div
          className="flex items-center gap-3 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            color: 'var(--color-text-muted)',
          }}
        >
          <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
          <div className="flex-1">
            <p className="text-xs">
              AI insights are temporarily unavailable. Configure your Anthropic API key
              to enable this feature.
            </p>
          </div>
        </div>
      ) : insights.length === 0 ? (
        <div
          className="text-center py-6"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <p className="text-xs">No insights available. Add projects to generate portfolio analysis.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: `${INSIGHT_COLORS[idx % INSIGHT_COLORS.length]}15`,
                  color: INSIGHT_COLORS[idx % INSIGHT_COLORS.length],
                }}
              >
                {INSIGHT_ICONS[idx % INSIGHT_ICONS.length]}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {insight}
                </p>
                <button
                  className="flex items-center gap-1 mt-2 text-[10px] font-medium transition-colors hover:opacity-80"
                  style={{ color: INSIGHT_COLORS[idx % INSIGHT_COLORS.length] }}
                >
                  Learn more
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
