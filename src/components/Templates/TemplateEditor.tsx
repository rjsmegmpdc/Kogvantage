'use client';

import { useState, useCallback } from 'react';
import {
  Save,
  X,
  Palette,
  Type,
  FileText,
  Upload,
  Image,
} from 'lucide-react';
import type { CorporateTemplate } from '@/server/services/templates/TemplateService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateEditorProps {
  template?: CorporateTemplate;
  onSave: (data: TemplateFormData) => void;
  onCancel: () => void;
}

export interface TemplateFormData {
  name: string;
  type: CorporateTemplate['type'];
  format: CorporateTemplate['format'];
  colorPalette: string[];
  fontPrimary: string;
  fontHeading: string;
  languageStyle: CorporateTemplate['languageStyle'];
  sectionStructure: string[];
  toneExamples: string[];
  logoPath: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEMPLATE_TYPES: { value: CorporateTemplate['type']; label: string }[] = [
  { value: 'status_report', label: 'Status Report' },
  { value: 'gate_review', label: 'Gate Review' },
  { value: 'steering_committee', label: 'Steering Committee' },
  { value: 'executive_brief', label: 'Executive Brief' },
];

const FORMAT_OPTIONS: { value: CorporateTemplate['format']; label: string }[] = [
  { value: 'pptx', label: 'PowerPoint (.pptx)' },
  { value: 'docx', label: 'Word (.docx)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
];

const FONT_OPTIONS = ['Calibri', 'Arial', 'Inter', 'Roboto', 'Segoe UI'];

const COLOR_LABELS = ['Primary', 'Secondary', 'Accent', 'Success', 'Danger'];
const DEFAULT_COLORS = ['#1e40af', '#64748b', '#8b5cf6', '#16a34a', '#dc2626'];

const LANGUAGE_STYLES: { value: CorporateTemplate['languageStyle']; label: string; desc: string }[] = [
  { value: 'formal', label: 'Formal', desc: 'Full sentences, passive voice accepted' },
  { value: 'semi-formal', label: 'Semi-formal', desc: 'Professional but conversational' },
  { value: 'concise', label: 'Concise', desc: 'Bullet points, minimal prose' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [type, setType] = useState<CorporateTemplate['type']>(template?.type ?? 'status_report');
  const [format, setFormat] = useState<CorporateTemplate['format']>(template?.format ?? 'pptx');
  const [colors, setColors] = useState<string[]>(
    template?.colorPalette?.length === 5
      ? template.colorPalette
      : [...DEFAULT_COLORS],
  );
  const [fontPrimary, setFontPrimary] = useState(template?.fontPrimary ?? 'Calibri');
  const [fontHeading, setFontHeading] = useState(template?.fontHeading ?? 'Calibri');
  const [languageStyle, setLanguageStyle] = useState<CorporateTemplate['languageStyle']>(
    template?.languageStyle ?? 'formal',
  );
  const [sectionText, setSectionText] = useState(
    template?.sectionStructure?.join('\n') ?? '',
  );
  const [toneText, setToneText] = useState(
    template?.toneExamples?.join('\n') ?? '',
  );
  const [logoPath, setLogoPath] = useState<string | null>(template?.logoPath ?? null);

  const updateColor = useCallback((index: number, value: string) => {
    setColors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;

    const data: TemplateFormData = {
      name: name.trim(),
      type,
      format,
      colorPalette: colors,
      fontPrimary,
      fontHeading,
      languageStyle,
      sectionStructure: sectionText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      toneExamples: toneText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      logoPath,
    };

    onSave(data);
  }, [name, type, format, colors, fontPrimary, fontHeading, languageStyle, sectionText, toneText, logoPath, onSave]);

  return (
    <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {template ? 'Edit Template' : 'New Template'}
        </h2>
        <button
          onClick={onCancel}
          className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">Template Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Corporate Status Report Q1"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Type + Format row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">
            <FileText size={14} className="mr-1.5 inline-block" />
            Report Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CorporateTemplate['type'])}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {TEMPLATE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Output Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as CorporateTemplate['format'])}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Color Palette */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--foreground)]">
          <Palette size={14} className="mr-1.5 inline-block" />
          Color Palette
        </label>
        <div className="flex flex-wrap gap-4">
          {COLOR_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
              <div className="relative">
                <input
                  type="color"
                  value={colors[i]}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent p-0.5"
                />
              </div>
              <input
                type="text"
                value={colors[i]}
                onChange={(e) => updateColor(i, e.target.value)}
                className="w-20 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-center text-xs text-[var(--foreground)] font-mono"
                maxLength={7}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">
            <Type size={14} className="mr-1.5 inline-block" />
            Primary Font
          </label>
          <select
            value={fontPrimary}
            onChange={(e) => setFontPrimary(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Heading Font</label>
          <select
            value={fontHeading}
            onChange={(e) => setFontHeading(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Language Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--foreground)]">Language Style</label>
        <div className="flex flex-wrap gap-3">
          {LANGUAGE_STYLES.map((ls) => (
            <label
              key={ls.value}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border px-4 py-3 transition-colors ${
                languageStyle === ls.value
                  ? 'border-[var(--ring)] bg-[var(--ring)]/10'
                  : 'border-[var(--border)] hover:bg-[var(--muted)]'
              }`}
            >
              <input
                type="radio"
                name="languageStyle"
                value={ls.value}
                checked={languageStyle === ls.value}
                onChange={() => setLanguageStyle(ls.value)}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">{ls.label}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{ls.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Section Structure */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">
          Section Structure
          <span className="ml-1.5 text-xs font-normal text-[var(--muted-foreground)]">
            (one section per line)
          </span>
        </label>
        <textarea
          value={sectionText}
          onChange={(e) => setSectionText(e.target.value)}
          placeholder={"Executive Summary\nProject Status Overview\nFinancial Summary\nRisks & Issues\nNext Steps"}
          rows={5}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono"
        />
      </div>

      {/* Tone Examples */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">
          Tone Examples
          <span className="ml-1.5 text-xs font-normal text-[var(--muted-foreground)]">
            (one example per line)
          </span>
        </label>
        <textarea
          value={toneText}
          onChange={(e) => setToneText(e.target.value)}
          placeholder={"The project remains on track for delivery in Q3.\nBudget utilisation is within approved thresholds.\nMitigation actions have been identified and assigned."}
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono"
        />
      </div>

      {/* Logo Upload */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">
          <Image size={14} className="mr-1.5 inline-block" />
          Logo
        </label>
        {logoPath ? (
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPath} alt="Logo" className="h-8 w-8 object-contain" />
            </div>
            <span className="flex-1 truncate text-sm text-[var(--foreground)]">{logoPath}</span>
            <button
              onClick={() => setLogoPath(null)}
              className="text-xs text-red-500 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/50 px-4 py-6">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Upload size={24} className="text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">
                Logo upload will be available in a future update.
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Or paste a path below:
              </p>
              <input
                type="text"
                placeholder="/logos/company-logo.png"
                onChange={(e) => setLogoPath(e.target.value || null)}
                className="mt-1 w-64 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
        <button
          onClick={onCancel}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--ring)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {template ? 'Save Changes' : 'Create Template'}
        </button>
      </div>
    </div>
  );
}
