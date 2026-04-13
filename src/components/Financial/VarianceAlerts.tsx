'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Calendar,
  CheckCircle2,
  Sparkles,
  Loader2,
  Filter,
  Bell,
  BellOff,
  ShieldAlert,
} from 'lucide-react';
import type { VarianceAlert } from '@/server/services/coordinator/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
export type TypeFilter = 'all' | 'commitment' | 'effort' | 'cost' | 'schedule';

export interface VarianceAlertsProps {
  alerts: VarianceAlert[];
  /** Called when user clicks Acknowledge on an alert */
  onAcknowledge?: (alertId: string) => void;
  /** Called when user clicks "Explain with AI" */
  onExplainWithAI?: (alert: VarianceAlert) => Promise<string>;
  /** Whether an AI explanation is loading */
  isExplaining?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<VarianceAlert['severity'], string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#06b6d4',
};

const SEVERITY_ORDER: Record<VarianceAlert['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function typeIcon(type: VarianceAlert['alert_type']) {
  switch (type) {
    case 'commitment':
      return <Users size={16} />;
    case 'effort':
      return <TrendingUp size={16} />;
    case 'cost':
      return <DollarSign size={16} />;
    case 'schedule':
      return <Calendar size={16} />;
    case 'unauthorized':
      return <ShieldAlert size={16} />;
    default:
      return <AlertTriangle size={16} />;
  }
}

