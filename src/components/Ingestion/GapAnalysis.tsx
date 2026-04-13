'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Settings2,
} from 'lucide-react';
import type {
  IngestResult,
  FileAnalysis,
} from '@/server/services/ingestion/UniversalIngestor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GapAnalysisProps {
  result: IngestResult;
  onOverrideMapping?: (fileName: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function confidenceColor(confidence: number): string {
  if (confidence > 80) return 'var(--color-green-500, #22c55e)';
  if (confidence > 50) return 'var(--color-amber-500, #f59e0b)';
  return 'var(--color-red-500, #ef4444)';
}

function confidenceLabel(confidence: number): string {
  if (confidence > 80) return 'High';
  if (confidence > 50) return 'Medium';
  return 'Low';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({
  icon,
  title,
  items,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '14px',
          color,
        }}
      >
        {icon}
        {title} ({items.length})
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          paddingLeft: '28px',
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              fontSize: '13px',
              color: 'var(--color-foreground, #374151)',
              lineHeight: 1.5,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function FileCard({
  analysis,
  onOverrideMapping,
}: {
  analysis: FileAnalysis;
  onOverrideMapping?: (fileName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const mappedEntries = Object.entries(analysis.mappedColumns);
  const barColor = confidenceColor(analysis.confidence);

  return (
    <div
      style={{
        border: '1px solid var(--color-border, #e5e7eb)',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'var(--color-surface, #ffffff)',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {expanded ? (
          <ChevronDown size={16} style={{ flexShrink: 0, color: 'var(--color-muted-foreground, #6b7280)' }} />
        ) : (
          <ChevronRight size={16} style={{ flexShrink: 0, color: 'var(--color-muted-foreground, #6b7280)' }} />
        )}

        <span
          style={{
            flex: 1,
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-foreground, #111827)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {analysis.fileName}
        </span>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'var(--color-muted, #f3f4f6)',
            color: 'var(--color-muted-foreground, #6b7280)',
            flexShrink: 0,
          }}
        >
          {analysis.detectedDataType.replace(/_/g, ' ')}
        </span>

        {/* Confidence bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '60px',
              height: '6px',
              borderRadius: '3px',
              background: 'var(--color-muted, #e5e7eb)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${analysis.confidence}%`,
                height: '100%',
                borderRadius: '3px',
                background: barColor,
                transition: 'width 300ms ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: barColor,
              minWidth: '28px',
              textAlign: 'right',
            }}
          >
            {analysis.confidence}%
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          style={{
            padding: '0 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Confidence summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--color-muted-foreground, #6b7280)',
            }}
          >
            <span>
              {analysis.rowCount} rows, {analysis.columns.length} columns,{' '}
              {mappedEntries.length} mapped
            </span>
            <span style={{ color: barColor, fontWeight: 600 }}>
              {confidenceLabel(analysis.confidence)} confidence
            </span>
          </div>

          {/* Column mapping table */}
          {mappedEntries.length > 0 && (
            <div
              style={{
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--color-muted, #f9fafb)',
                    }}
                  >
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontWeight: 600,
                        color: 'var(--color-muted-foreground, #6b7280)',
                        borderBottom: '1px solid var(--color-border, #e5e7eb)',
                      }}
                    >
                      Source Column
                    </th>
                    <th
                      style={{
                        width: '32px',
                        padding: '8px 0',
                        borderBottom: '1px solid var(--color-border, #e5e7eb)',
                      }}
                    />
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontWeight: 600,
                        color: 'var(--color-muted-foreground, #6b7280)',
                        borderBottom: '1px solid var(--color-border, #e5e7eb)',
                      }}
                    >
                      Target Column
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mappedEntries.map(([source, target], i) => (
                    <tr key={i}>
                      <td
                        style={{
                          padding: '6px 12px',
                          color: 'var(--color-foreground, #374151)',
                          borderBottom:
                            i < mappedEntries.length - 1
                              ? '1px solid var(--color-border, #f3f4f6)'
                              : 'none',
                        }}
                      >
                        {source}
                      </td>
                      <td
                        style={{
                          padding: '6px 0',
                          textAlign: 'center',
                          borderBottom:
                            i < mappedEntries.length - 1
                              ? '1px solid var(--color-border, #f3f4f6)'
                              : 'none',
                        }}
                      >
                        <ArrowRight
                          size={12}
                          style={{
                            color: 'var(--color-muted-foreground, #9ca3af)',
                          }}
                        />
                      </td>
                      <td
                        style={{
                          padding: '6px 12px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: 'var(--color-primary, #3b82f6)',
                          borderBottom:
                            i < mappedEntries.length - 1
                              ? '1px solid var(--color-border, #f3f4f6)'
                              : 'none',
                        }}
                      >
                        {target}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {analysis.issues.map((issue, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: 'var(--color-amber-700, #b45309)',
                  }}
                >
                  <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                  {issue}
                </div>
              ))}
            </div>
          )}

          {/* Override mapping button */}
          {onOverrideMapping && (
            <button
              type="button"
              onClick={() => onOverrideMapping(analysis.fileName)}
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border, #d1d5db)',
                background: 'var(--color-surface, #ffffff)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-muted-foreground, #6b7280)',
              }}
            >
              <Settings2 size={13} />
              Override Mapping
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GapAnalysis({
  result,
  onOverrideMapping,
}: GapAnalysisProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Summary sections */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid var(--color-border, #e5e7eb)',
          background: 'var(--color-surface, #ffffff)',
        }}
      >
        <Section
          icon={<CheckCircle2 size={16} />}
          title="Found"
          items={result.gapReport.found}
          color="var(--color-green-600, #16a34a)"
        />

        <Section
          icon={<AlertTriangle size={16} />}
          title="Missing"
          items={result.gapReport.missing}
          color="var(--color-amber-600, #d97706)"
        />

        <Section
          icon={<AlertCircle size={16} />}
          title="Warnings"
          items={result.gapReport.warnings}
          color="var(--color-red-600, #dc2626)"
        />
      </div>

      {/* Per-file breakdown */}
      {result.files.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-foreground, #111827)',
            }}
          >
            File Breakdown
          </div>

          {result.files.map((analysis, i) => (
            <FileCard
              key={`${analysis.fileName}-${i}`}
              analysis={analysis}
              onOverrideMapping={onOverrideMapping}
            />
          ))}
        </div>
      )}
    </div>
  );
}
