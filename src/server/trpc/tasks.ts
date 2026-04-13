// ============================================================
// KOGVANTAGE — Task CRUD tRPC Procedures
// ============================================================

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { router, publicProcedure } from './init';
import { getDb } from '@/server/db/sqlite';

const taskStatusEnum = z.enum(['planned', 'in-progress', 'blocked', 'done']);

const createTaskSchema = z.object({
  project_id: z.string().uuid(),
  epic_id: z.string().uuid().nullable().default(null),
  title: z.string().min(1, 'Title is required'),
  status: taskStatusEnum.default('planned'),
  start_date: z.string().default(''),
  end_date: z.string().default(''),
  effort_hours: z.number().min(0).default(0),
  assigned_resources: z.string().default('[]'),
  percent_complete: z.number().int().min(0).max(100).default(0),
  subway_station_type: z.string().nullable().default(null),
  subway_label_top: z.string().nullable().default(null),
  subway_label_bottom: z.string().nullable().default(null),
  subway_description: z.string().nullable().default(null),
});

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  epic_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).optional(),
  status: taskStatusEnum.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  effort_hours: z.number().min(0).optional(),
  assigned_resources: z.string().optional(),
  percent_complete: z.number().int().min(0).max(100).optional(),
  subway_station_type: z.string().nullable().optional(),
  subway_label_top: z.string().nullable().optional(),
  subway_label_bottom: z.string().nullable().optional(),
  subway_description: z.string().nullable().optional(),
});

export const tasksRouter = router({
  list: publicProcedure
    .input(
      z.object({
        project_id: z.string().uuid().optional(),
      }).optional()
    )
    .query(({ input }) => {
      const db = getDb();
      if (input?.project_id) {
        return db
          .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY start_date ASC, title ASC')
          .all(input.project_id);
      }
      return db
        .prepare('SELECT * FROM tasks ORDER BY start_date ASC, title ASC')
        .all();
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input }) => {
      const db = getDb();
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(input.id);
      if (!task) {
        throw new Error(`Task not found: ${input.id}`);
      }
      return task;
    }),

  create: publicProcedure
    .input(createTaskSchema)
    .mutation(({ input }) => {
      const db = getDb();
      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO tasks (
          id, project_id, epic_id, title, status,
          start_date, end_date, effort_hours, assigned_resources,
          percent_complete, subway_station_type, subway_label_top,
          subway_label_bottom, subway_description,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          datetime('now'), datetime('now')
        )
      `);
      stmt.run(
        id, input.project_id, input.epic_id, input.title, input.status,
        input.start_date, input.end_date, input.effort_hours, input.assigned_resources,
        input.percent_complete, input.subway_station_type, input.subway_label_top,
        input.subway_label_bottom, input.subway_description,
      );
      return { id };
    }),

  update: publicProcedure
    .input(updateTaskSchema)
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
        .prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`)
        .run(...values);

      return { id, updated: result.changes > 0 };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => {
      const db = getDb();
      const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(input.id);
      return { id: input.id, deleted: result.changes > 0 };
    }),

  getByProject: publicProcedure
    .input(z.object({ project_id: z.string().uuid() }))
    .query(({ input }) => {
      const db = getDb();
      return db
        .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY start_date ASC, title ASC')
        .all(input.project_id);
    }),
});
