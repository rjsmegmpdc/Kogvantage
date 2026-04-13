'use client';

// ============================================================
// KOGVANTAGE -- Stakeholder Dashboard
// Main dashboard layout combining KPI cards, 6 charts,
// AI query bar, action bar, and AI insights panel.
// ============================================================

import { useState, useMemo } from 'react';
import {
  RefreshCw,
  Maximize2,
  GitCompareArrows,
  FileText,
  ChevronDown,
  Search,
  Send,
} from 'lucide-react';
import { useStakeholderData } from '@/hooks/useStakeholderData';
import KPICards from './KPICards';
import HealthGauge from './Charts/HealthGauge';
import BudgetVsActuals from './Charts/BudgetVsActuals';
import BurnRateTrend from './Charts/BurnRateTrend';
import StatusDistribution from './Charts/StatusDistribution';
import ResourceUtilization from './Charts/ResourceUtilization';
import AlertsTimeline from './Charts/AlertsTimeline';
import AIInsightsPanel from './AIInsightsPanel';

// -- Helpers ---------------------------------------------------

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-NZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Generate last N months labels (e.g. "Nov", "Dec", "Jan") */
function lastNMonths(n: number): string[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(months[d.getMonth()]);
  }
  return result;
}

// -- Loading skeleton ------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--color-surface-raised)', opacity: 0.6 }} />
        </div>
      </div>

      {/* KPI skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-72 rounded-xl"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
        ))}
      </div>
    </div>
  );
}

// -- Error state -----------------------------------------------

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12">
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full"
        style={{ backgroundColor: 'var(--color-danger)15', color: 'var(--color-danger)' }}
      >
        <FileText size={28} />
      </div>
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--color-text)' }}
      >
        Failed to Load Dashboard
      </h2>
      <p
        className="text-sm text-center max-w-md"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {message}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
        }}
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

// -- Main component --------------------------------------------

interface StakeholderDashboardProps {
  onPresent?: () => void;
  onCompare?: () => void;
  onGenerateReport?: (type: string) => void;
}

export default function StakeholderDashboard({
  onPresent,
  onCompare,
  onGenerateReport,
}: StakeholderDashboardProps = {}) {
  const { snapshot, isLoading, error, lastUpdated, refresh } = useStakeholderData();
  const [aiQuery, setAiQuery] = useState('');
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  // -- Derived chart data from snapshot -------------------------

  const budgetVsActualsData = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.projects.map((p) => ({
      name: p.title,
      budget: p.budgetDollars,
      actuals: 0, // Actuals per project not in snapshot yet; will be wired
    }));
  }, [snapshot]);

  const statusDistributionData = useMemo(() => {
    if (!snapshot) return [];
    return Object.entries(snapshot.byStatus).map(([status, count]) => ({
      status,
      count,
    }));
  }, [snapshot]);

  const resourceUtilizationData = useMemo(() => {
    if (!snapshot) return [];
    const entries = Object.entries(snapshot.byContractType);
    if (entries.length === 0) {
      return [
        { type: 'FTE', allocated: 0, available: 0 },
        { type: 'SOW', allocated: 0, available: 0 },
        { type: 'External', allocated: 0, available: 0 },
      ];
    }
    return entries.map(([type, count]) => ({
      type,
      allocated: count,
      available: Math.max(0, Math.ceil(count * 0.2)), // Estimate 20% capacity buffer
    }));
  }, [snapshot]);

  const burnRateData = useMemo(() => {
    const months = lastNMonths(8);
    if (!snapshot || snapshot.burnRate === 0) {
      // Placeholder data when no real burn data
      return months.map((month) => ({ month, amount: 0 }));
    }
    // Simulate variance around the average burn rate
    const base = snapshot.burnRate;
    return months.map((month, i) => ({
      month,
      amount: Math.round(base * (0.8 + (i % 3) * 0.15)),
    }));
  }, [snapshot]);

  const alertsTimelineData = useMemo(() => {
    const months = lastNMonths(8);
    if (!snapshot) {
      return months.map((month) => ({
        month,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      }));
    }
    const sev = snapshot.alertsBySeverity;
    // Distribute current alerts across recent months as a simple visualization
    return months.map((month, i) => {
      const recency = (i + 1) / months.length;
      return {
        month,
        critical: Math.round((sev['critical'] ?? 0) * recency),
        high: Math.round((sev['high'] ?? 0) * recency),
        medium: Math.round((sev['medium'] ?? 0) * recency),
        low: Math.round((sev['low'] ?? 0) * recency),
      };
    });
  }, [snapshot]);

  // -- Handlers -------------------------------------------------

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    // AI query handling will be wired to ai.chat in a future iteration
    console.log('[StakeholderDashboard] AI query:', aiQuery);
    setAiQuery('');
  };

  const handlePresent = () => {
    if (onPresent) {
      onPresent();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  // -- Render ---------------------------------------------------

  if (isLoading && !snapshot) return <DashboardSkeleton />;
  if (error && !snapshot) return <DashboardError message={error} onRetry={refresh} />;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            Portfolio Dashboard
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {lastUpdated
              ? `Last updated ${formatTime(lastUpdated)}`
              : 'Loading...'}
            {isLoading && ' (refreshing...)'}
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handlePresent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Maximize2 size={13} />
            Present
          </button>
          <button
            onClick={() => onCompare?.()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            <GitCompareArrows size={13} />
            Compare
          </button>

          {/* Generate Report dropdown */}
          <div className="relative">
            <button
              onClick={() => setReportMenuOpen(!reportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
              }}
            >
              <FileText size={13} />
              Generate Report
              <ChevronDown size={12} />
            </button>

            {reportMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setReportMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-full mt-1 w-48 rounded-lg py-1 z-20"
                  style={{
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {[
                    { label: 'Weekly Report (DOCX)', procedure: 'reports.generateWeekly' },
                    { label: 'Monthly Report (DOCX)', procedure: 'reports.generateMonthly' },
                    { label: 'Executive Deck (PPTX)', procedure: 'reports.generateExecutive' },
                  ].map((item) => (
                    <button
                      key={item.procedure}
                      onClick={() => {
                        setReportMenuOpen(false);
                        if (onGenerateReport) {
                          onGenerateReport(item.procedure);
                        } else {
                          console.log('[StakeholderDashboard] Generate:', item.procedure);
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[var(--color-surface-overlay)]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Query bar */}
      <form
        onSubmit={handleAiSubmit}
        className="flex items-center gap-2"
      >
        <div
          className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Ask AI about your portfolio... (e.g. 'Which projects are at risk?')"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text)' }}
          />
        </div>
        <button
          type="submit"
          disabled={!aiQuery.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors"
          style={{
            backgroundColor: aiQuery.trim() ? 'var(--color-primary)' : 'var(--color-surface)',
            color: aiQuery.trim() ? '#fff' : 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            opacity: aiQuery.trim() ? 1 : 0.5,
          }}
        >
          <Send size={14} />
        </button>
      </form>

      {/* KPI Cards */}
      <KPICards
        totalProjects={snapshot?.totalProjects ?? 0}
        avgHealth={snapshot?.averageHealth ?? 0}
        totalBudget={snapshot?.totalBudget ?? 0}
        burnRate={snapshot?.burnRate ?? 0}
        activeAlerts={snapshot?.activeAlerts.length ?? 0}
        totalResources={snapshot?.totalResources ?? 0}
      />

      {/* Charts grid: 2 columns x 3 rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Row 1 */}
        <HealthGauge health={snapshot?.averageHealth ?? 0} />
        <StatusDistribution data={statusDistributionData} />

        {/* Row 2 */}
        <BudgetVsActuals projects={budgetVsActualsData} />
        <BurnRateTrend data={burnRateData} />

        {/* Row 3 */}
        <ResourceUtilization data={resourceUtilizationData} />
        <AlertsTimeline data={alertsTimelineData} />
      </div>

      {/* AI Insights Panel */}
      <AIInsightsPanel />
    </div>
  );
}
