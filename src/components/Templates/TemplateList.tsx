'use client';

import {
  Pencil,
  Trash2,
  Star,
  Plus,
  FileText,
  Presentation,
  Sheet,
  CheckCircle2,
} from 'lucide-react';
import type { CorporateTemplate } from '@/server/services/templates/TemplateService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateListProps {
  templates: CorporateTemplate[];
  activeId?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetActive: (id: string) => void;
  onCreate: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<CorporateTemplate['type'], string> = {
  status_report: 'Status Report',
  gate_review: 'Gate Review',
  steering_committee: 'Steering Committee',
  executive_brief: 'Executive Brief',
};

const TYPE_COLORS: Record<CorporateTemplate['type'], string> = {
  status_report: 'bg-blue-500/15 text-blue-400',
  gate_review: 'bg-amber-500/15 text-amber-400',
  steering_committee: 'bg-purple-500/15 text-purple-400',
  executive_brief: 'bg-emerald-500/15 text-emerald-400',
};

function FormatIcon({ format }: { format: CorporateTemplate['format'] }) {
  switch (format) {
    case 'pptx':
      return <Presentation size={13} />;
    case 'docx':
      return <FileText size={13} />;
    case 'xlsx':
      return <Sheet size={13} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TemplateList({
  templates,
  activeId,
  onEdit,
  onDelete,
  onSetActive,
  onCreate,
}: TemplateListProps) {
  // Empty state
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] px-8 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
          <FileText size={28} className="text-[var(--muted-foreground)]" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-[var(--foreground)]">
          No templates yet
        </h3>
        <p className="mb-6 max-w-sm text-sm text-[var(--muted-foreground)]">
          Create your first corporate template to define the look, feel, and tone of your
          governance reports.
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--ring)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Create your first template
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Corporate Templates
          <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
            ({templates.length})
          </span>
        </h2>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--ring)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((tpl) => {
          const isActive = tpl.id === activeId;

          return (
            <div
              key={tpl.id}
              className={`relative rounded-xl border bg-[var(--card)] p-5 transition-shadow hover:shadow-md ${
                isActive
                  ? 'border-[var(--ring)] ring-1 ring-[var(--ring)]'
                  : 'border-[var(--border)]'
              }`}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-[var(--ring)] px-2.5 py-0.5 text-xs font-medium text-white">
                  <CheckCircle2 size={12} />
                  Active
                </div>
              )}

              {/* Color palette dots */}
              <div className="mb-3 flex items-center gap-1.5">
                {(tpl.colorPalette?.length ? tpl.colorPalette : ['#888', '#888', '#888', '#888', '#888']).map(
                  (color, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ),
                )}
              </div>

              {/* Name */}
              <h3 className="mb-2 text-base font-semibold text-[var(--foreground)] truncate">
                {tpl.name}
              </h3>

              {/* Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    TYPE_COLORS[tpl.type]
                  }`}
                >
                  {TYPE_LABELS[tpl.type]}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                  <FormatIcon format={tpl.format} />
                  {tpl.format.toUpperCase()}
                </span>
              </div>

              {/* Meta */}
              <div className="mb-4 text-xs text-[var(--muted-foreground)] space-y-0.5">
                <div>
                  Font: {tpl.fontPrimary}
                  {tpl.fontHeading !== tpl.fontPrimary && ` / ${tpl.fontHeading}`}
                </div>
                <div>Style: {tpl.languageStyle}</div>
                {tpl.sectionStructure?.length > 0 && (
                  <div>{tpl.sectionStructure.length} sections defined</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3">
                <button
                  onClick={() => onEdit(tpl.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  <Pencil size={13} />
                  Edit
                </button>
                {!isActive && (
                  <button
                    onClick={() => onSetActive(tpl.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    <Star size={13} />
                    Set Active
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => onDelete(tpl.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
