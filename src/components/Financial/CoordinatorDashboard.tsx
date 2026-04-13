'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Upload,
  Users,
  BarChart3,
  Bell,
  Activity,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FinancialSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  activeAlerts: number;
}

export type HealthStatus = 'healthy' | 'at-risk' | 'critical';

export interface QuickLinkItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export interface CoordinatorDashboardProps {
  summary: FinancialSummary;
  healthStatus: HealthStatus;
  healthMessage?: string;
  recentAlerts?: { id: string; message: string; severity: string }[];
  onNavigate?: (path: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function healthColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'var(--color-success)';
    case 'at-risk':
      return 'var(--color-warning)';
    case 'critical':
      return 'var(--color-danger)';
  }
}

function healthIcon(status: HealthStatus) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 size={20} />;
    case 'at-risk':
      return <MinusCircle size={20} />;
    case 'critical':
      return <XCircle size={20} />;
  }
}

function healthLabel(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'at-risk':
      return 'At Risk';
    case 'critical':
      return 'Critical';
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentColor: string;
  subtext?: string;
}

function SummaryCard({ label, value, icon, accentColor, subtext }: SummaryCardProps) {
  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-xl"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </span>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {icon}
        </div>
      </div>
      <div>
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--color-text)' }}
        >
          {value}
        </span>
        {subtext && (
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CoordinatorDashboard({
  summary,
  healthStatus,
  healthMessage,
  recentAlerts = [],
  onNavigate,
}: CoordinatorDashboardProps) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const spentPercent =
    summary.totalBudget > 0
      ? ((summary.totalSpent / summary.totalBudget) * 100).toFixed(1)
      : '0.0';

  const quickLinks: QuickLinkItem[] = [
    {
      label: 'Data Import',
      description: 'Import timesheets, actuals, and labour rates',
      icon: <Upload size={20} />,
      href: '/coordinator/import',
    },
    {
      label: 'Resources',
      description: 'Manage resource commitments and allocations',
      icon: <Users size={20} />,
      href: '/coordinator/resources',
    },
    {
      label: 'P&L Ledger',
      description: 'View profit & loss across workstreams',
      icon: <BarChart3 size={20} />,
      href: '/coordinator/ledger',
    },
    {
      label: 'Variance Alerts',
      description: 'Review and acknowledge variance alerts',
      icon: <Bell size={20} />,
      href: '/coordinator/alerts',
    },
  ];

  const handleNav = (href: string) => {
    onNavigate?.(href);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: 'var(--color-text)' }}
        >
          Financial Coordinator
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Portfolio-level financial overview and coordination tools
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Budget"
          value={formatCurrency(summary.totalBudget)}
          icon={<DollarSign size={18} />}
          accentColor="var(--color-primary)"
        />
        <SummaryCard
          label="Total Spent"
          value={formatCurrency(summary.totalSpent)}
          icon={<TrendingUp size={18} />}
          accentColor="var(--color-warning)"
          subtext={`${spentPercent}% of budget`}
        />
        <SummaryCard
          label="Remaining"
          value={formatCurrency(summary.remaining)}
          icon={
            summary.remaining >= 0 ? (
              <TrendingDown size={18} />
            ) : (
              <TrendingUp size={18} />
            )
          }
          accentColor={
            summary.remaining >= 0
              ? 'var(--color-success)'
              : 'var(--color-danger)'
          }
        />
        <SummaryCard
          label="Active Alerts"
          value={String(summary.activeAlerts)}
          icon={<AlertTriangle size={18} />}
          accentColor={
            summary.activeAlerts > 0
              ? 'var(--color-danger)'
              : 'var(--color-success)'
          }
          subtext={
            summary.activeAlerts > 0
              ? 'Requires attention'
              : 'All clear'
          }
        />
      </div>

      {/* Health indicator + Quick links row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Financial health */}
        <div
          className="flex flex-col gap-4 p-5 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            Financial Health
          </h2>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-full"
              style={{
                backgroundColor: `${healthColor(healthStatus)}15`,
                color: healthColor(healthStatus),
              }}
            >
              {healthIcon(healthStatus)}
            </div>
            <div>
              <span
                className="text-lg font-bold"
                style={{ color: healthColor(healthStatus) }}
              >
                {healthLabel(healthStatus)}
              </span>
              {healthMessage && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {healthMessage}
                </p>
              )}
            </div>
          </div>

          {/* Budget progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Budget utilisation
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {spentPercent}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(parseFloat(spentPercent), 100)}%`,
                  backgroundColor:
                    parseFloat(spentPercent) > 100
                      ? 'var(--color-danger)'
                      : parseFloat(spentPercent) > 85
                        ? 'var(--color-warning)'
                        : 'var(--color-primary)',
                }}
              />
            </div>
          </div>

          {/* Spend breakdown bar */}
          <div className="flex items-center gap-2">
            <Activity size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Spent {formatCurrency(summary.totalSpent)} of{' '}
              {formatCurrency(summary.totalBudget)}
            </span>
          </div>
        </div>

        {/* Quick links */}
        <div
          className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {quickLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              onMouseEnter={() => setHoveredLink(link.href)}
              onMouseLeave={() => setHoveredLink(null)}
              className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-150"
              style={{
                backgroundColor:
                  hoveredLink === link.href
                    ? 'var(--color-surface-raised)'
                    : 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-primary)15',
                  color: 'var(--color-primary-light)',
                }}
              >
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="text-sm font-semibold block"
                  style={{ color: 'var(--color-text)' }}
                >
                  {link.label}
                </span>
                <span
                  className="text-xs block truncate"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {link.description}
                </span>
              </div>
              <ArrowRight
                size={16}
                className="flex-shrink-0 transition-transform duration-150"
                style={{
                  color: 'var(--color-text-muted)',
                  transform:
                    hoveredLink === link.href
                      ? 'translateX(2px)'
                      : 'translateX(0)',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Recent alerts preview */}
      {recentAlerts.length > 0 && (
        <div
          className="flex flex-col gap-3 p-5 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-semibold"
              style={{ color: 'var(--color-text)' }}
            >
              Recent Alerts
            </h2>
            <button
              onClick={() => handleNav('/coordinator/alerts')}
              className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: 'var(--color-primary-light)' }}
            >
              View all
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {recentAlerts.slice(0, 5).map((alert) => {
              const severityColor =
                alert.severity === 'critical'
                  ? 'var(--color-danger)'
                  : alert.severity === 'high'
                    ? '#f97316'
                    : alert.severity === 'medium'
                      ? 'var(--color-warning)'
                      : 'var(--color-info)';

              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--color-surface-raised)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: severityColor }}
                  />
                  <span
                    className="text-xs flex-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {alert.message}
                  </span>
                  <span
                    className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded"
                    style={{
                      color: severityColor,
                      backgroundColor: `${severityColor}15`,
                    }}
                  >
                    {alert.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
