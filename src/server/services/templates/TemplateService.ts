// ============================================================
// KOGVANTAGE -- Corporate Template Service
// CRUD operations for governance_templates + active template
// Server-side only -- no 'use client'
// ============================================================

import { getDb } from '@/server/db/sqlite';

// =====================
// Types
// =====================

export interface CorporateTemplate {
  id: string;
  name: string;
  type: 'status_report' | 'gate_review' | 'steering_committee' | 'executive_brief';
  format: 'pptx' | 'docx' | 'xlsx';
  colorPalette: string[];
  fontPrimary: string;
  fontHeading: string;
  languageStyle: 'formal' | 'semi-formal' | 'concise';
  sectionStructure: string[];
  toneExamples: string[];
  logoPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  type: CorporateTemplate['type'];
  format: CorporateTemplate['format'];
  colorPalette?: string[];
  fontPrimary?: string;
  fontHeading?: string;
  languageStyle?: CorporateTemplate['languageStyle'];
  sectionStructure?: string[];
  toneExamples?: string[];
  logoPath?: string | null;
}

export interface UpdateTemplateInput {
  name?: string;
  type?: CorporateTemplate['type'];
  format?: CorporateTemplate['format'];
  colorPalette?: string[];
  fontPrimary?: string;
  fontHeading?: string;
  languageStyle?: CorporateTemplate['languageStyle'];
  sectionStructure?: string[];
  toneExamples?: string[];
  logoPath?: string | null;
}

// =====================
// Row → CorporateTemplate mapper
// =====================

interface TemplateRow {
  id: string;
  name: string;
  type: string;
  format: string;
  color_palette: string;
  font_primary: string;
  font_heading: string;
  language_style: string;
  section_structure: string;
  tone_examples: string;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
}

function rowToTemplate(row: TemplateRow): CorporateTemplate {
  return {
    id: row.id,
    name: row.name,
    type: row.type as CorporateTemplate['type'],
    format: row.format as CorporateTemplate['format'],
    colorPalette: JSON.parse(row.color_palette || '[]'),
    fontPrimary: row.font_primary,
    fontHeading: row.font_heading,
    languageStyle: row.language_style as CorporateTemplate['languageStyle'],
    sectionStructure: JSON.parse(row.section_structure || '[]'),
    toneExamples: JSON.parse(row.tone_examples || '[]'),
    logoPath: row.logo_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =====================
// Service Methods
// =====================

export function listTemplates(): CorporateTemplate[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM governance_templates ORDER BY name ASC')
    .all() as TemplateRow[];
  return rows.map(rowToTemplate);
}

export function getTemplate(id: string): CorporateTemplate | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM governance_templates WHERE id = ?')
    .get(id) as TemplateRow | undefined;
  return row ? rowToTemplate(row) : null;
}

export function createTemplate(id: string, data: CreateTemplateInput): CorporateTemplate {
  const db = getDb();
  db.prepare(`
    INSERT INTO governance_templates (
      id, name, type, format,
      color_palette, font_primary, font_heading,
      language_style, section_structure, tone_examples,
      logo_path, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, datetime('now'), datetime('now')
    )
  `).run(
    id,
    data.name,
    data.type,
    data.format,
    JSON.stringify(data.colorPalette ?? []),
    data.fontPrimary ?? 'Calibri',
    data.fontHeading ?? 'Calibri',
    data.languageStyle ?? 'formal',
    JSON.stringify(data.sectionStructure ?? []),
    JSON.stringify(data.toneExamples ?? []),
    data.logoPath ?? null,
  );

  return getTemplate(id)!;
}

export function updateTemplate(id: string, data: UpdateTemplateInput): CorporateTemplate {
  const db = getDb();
  const existing = getTemplate(id);
  if (!existing) {
    throw new Error(`Template not found: ${id}`);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.format !== undefined) { fields.push('format = ?'); values.push(data.format); }
  if (data.colorPalette !== undefined) { fields.push('color_palette = ?'); values.push(JSON.stringify(data.colorPalette)); }
  if (data.fontPrimary !== undefined) { fields.push('font_primary = ?'); values.push(data.fontPrimary); }
  if (data.fontHeading !== undefined) { fields.push('font_heading = ?'); values.push(data.fontHeading); }
  if (data.languageStyle !== undefined) { fields.push('language_style = ?'); values.push(data.languageStyle); }
  if (data.sectionStructure !== undefined) { fields.push('section_structure = ?'); values.push(JSON.stringify(data.sectionStructure)); }
  if (data.toneExamples !== undefined) { fields.push('tone_examples = ?'); values.push(JSON.stringify(data.toneExamples)); }
  if (data.logoPath !== undefined) { fields.push('logo_path = ?'); values.push(data.logoPath); }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE governance_templates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getTemplate(id)!;
}

export function deleteTemplate(id: string): void {
  const db = getDb();
  const result = db.prepare('DELETE FROM governance_templates WHERE id = ?').run(id);
  if (result.changes === 0) {
    throw new Error(`Template not found: ${id}`);
  }
  // If this was the active template, clear the setting
  const active = db
    .prepare("SELECT value FROM app_settings WHERE key = 'active_template_id'")
    .get() as { value: string } | undefined;
  if (active?.value === id) {
    db.prepare("DELETE FROM app_settings WHERE key = 'active_template_id'").run();
  }
}

export function getActiveTemplate(): CorporateTemplate | null {
  const db = getDb();
  const setting = db
    .prepare("SELECT value FROM app_settings WHERE key = 'active_template_id'")
    .get() as { value: string } | undefined;
  if (!setting) return null;
  return getTemplate(setting.value);
}

export function setActiveTemplate(id: string): void {
  const db = getDb();
  // Verify template exists
  const exists = db
    .prepare('SELECT id FROM governance_templates WHERE id = ?')
    .get(id);
  if (!exists) {
    throw new Error(`Template not found: ${id}`);
  }
  db.prepare(`
    INSERT INTO app_settings (key, value) VALUES ('active_template_id', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(id);
}
