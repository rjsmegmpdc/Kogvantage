'use client';

// ============================================================
// KOGVANTAGE -- KPI Cards Row
// 6 summary cards with icons, values, trend indicators, and
// inline sparklines for the Stakeholder Dashboard.
// ============================================================

import {
  FolderKanban,
  HeartPulse,
  DollarSign,
  Flame,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// -- Types -----------------------------------------------------

export interface KPICardsProps {
  totalProjects: number;
  avgHealth: number;
  totalBudget: number;
  burnRate: number;
  activeAlerts: number;
  totalResources: number;
}

// -- Helpers ---------------------------------------------------

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Tiny inline sparkline SVG -- purely decorative */
function MiniSparkline({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const paths: Record<string, string> = {
    up: 'M0,14 L8,10 L16,12 L24,6 L32,8 L40,2',
    down: 'M0,2 L8,6 L16,4 L24,10 L32,8 L40,14',
    flat: 'M0,8 L8,7 L16,9 L24,7 L32,8 L40,7',
  };
  const color =
    trend === 'up'
      ? 'var(--color-success)'
      : trend === 'down'
        ? 'var(--color-danger)'
        : 'var(--color-text-muted)';

  return (
    <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
      <path
        d={paths[trend]}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// -- Card sub-component ----------------------------------------

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentColor: string;
  trend: 'up' | 'down' | 'flat';
  trendLabel?: string;
}

function KPICard({ label, value, icon, accentColor, trend, trendLabel }: KPICardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : TrendingUp;
  const trendColor =
    trend === 'up'
      ? 'var(--color-success)'
      : trend === 'down'
        ? 'var(--color-danger)'
        : 'var(--color-text-muted)';

  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-xl transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
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

      {/* Value */}
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ color: 'var(--color-text)' }}
      >
        {value}
      </span>

      {/* Trend + Sparkline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendIcon size={12} style={{ color: trendColor }} />
          {trendLabel && (
            <span className="text-xs" style={{ color: trendColor }}>
              {trendLabel}
            </span>
          )}
        </div>
        <MiniSparkline trend={trend} />
      </div>
    </div>
  );
}

// -- Main component --------------------------------------------

export default function KPICards({
  totalProjects,
  avgHealth,
  totalBudget,
  burnRate,
  activeAlerts,
  totalResources,
}: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <KPICard
        label="Total Projects"
        value={String(totalProjects)}
        icon={<FolderKanban size={18} />}
        accentColor="var(--color-primary)"
        trend="flat"
        trendLabel="Active"
      />
      <KPICard
        label="Avg Health"
        value={`${avgHealth}%`}
        icon={<HeartPulse size={18} />}
        accentColor={
          avgHealth >= 70
            ? 'var(--color-success)'
            : avgHealth >= 40
              ? 'var(--color-warning)'
              : 'var(--color-danger)'
        }
        trend={avgHealth >= 70 ? 'up' : avgHealth >= 40 ? 'flat' : 'down'}
        trendLabel={avgHealth >= 70 ? 'Good' : avgHealth >= 40 ? 'Monitor' : 'Action needed'}
      />
      <KPICard
        label="Total Budget"
        value={formatCurrency(totalBudget)}
        icon={<DollarSign size={18} />}
        accentColor="var(--color-primary-light)"
        trend="flat"
        trendLabel="NZD"
      />
      <KPICard
        label="Monthly Burn"
        value={formatCurrency(burnRate)}
        icon={<Flame size={18} />}
        accentColor="#f97316"
        trend={burnRate > 0 ? 'up' : 'flat'}
        trendLabel="per month"
      />
      <KPICard
        label="Active Alerts"
        value={String(activeAlerts)}
        icon={<AlertTriangle size={18} />}
        accentColor={activeAlerts > 0 ? 'var(--color-danger)' : 'var(--color-success)'}
        trend={activeAlerts > 0 ? 'up' : 'flat'}
        trendLabel={activeAlerts > 0 ? 'Unresolved' : 'All clear'}
      />
      <KPICard
        label="Total Resources"
        value={String(totalResources)}
        icon={<Users size={18} />}
        accentColor="var(--color-info)"
        trend="flat"
        trendLabel="Allocated"
      />
    </div>
  );
}
