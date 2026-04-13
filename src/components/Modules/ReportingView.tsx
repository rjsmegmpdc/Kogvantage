'use client';

import { useState, useCallback } from 'react';
import {
  FileText,
  FileBarChart,
  Presentation,
  Sparkles,
  Download,
  Loader2,
  Clock,
  Send,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportingViewProps {
  onGenerateReport: (type: 'weekly' | 'monthly' | 'executive') => Promise<{ blob: Blob; filename: string }>;
  onAIReport: (prompt: string) => Promise<string>;
}

type ReportType = 'weekly' | 'monthly' | 'executive';

interface RecentReport {
  id: string;
  type: ReportType;
  generatedAt: string;
  format: 'DOCX' | 'PPTX';
  filename: string;
  blob: Blob;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_CARDS: {
  type: ReportType;
  title: string;
  description: string;
  badge: 'DOCX' | 'PPTX';
  icon: typeof FileText;
  color: string;
  bgColor: string;
}[] = [
  {
    type: 'weekly',
    title: 'Weekly Status Report',
    description: 'Concise weekly update with portfolio health, financials, and risks',
    badge: 'DOCX',
    icon: FileText,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    type: 'monthly',
    title: 'Monthly Portfolio Report',
    description: 'Detailed monthly report with per-project breakdowns and trends',
    badge: 'DOCX',
    icon: FileBarChart,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  {
    type: 'executive',
    title: 'Executive Slide Deck',
    description: '6-slide executive summary with charts and status tables',
    badge: 'PPTX',
    icon: Presentation,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
];

const PRESET_PROMPTS = ['Risk summary', 'Budget forecast', 'Resource conflicts', 'Stakeholder brief'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${mins}`;
}

const TYPE_BADGE_COLORS: Record<ReportType, { color: string; bg: string }> = {
  weekly: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  monthly: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  executive: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
};

const TYPE_LABELS: Record<ReportType, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  executive: 'Executive',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportingView({ onGenerateReport, onAIReport }: ReportingViewProps) {
  const [loadingType, setLoadingType] = useState<ReportType | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [aiResult, setAIResult] = useState<string | null>(null);

  // ── Generate a structured report ──────────────────────────
  const handleGenerate = useCallback(
    async (type: ReportType) => {
      if (loadingType) return;
      setLoadingType(type);
      try {
        const { blob, filename } = await onGenerateReport(type);
        triggerDownload(blob, filename);
        setRecentReports((prev) => [
          {
            id: crypto.randomUUID(),
            type,
            generatedAt: new Date().toISOString(),
            format: type === 'executive' ? 'PPTX' : 'DOCX',
            filename,
            blob,
          },
          ...prev,
        ]);
      } catch {
        // Error handled upstream
      } finally {
        setLoadingType(null);
      }
    },
    [loadingType, onGenerateReport]
  );

  // ── AI report generation ──────────────────────────────────
  const handleAIGenerate = useCallback(async () => {
    const prompt = aiPrompt.trim();
    if (!prompt || aiLoading) return;
    setAILoading(true);
    setAIResult(null);
    try {
      const result = await onAIReport(prompt);
      setAIResult(result);
    } catch {
      setAIResult('Failed to generate AI report. Please try again.');
    } finally {
      setAILoading(false);
    }
  }, [aiPrompt, aiLoading, onAIReport]);

  const handlePresetClick = (preset: string) => {
    setAIPrompt(preset);
    setAIResult(null);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-primary)',
          }}
        >
          <FileText size={20} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)', margin: 0 }}>
            Reports &amp; Analytics
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Generate, customise, and download portfolio reports
          </p>
        </div>
      </div>

      {/* Main grid: Generate Reports (2/3) + AI Reports (1/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* ── Section 1: Generate Reports ────────────────────── */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)', marginBottom: 16 }}>
            Generate Reports
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {REPORT_CARDS.map((card) => {
              const Icon = card.icon;
              const isLoading = loadingType === card.type;
              return (
                <div
                  key={card.type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 10,
                    backgroundColor: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border)',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: card.bgColor,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color={card.color} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {card.title}
                      </span>
                      <span
                        className="text-[10px] font-bold"
                        style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: card.bgColor,
                          color: card.color,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                      {card.description}
                    </p>
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={() => handleGenerate(card.type)}
                    disabled={isLoading || (loadingType !== null && loadingType !== card.type)}
                    className="text-xs font-semibold"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: card.color,
                      color: '#fff',
                      cursor: isLoading ? 'wait' : 'pointer',
                      opacity: loadingType !== null && loadingType !== card.type ? 0.4 : 1,
                      transition: 'opacity 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 2: AI-Powered Reports ──────────────────── */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)', margin: 0 }}>
              AI-Powered Reports
            </h2>
          </div>

          {/* Text input */}
          <textarea
            value={aiPrompt}
            onChange={(e) => setAIPrompt(e.target.value)}
            placeholder="Describe what you need..."
            rows={3}
            className="text-sm"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text)',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              marginBottom: 10,
            }}
          />

          {/* Preset chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {PRESET_PROMPTS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className="text-xs"
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: '1px solid var(--color-border)',
                  backgroundColor:
                    aiPrompt === preset ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                  color: aiPrompt === preset ? '#fff' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={handleAIGenerate}
            disabled={aiLoading || !aiPrompt.trim()}
            className="text-xs font-semibold"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              cursor: aiLoading ? 'wait' : 'pointer',
              opacity: !aiPrompt.trim() ? 0.5 : 1,
              marginBottom: aiResult ? 12 : 0,
              width: '100%',
            }}
          >
            {aiLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send size={14} />
                Generate with AI
              </>
            )}
          </button>

          {/* AI result area */}
          {aiResult && (
            <div
              className="text-xs"
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                lineHeight: 1.7,
                overflowY: 'auto',
                maxHeight: 260,
                whiteSpace: 'pre-wrap',
              }}
            >
              {aiResult}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Recent Reports ──────────────────────── */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)', marginBottom: 16 }}>
          Recent Reports
        </h2>

        {recentReports.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 0',
              gap: 8,
            }}
          >
            <Clock size={28} style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
              No reports generated yet
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
              Generated reports will appear here for quick re-download
            </p>
          </div>
        ) : (
          /* Table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  className="text-xs font-semibold"
                  style={{ color: 'var(--color-text-muted)', textAlign: 'left' }}
                >
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                    Type
                  </th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                    Generated
                  </th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                    Format
                  </th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        className="text-xs font-semibold"
                        style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          backgroundColor: TYPE_BADGE_COLORS[report.type].bg,
                          color: TYPE_BADGE_COLORS[report.type].color,
                        }}
                      >
                        {TYPE_LABELS[report.type]}
                      </span>
                    </td>
                    <td className="text-xs" style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                      {formatDateTime(report.generatedAt)}
                    </td>
                    <td className="text-xs" style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                      {report.format}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <button
                        onClick={() => triggerDownload(report.blob, report.filename)}
                        className="text-xs font-semibold"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface-raised)',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