function typeLabel(type: VarianceAlert['alert_type']): string {
  switch (type) {
    case 'commitment':
      return 'Commitment';
    case 'effort':
      return 'Effort';
    case 'cost':
      return 'Cost';
    case 'schedule':
      return 'Schedule';
    case 'unauthorized':
      return 'Unauthorized';
    default:
      return type;
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FilterBarProps {
  severity: SeverityFilter;
  type: TypeFilter;
  onSeverityChange: (s: SeverityFilter) => void;
  onTypeChange: (t: TypeFilter) => void;
}

function FilterBar({ severity, type, onSeverityChange, onTypeChange }: FilterBarProps) {
  const severityOptions: SeverityFilter[] = ['all', 'critical', 'high', 'medium', 'low'];
  const typeOptions: TypeFilter[] = ['all', 'commitment', 'effort', 'cost', 'schedule'];

  return (
    <div
      className="flex flex-wrap items-center gap-4 p-4 rounded-xl"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2">
        <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Severity
        </span>
      </div>
      <div
        className="flex gap-1 p-0.5 rounded-lg"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        {severityOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => onSeverityChange(opt)}
            className="px-3 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-100"
            style={{
              backgroundColor:
                severity === opt ? 'var(--color-surface)' : 'transparent',
              color:
                severity === opt
                  ? opt === 'all'
                    ? 'var(--color-text)'
                    : SEVERITY_COLORS[opt as VarianceAlert['severity']]
                  : 'var(--color-text-muted)',
              boxShadow: severity === opt ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      <div
        className="w-px h-5 hidden sm:block"
        style={{ backgroundColor: 'var(--color-border)' }}
      />

      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Type
        </span>
      </div>
      <div
        className="flex gap-1 p-0.5 rounded-lg"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        {typeOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => onTypeChange(opt)}
            className="px-3 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-100"
            style={{
              backgroundColor:
                type === opt ? 'var(--color-surface)' : 'transparent',
              color:
                type === opt
                  ? 'var(--color-text)'
                  : 'var(--color-text-muted)',
              boxShadow: type === opt ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface SummaryStatsProps {
  total: number;
  critical: number;
  unacknowledged: number;
}

function SummaryStats({ total, critical, unacknowledged }: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        {
          label: 'Total Alerts',
          value: total,
          icon: <Bell size={16} />,
          color: 'var(--color-primary-light)',
        },
        {
          label: 'Critical',
          value: critical,
          icon: <AlertTriangle size={16} />,
          color: 'var(--color-danger)',
        },
        {
          label: 'Unacknowledged',
          value: unacknowledged,
          icon: <BellOff size={16} />,
          color: 'var(--color-warning)',
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{
              backgroundColor: `${stat.color}15`,
              color: stat.color,
            }}
          >
            {stat.icon}
          </div>
          <div>
            <span
              className="text-lg font-bold block"
              style={{ color: 'var(--color-text)' }}
            >
              {stat.value}
            </span>
            <span
              className="text-[11px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface AlertCardProps {
  alert: VarianceAlert;
  onAcknowledge?: (id: string) => void;
  onExplainWithAI?: (alert: VarianceAlert) => void;
  isExplaining?: boolean;
  aiExplanation?: string | null;
}

function AlertCard({
  alert,
  onAcknowledge,
  onExplainWithAI,
  isExplaining,
  aiExplanation,
}: AlertCardProps) {
  const severityColor = SEVERITY_COLORS[alert.severity];

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl transition-all duration-150"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${severityColor}`,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 mt-0.5"
            style={{
              backgroundColor: `${severityColor}15`,
              color: severityColor,
            }}
          >
            {typeIcon(alert.alert_type)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Labels row */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                style={{
                  color: severityColor,
                  backgroundColor: `${severityColor}15`,
                }}
              >
                {alert.severity}
              </span>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase"
                style={{
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-surface-raised)',
                }}
              >
                {typeLabel(alert.alert_type)}
              </span>
              {alert.acknowledged && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    color: 'var(--color-success)',
                    backgroundColor: 'var(--color-success)15',
                  }}
                >
                  <CheckCircle2 size={10} />
                  Acknowledged
                </span>
              )}
            </div>

            {/* Message */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {alert.message}
            </p>

            {/* Entity + variance + timestamp */}
            <div
              className="flex flex-wrap items-center gap-3 mt-2 text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span className="font-medium">
                {alert.entity_type}: {alert.entity_id}
              </span>
              {alert.variance_percent != null && (
                <span
                  className="font-mono font-medium"
                  style={{
                    color:
                      Math.abs(alert.variance_percent) > 20
                        ? 'var(--color-danger)'
                        : 'var(--color-warning)',
                  }}
                >
                  {alert.variance_percent > 0 ? '+' : ''}
                  {alert.variance_percent.toFixed(1)}%
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {formatTimestamp(alert.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI explanation */}
      {aiExplanation && (
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs leading-relaxed"
          style={{
            backgroundColor: 'var(--color-primary)08',
            border: '1px solid var(--color-primary)20',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Sparkles
            size={14}
            className="flex-shrink-0 mt-0.5"
            style={{ color: 'var(--color-primary-light)' }}
          />
          <span>{aiExplanation}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge?.(alert.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <CheckCircle2 size={13} />
            Acknowledge
          </button>
        )}
        <button
          onClick={() => onExplainWithAI?.(alert)}
          disabled={isExplaining}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            color: 'var(--color-primary-light)',
            border: '1px solid var(--color-border)',
          }}
        >
          {isExplaining ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Sparkles size={13} />
          )}
          Explain with AI
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function VarianceAlerts({
  alerts,
  onAcknowledge,
  onExplainWithAI,
  isExplaining = false,
}: VarianceAlertsProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explainId, setExplainId] = useState<string | null>(null);

  // Summary stats
  const totalAlerts = alerts.length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  // Filtered + sorted alerts
  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    if (severityFilter !== 'all') {
      result = result.filter((a) => a.severity === severityFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter((a) => a.alert_type === typeFilter);
    }

    // Sort: unacknowledged first, then by severity, then by timestamp
    result.sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
      const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [alerts, severityFilter, typeFilter]);

  const handleExplain = async (alert: VarianceAlert) => {
    if (!onExplainWithAI) return;
    setExplainId(alert.id);
    try {
      const explanation = await onExplainWithAI(alert);
      setExplanations((prev) => ({ ...prev, [alert.id]: explanation }));
    } finally {
      setExplainId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: 'var(--color-text)' }}
        >
          Variance Alerts
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Review and manage financial and effort variance alerts
        </p>
      </div>

      {/* Summary stats */}
      <SummaryStats
        total={totalAlerts}
        critical={criticalCount}
        unacknowledged={unacknowledgedCount}
      />

      {/* Filter bar */}
      <FilterBar
        severity={severityFilter}
        type={typeFilter}
        onSeverityChange={setSeverityFilter}
        onTypeChange={setTypeFilter}
      />

      {/* Filtered count */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Showing {filteredAlerts.length} of {totalAlerts} alerts
        </span>
        {(severityFilter !== 'all' || typeFilter !== 'all') && (
          <button
            onClick={() => {
              setSeverityFilter('all');
              setTypeFilter('all');
            }}
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--color-primary-light)' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Alert cards */}
      {filteredAlerts.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
              onExplainWithAI={handleExplain}
              isExplaining={isExplaining && explainId === alert.id}
              aiExplanation={explanations[alert.id] ?? null}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full"
            style={{
              backgroundColor: 'var(--color-success)15',
              color: 'var(--color-success)',
            }}
          >
            <CheckCircle2 size={28} />
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            No alerts match the current filters
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {totalAlerts > 0
              ? 'Try adjusting your filters to see more alerts'
              : 'All variance thresholds are within acceptable ranges'}
          </p>
        </div>
      )}
    </div>
  );
}
