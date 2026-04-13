// ============================================================
// KOGVANTAGE -- Snapshot Service
// Stores and retrieves portfolio snapshots for comparison
// Server-side only -- no 'use client'
// ============================================================

import { getDb } from '@/server/db/sqlite';
import { randomUUID } from 'crypto';

// =====================
// Types
// =====================

export interface SnapshotMeta {
  id: string;
  label: string;
  type: string;
  createdAt: string;
}

export interface Snapshot extends SnapshotMeta {
  data: Record<string, unknown>;
}

interface SnapshotRow {
  id: string;
  snapshot_data: string;
  label: string;
  type: string;
  created_at: string;
}

// =====================
// Service Methods
// =====================

export function saveSnapshot(
  snapshot: Record<string, unknown>,
  label: string,
  type: string = 'manual',
): SnapshotMeta {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO report_snapshots (id, snapshot_data, label, type, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(id, JSON.stringify(snapshot), label, type);

  return { id, label, type, createdAt: new Date().toISOString() };
}

export function listSnapshots(): SnapshotMeta[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, label, type, created_at FROM report_snapshots ORDER BY created_at DESC')
    .all() as Pick<SnapshotRow, 'id' | 'label' | 'type' | 'created_at'>[];

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    type: row.type,
    createdAt: row.created_at,
  }));
}

export function getSnapshot(id: string): Snapshot | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM report_snapshots WHERE id = ?')
    .get(id) as SnapshotRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    label: row.label,
    type: row.type,
    data: JSON.parse(row.snapshot_data),
    createdAt: row.created_at,
  };
}

export function deleteSnapshot(id: string): void {
  const db = getDb();
  const result = db.prepare('DELETE FROM report_snapshots WHERE id = ?').run(id);
  if (result.changes === 0) {
    throw new Error(`Snapshot not found: ${id}`);
  }
}

export function getLatestSnapshot(type?: string): Snapshot | null {
  const db = getDb();
  let row: SnapshotRow | undefined;

  if (type) {
    row = db
      .prepare('SELECT * FROM report_snapshots WHERE type = ? ORDER BY created_at DESC LIMIT 1')
      .get(type) as SnapshotRow | undefined;
  } else {
    row = db
      .prepare('SELECT * FROM report_snapshots ORDER BY created_at DESC LIMIT 1')
      .get() as SnapshotRow | undefined;
  }

  if (!row) return null;

  return {
    id: row.id,
    label: row.label,
    type: row.type,
    data: JSON.parse(row.snapshot_data),
    createdAt: row.created_at,
  };
}
