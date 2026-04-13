'use client';

// ============================================================
// KOGVANTAGE -- Health Gauge Chart
// RadialBarChart showing average portfolio health 0-100%.
// Green >70, Yellow 40-70, Red <40.
// ============================================================

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from 'recharts';

export interface HealthGaugeProps {
  health: number;
}

function getHealthColor(health: number): string {
  if (health >= 70) return '#22c55e';
  if (health >= 40) return '#eab308';
  return '#ef4444';
}

function getHealthLabel(health: number): string {
  if (health >= 70) return 'Healthy';
  if (health >= 40) return 'At Risk';
  return 'Critical';
}

export default function HealthGauge({ health }: HealthGaugeProps) {
  const color = getHealthColor(health);
  const data = [
    { name: 'health', value: health, fill: color },
  ];

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
        Portfolio Health
      </h3>

      <div className="relative" style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={16}
            data={data}
            startAngle={210}
            endAngle={-30}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={8}
              background={{ fill: 'var(--color-surface-raised)' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <span
            className="text-3xl font-bold"
            style={{ color }}
          >
            {health}%
          </span>
          <span
            className="text-xs font-medium mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {getHealthLabel(health)}
          </span>
        </div>
      </div>
    </div>
  );
}
