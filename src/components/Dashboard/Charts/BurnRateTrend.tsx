'use client';

// ============================================================
// KOGVANTAGE -- Burn Rate Trend Chart
// LineChart with gradient fill showing monthly spend over time.
// ============================================================

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface BurnRateTrendProps {
  data: { month: string; amount: number }[];
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function BurnRateTrend({ data }: BurnRateTrendProps) {
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
        Burn Rate Trend
      </h3>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
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
              formatter={(value) => [formatCurrency(Number(value)), 'Spend']}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#burnGradient)"
              dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
