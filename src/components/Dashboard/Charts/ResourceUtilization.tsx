'use client';

// ============================================================
// KOGVANTAGE -- Resource Utilization Chart
// Horizontal stacked BarChart showing allocated vs available
// capacity for each resource type.
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

export interface ResourceUtilizationProps {
  data: { type: string; allocated: number; available: number }[];
}

export default function ResourceUtilization({ data }: ResourceUtilizationProps) {
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
        Resource Utilization
      </h3>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barGap={2} barCategoryGap="25%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="type"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={90}
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
              wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)' }}
            />
            <Bar
              dataKey="allocated"
              name="Allocated"
              stackId="a"
              fill="#3b82f6"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="available"
              name="Available"
              stackId="a"
              fill="#1e293b"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
