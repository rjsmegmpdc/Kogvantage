'use client';

// ============================================================
// KOGVANTAGE -- Budget vs Actuals Chart
// Grouped vertical BarChart comparing budget and actuals per
// project with a horizontal legend.
// ============================================================

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface BudgetVsActualsProps {
  projects: { name: string; budget: number; actuals: number }[];
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function BudgetVsActuals({ projects }: BudgetVsActualsProps) {
  // Truncate long project names for chart labels
  const data = projects.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 12) + '...' : p.name,
    Budget: p.budget,
    Actuals: p.actuals,
  }));

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
        Budget vs Actuals
      </h3>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-text)',
                fontSize: 12,
              }}
              formatter={(value) => [formatCurrency(Number(value)), undefined]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)' }}
            />
            <Bar
              dataKey="Budget"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Actuals"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
