'use client';

import { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartSpec {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: Record<string, any>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
}

export interface QueryResult {
  text: string;
  charts?: ChartSpec[];
  suggestedFollowUps?: string[];
}

interface QueryResultsProps {
  result: QueryResult | null;
  onFollowUp: (q: string) => void;
}

// ---------------------------------------------------------------------------
// Default chart palette
// ---------------------------------------------------------------------------

const DEFAULT_COLORS = [
  'var(--color-primary, #6366f1)',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
];

// ---------------------------------------------------------------------------
// DynamicChart sub-component
// ---------------------------------------------------------------------------

function DynamicChart({ spec }: { spec: ChartSpec }) {
  const colors = spec.colors?.length ? spec.colors : DEFAULT_COLORS;

  const renderChart = () => {
    switch (spec.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spec.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" />
              <XAxis dataKey={spec.xKey} tick={{ fontSize: 12 }} stroke="var(--color-text-secondary, #64748b)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-secondary, #64748b)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Legend />
              {spec.yKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spec.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" />
              <XAxis dataKey={spec.xKey} tick={{ fontSize: 12 }} stroke="var(--color-text-secondary, #64748b)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-secondary, #64748b)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Legend />
              {spec.yKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spec.data}
                dataKey={spec.yKeys[0]}
                nameKey={spec.xKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: any) => `${entry.name} ${((entry.percent ?? 0) * 100).toFixed(0)}%`}
              >
                {spec.data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={spec.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" />
              <XAxis dataKey={spec.xKey} tick={{ fontSize: 12 }} stroke="var(--color-text-secondary, #64748b)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-secondary, #64748b)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Legend />
              {spec.yKeys.map((key, i) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[i % colors.length]}
                  fill={colors[i % colors.length]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return <p style={{ color: 'var(--color-text-secondary)' }}>Unsupported chart type: {spec.type}</p>;
    }
  };

  return (
    <div style={styles.chartContainer}>
      <h4 style={styles.chartTitle}>{spec.title}</h4>
      {renderChart()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function QueryResults({ result, onFollowUp }: QueryResultsProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  // Split text into paragraphs for rendering
  const paragraphs = result.text
    .split('\n\n')
    .filter((p) => p.trim().length > 0);

  return (
    <div style={styles.container}>
      {/* Text content */}
      <div style={styles.textSection}>
        <div style={styles.textHeader}>
          <Sparkles size={16} style={{ color: 'var(--color-primary, #6366f1)' }} />
          <span style={styles.textLabel}>AI Response</span>
          <button
            onClick={handleCopy}
            style={styles.copyButton}
            aria-label="Copy response"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div style={styles.textBody}>
          {paragraphs.map((para, i) => (
            <p key={i} style={styles.paragraph}>
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Charts */}
      {result.charts && result.charts.length > 0 && (
        <div style={styles.chartsSection}>
          {result.charts.map((chart, i) => (
            <DynamicChart key={`${chart.title}-${i}`} spec={chart} />
          ))}
        </div>
      )}

      {/* Follow-up suggestions */}
      {result.suggestedFollowUps && result.suggestedFollowUps.length > 0 && (
        <div style={styles.followUpSection}>
          <span style={styles.followUpLabel}>Follow-up questions:</span>
          <div style={styles.followUpChips}>
            {result.suggestedFollowUps.map((q) => (
              <button
                key={q}
                onClick={() => onFollowUp(q)}
                style={styles.followUpChip}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },

  textSection: {
    background: 'var(--color-surface, #ffffff)',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '12px',
    overflow: 'hidden',
  },

  textHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border, #e2e8f0)',
    background: 'var(--color-surface-alt, #f8fafc)',
  },

  textLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-secondary, #64748b)',
    flex: 1,
  },

  copyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--color-text-secondary, #64748b)',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  textBody: {
    padding: '16px',
  },

  paragraph: {
    margin: '0 0 12px 0',
    lineHeight: 1.7,
    fontSize: '14px',
    color: 'var(--color-text, #0f172a)',
  },

  chartsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  chartContainer: {
    background: 'var(--color-surface, #ffffff)',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '12px',
    padding: '16px',
  },

  chartTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text, #0f172a)',
  },

  followUpSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  followUpLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text-secondary, #64748b)',
  },

  followUpChips: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },

  followUpChip: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid var(--color-primary, #6366f1)',
    background: 'transparent',
    color: 'var(--color-primary, #6366f1)',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s, color 0.15s',
  },
};
