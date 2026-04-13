'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Plus,
  Minus,
  DollarSign,
  Heart,
  Bell,
  Users,
  Loader2,
  GitCompare,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types (mirrors server ComparisonResult)
// ---------------------------------------------------------------------------

export interface ComparisonResult {
  oldLabel: string;
  newLabel: string;
  oldDate: string;
  newDate: string;
  newProjects: { title: string; status: string; budget: number }[];
  removedProjects: { title: string; status: string; budget: number }[];
  projectChanges: {
    title: string;
    field: string;
    oldValue: string | number;
    newValue: string | number;
    delta?: number;
    direction: 'improved' | 'declined' | 'changed';
  }[];
  financialDelta: {
    budgetChange: number;
    actualsChange: number;
    varianceChange: number;
    burnRateChange: number;
  };
  alertsDelta: {
    newAlerts: number;
    resolvedAlerts: number;
    totalChange: number;
  };
  resourceDelta: {
    added: number;
    removed: number;
    totalChange: number;
  };
}

interface SnapshotOption {
  id: string;
  label: string;
  createdAt: string;
}

interface ComparisonViewProps {
  snapshots: SnapshotOption[];
  onCompare: (oldId: string, newId: string | 'current') => Promise<ComparisonResult>;
  aiNarrative?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}$${Math.abs(amount).toLocaleString('en-NZ')} NZD`;
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function directionColor(direction: 'improved' | 'declined' | 'changed'): string {
  if (direction === 'improved') return '#10b981';
  if (direction === 'declined') return '#ef4444';
  return 'var(--color-text-secondary, #64748b)';
}

function DirectionIcon({ direction }: { direction: 'improved' | 'declined' | 'changed' }) {
  if (direction === 'improved') return <ArrowUpRight size={14} style={{ color: '#10b981' }} />;
  if (direction === 'declined') return <ArrowDownRight size={14} style={{ color: '#ef4444' }} />;
  return <ArrowRight size={14} style={{ color: 'var(--color-text-secondary, #64748b)' }} />;
}

// ---------------------------------------------------------------------------
// Delta KPI Card
// ---------------------------------------------------------------------------

function DeltaCard({
  label,
  value,
  icon,
  isPositiveGood,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  isPositiveGood: boolean;
}) {
  const isGood = isPositiveGood ? value >= 0 : value <= 0;
  const color = value === 0 ? 'var(--color-text-secondary, #64748b)' : isGood ? '#10b981' : '#ef4444';
  const arrow = value > 0 ? '\u2191' : value < 0 ? '\u2193' : '';

  return (
    <div style={{ ...styles.kpiCard, borderTopColor: color }}>
      <div style={styles.kpiIcon}>{icon}</div>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={{ ...styles.kpiValue, color }}>
        {arrow} {typeof value === 'number' && label.toLowerCase().includes('budget')
          ? formatCurrency(value)
          : value > 0 ? `+${value}` : String(value)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ComparisonView({
  snapshots,
  onCompare,
  aiNarrative,
}: ComparisonViewProps) {
  const [oldId, setOldId] = useState<string>(snapshots[0]?.id || '');
  const [newId, setNewId] = useState<string | 'current'>('current');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!oldId) return;
    setLoading(true);
    try {
      const comparison = await onCompare(oldId, newId);
      setResult(comparison);
    } catch (err) {
      console.error('Comparison failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Snapshot selectors */}
      <div style={styles.selectorRow}>
        <div style={styles.selectorGroup}>
          <label style={styles.selectorLabel}>Compare</label>
          <select
            value={oldId}
            onChange={(e) => setOldId(e.target.value)}
            style={styles.select}
          >
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({formatDate(s.createdAt)})
              </option>
            ))}
          </select>
        </div>

        <GitCompare size={20} style={{ color: 'var(--color-text-secondary, #64748b)', flexShrink: 0, marginTop: '24px' }} />

        <div style={styles.selectorGroup}>
          <label style={styles.selectorLabel}>with</label>
          <select
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            style={styles.select}
          >
            <option value="current">Current Portfolio</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({formatDate(s.createdAt)})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !oldId}
          style={{
            ...styles.compareButton,
            opacity: loading || !oldId ? 0.5 : 1,
            cursor: loading || !oldId ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <GitCompare size={16} />}
          <span>Compare</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary, #6366f1)' }} />
          <span style={styles.loadingText}>Comparing snapshots...</span>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={styles.results}>
          {/* Date range header */}
          <div style={styles.dateRange}>
            <span>{result.oldLabel} ({formatDate(result.oldDate)})</span>
            <ArrowRight size={16} />
            <span>{result.newLabel} ({formatDate(result.newDate)})</span>
          </div>

          {/* Delta KPI cards */}
          <div style={styles.kpiGrid}>
            <DeltaCard
              label="Budget Change"
              value={result.financialDelta.budgetChange}
              icon={<DollarSign size={18} />}
              isPositiveGood={false}
            />
            <DeltaCard
              label="Health Change"
              value={
                result.projectChanges
                  .filter((c) => c.field === 'health')
                  .reduce((sum, c) => sum + (c.delta || 0), 0)
              }
              icon={<Heart size={18} />}
              isPositiveGood={true}
            />
            <DeltaCard
              label="Alerts Change"
              value={result.alertsDelta.totalChange}
              icon={<Bell size={18} />}
              isPositiveGood={false}
            />
            <DeltaCard
              label="Resources Change"
              value={result.resourceDelta.totalChange}
              icon={<Users size={18} />}
              isPositiveGood={true}
            />
          </div>

          {/* New projects */}
          {result.newProjects.length > 0 && (
            <div style={styles.projectSection}>
              <h4 style={{ ...styles.sectionTitle, color: '#10b981' }}>
                <Plus size={16} /> New Projects ({result.newProjects.length})
              </h4>
              <div style={{ ...styles.projectList, borderColor: '#10b981' }}>
                {result.newProjects.map((p) => (
                  <div key={p.title} style={styles.projectRow}>
                    <span style={styles.projectName}>{p.title}</span>
                    <span style={styles.projectBadge}>{p.status}</span>
                    <span style={styles.projectBudget}>
                      ${p.budget.toLocaleString('en-NZ')} NZD
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed projects */}
          {result.removedProjects.length > 0 && (
            <div style={styles.projectSection}>
              <h4 style={{ ...styles.sectionTitle, color: '#ef4444' }}>
                <Minus size={16} /> Removed Projects ({result.removedProjects.length})
              </h4>
              <div style={{ ...styles.projectList, borderColor: '#ef4444' }}>
                {result.removedProjects.map((p) => (
                  <div key={p.title} style={styles.projectRow}>
                    <span style={styles.projectName}>{p.title}</span>
                    <span style={styles.projectBadge}>{p.status}</span>
                    <span style={styles.projectBudget}>
                      ${p.budget.toLocaleString('en-NZ')} NZD
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project changes table */}
          {result.projectChanges.length > 0 && (
            <div style={styles.changesSection}>
              <h4 style={styles.sectionTitle}>
                Project Changes ({result.projectChanges.length})
              </h4>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Project</th>
                      <th style={styles.th}>Field</th>
                      <th style={styles.th}>Old Value</th>
                      <th style={styles.th}>New Value</th>
                      <th style={styles.th}>Direction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.projectChanges.map((c, i) => (
                      <tr key={`${c.title}-${c.field}-${i}`}>
                        <td style={styles.td}>{c.title}</td>
                        <td style={styles.td}>
                          <span style={styles.fieldBadge}>{c.field}</span>
                        </td>
                        <td style={styles.td}>
                          {typeof c.oldValue === 'number' && c.field === 'budget'
                            ? `$${c.oldValue.toLocaleString('en-NZ')}`
                            : typeof c.oldValue === 'number' && c.field === 'health'
                              ? `${c.oldValue}%`
                              : String(c.oldValue)}
                        </td>
                        <td style={{ ...styles.td, color: directionColor(c.direction), fontWeight: 600 }}>
                          {typeof c.newValue === 'number' && c.field === 'budget'
                            ? `$${c.newValue.toLocaleString('en-NZ')}`
                            : typeof c.newValue === 'number' && c.field === 'health'
                              ? `${c.newValue}%`
                              : String(c.newValue)}
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <DirectionIcon direction={c.direction} />
                            <span style={{ fontSize: '12px', color: directionColor(c.direction) }}>
                              {c.direction}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Narrative */}
          {aiNarrative && (
            <div style={styles.narrativeSection}>
              <div style={styles.narrativeHeader}>
                <Sparkles size={16} style={{ color: 'var(--color-primary, #6366f1)' }} />
                <h4 style={styles.narrativeTitle}>AI Analysis</h4>
              </div>
              <div style={styles.narrativeBody}>
                {aiNarrative.split('\n\n').filter(Boolean).map((para, i) => (
                  <p key={i} style={styles.narrativeParagraph}>{para}</p>
                ))}
              </div>
            </div>
          )}
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

  selectorRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },

  selectorGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: '200px',
  },

  selectorLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-secondary, #64748b)',
  },

  select: {
    padding: '8px 12px',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '8px',
    background: 'var(--color-surface, #ffffff)',
    color: 'var(--color-text, #0f172a)',
    fontSize: '14px',
    fontFamily: 'inherit',
  },

  compareButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 20px',
    background: 'var(--color-primary, #6366f1)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'opacity 0.2s',
    flexShrink: 0,
  },

  loadingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '40px',
  },

  loadingText: {
    fontSize: '14px',
    color: 'var(--color-text-secondary, #64748b)',
  },

  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  dateRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--color-text-secondary, #64748b)',
    fontWeight: 500,
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },

  kpiCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '16px',
    background: 'var(--color-surface, #ffffff)',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderTop: '3px solid',
    borderRadius: '10px',
  },

  kpiIcon: {
    color: 'var(--color-text-secondary, #64748b)',
  },

  kpiLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-secondary, #64748b)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },

  kpiValue: {
    fontSize: '18px',
    fontWeight: 700,
  },

  projectSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text, #0f172a)',
  },

  projectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderLeft: '3px solid',
    paddingLeft: '12px',
  },

  projectRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    background: 'var(--color-surface, #ffffff)',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '6px',
    fontSize: '13px',
  },

  projectName: {
    flex: 1,
    fontWeight: 500,
    color: 'var(--color-text, #0f172a)',
  },

  projectBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    background: 'var(--color-surface-alt, #f1f5f9)',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-secondary, #64748b)',
  },

  projectBudget: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text-secondary, #64748b)',
  },

  changesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  tableWrapper: {
    overflowX: 'auto' as const,
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '8px',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },

  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontWeight: 600,
    fontSize: '12px',
    color: 'var(--color-text-secondary, #64748b)',
    background: 'var(--color-surface-alt, #f8fafc)',
    borderBottom: '1px solid var(--color-border, #e2e8f0)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },

  td: {
    padding: '10px 14px',
    borderBottom: '1px solid var(--color-border, #e2e8f0)',
    color: 'var(--color-text, #0f172a)',
  },

  fieldBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    background: 'var(--color-surface-alt, #f1f5f9)',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'capitalize' as const,
  },

  narrativeSection: {
    background: 'var(--color-surface, #ffffff)',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '12px',
    overflow: 'hidden',
  },

  narrativeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border, #e2e8f0)',
    background: 'var(--color-surface-alt, #f8fafc)',
  },

  narrativeTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text, #0f172a)',
  },

  narrativeBody: {
    padding: '16px',
  },

  narrativeParagraph: {
    margin: '0 0 12px 0',
    lineHeight: 1.7,
    fontSize: '14px',
    color: 'var(--color-text, #0f172a)',
  },
};
