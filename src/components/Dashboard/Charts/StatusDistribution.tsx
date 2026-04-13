'use client';

// ============================================================
// KOGVANTAGE -- Status Distribution Chart
// Donut PieChart showing project count by status.
// ============================================================

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface StatusDistributionProps {
  data: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  planned: '#64748b',
  'in-progress': '#3b82f6',
  blocked: '#ef4444',
  done: '#22c55e',
  active: '#3b82f6',
  completed: '#22c55e',
  'on-hold': '#eab308',
  cancelled: '#94a3b8',
};

function getColor(status: string): string {
  return STATUS_COLORS[status.toLowerCase()] ?? '#8b5cf6';
}

function capitalize(str: string): string {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function StatusDistribution({ data }: StatusDistributionProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

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
        Status Distribution
      </h3>

      <div className="relative" style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map((d) => ({ name: capitalize(d.status), value: d.count }))}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={getColor(d.status)} />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>

        {/* Center total */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ pointerEvents: 'none', marginBottom: 28 }}
        >
          <span
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            {total}
          </span>
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Projects
          </span>
        </div>
      </div>
    </div>
  );
}
