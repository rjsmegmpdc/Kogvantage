// ============================================================
// KOGVANTAGE — Project CRUD tRPC Procedures
// ============================================================

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { router, publicProcedure } from './init';
import { getDb } from '@/server/db/sqlite';

const projectStatusEnum = z.enum(['planned', 'in-progress', 'blocked', 'done', 'archived']);
const financialTreatmentEnum = z.enum(['CAPEX', 'OPEX', 'MIXED']);

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  status: projectStatusEnum.default('planned'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  budget_cents: z.number().int().min(0).default(0),
  financial_treatment: financialTreatmentEnum.default('OPEX'),
  lane: z.string().default(''),
  pm_name: z.string().default(''),
  row_position: z.number().int().default(0),
  health: z.number().int().min(0).max(100).default(50),
  subway_color: z.string().nullable().default(null),
  subway_sort_order: z.number().int().default(0),
});

const updateProjectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: projectStatusEnum.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget_cents: z.number().int().min(0).optional(),
  financial_treatment: financialTreatmentEnum.optional(),
  lane: z.string().optional(),
  pm_name: z.string().optional(),
  row_position: z.number().int().optional(),
  health: z.number().int().min(0).max(100).optional(),
  subway_color: z.string().nullable().optional(),
  subway_sort_order: z.number().int().optional(),
});

export const projectsRouter = router({
  list: publicProcedure.query(() => {
    const db = getDb();
    return db
      .prepare('SELECT * FROM projects ORDER BY subway_sort_order ASC, title ASC')
      .all();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input }) => {
      const db = getDb();
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(input.id);
      if (!project) {
        throw new Error(`Project not found: ${input.id}`);
      }
      return project;
    }),

  create: publicProcedure
    .input(createProjectSchema)
    .mutation(({ input }) => {
      const db = getDb();
      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO projects (
          id, title, description, status, start_date, end_date,
          budget_cents, financial_treatment, lane, pm_name,
          row_position, health, subway_color, subway_sort_order,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          datetime('now'), datetime('now')
        )
      `);
      stmt.run(
        id, input.title, input.description, input.status,
        input.start_date, input.end_date, input.budget_cents,
        input.financial_treatment, input.lane, input.pm_name,
        input.row_position, input.health, input.subway_color,
        input.subway_sort_order,
      );
      return { id };
    }),

  update: publicProcedure
    .input(updateProjectSchema)
    .mutation(({ input }) => {
      const db = getDb();
      const { id, ...fields } = input;
      const setClauses: string[] = [];
      const values: unknown[] = [];

      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          setClauses.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (setClauses.length === 0) {
        return { id, updated: false };
      }

      setClauses.push("updated_at = datetime('now')");
      values.push(id);

      const result = db
        .prepare(`UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`)
        .run(...values);

      return { id, updated: result.changes > 0 };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => {
      const db = getDb();
      const result = db.prepare('DELETE FROM projects WHERE id = ?').run(input.id);
      return { id: input.id, deleted: result.changes > 0 };
    }),

  getStats: publicProcedure.query(() => {
    const db = getDb();
    const rows = db
      .prepare('SELECT status, COUNT(*) as count FROM projects GROUP BY status')
      .all() as { status: string; count: number }[];

    const stats: Record<string, number> = {
      planned: 0,
      'in-progress': 0,
      blocked: 0,
      done: 0,
      archived: 0,
    };
    for (const row of rows) {
      stats[row.status] = row.count;
    }
    stats.total = Object.values(stats).reduce((a, b) => a + b, 0);
    return stats;
  }),
});
