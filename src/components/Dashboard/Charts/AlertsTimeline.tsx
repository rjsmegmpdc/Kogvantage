'use client';

// ============================================================
// KOGVANTAGE -- Alerts Timeline Chart
// Stacked AreaChart showing alerts by severity over time.
// ============================================================

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface AlertsTimelineProps {
  data: {
    month: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }[];
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
};

export default function AlertsTimeline({ data }: AlertsTimelineProps) {
  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-xl"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3
        className="text-sm font-semibold"
        style={{ color: 'var(--color-text)' }}
      >
        Alerts Timeline
      </h3>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
                <linearGradient key={key} id={`alert-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-text)',
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: 'var(--color-text-muted)' }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="critical"
              name="Critical"
              stackId="1"
              stroke={SEVERITY_COLORS.critical}
              fill={`url(#alert-critical)`}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="high"
              name="High"
              stackId="1"
              stroke={SEVERITY_COLORS.high}
              fill={`url(#alert-high)`}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="medium"
              name="Medium"
              stackId="1"
              stroke={SEVERITY_COLORS.medium}
              fill={`url(#alert-medium)`}
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="low"
              name="Low"
              stackId="1"
              stroke={SEVERITY_COLORS.low}
              fill={`url(#alert-low)`}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
