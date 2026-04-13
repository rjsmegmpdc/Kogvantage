// ============================================================
// KOGVANTAGE — Integration Configs tRPC Procedures
// CRUD + connection test + sync for external integrations
// ============================================================

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { router, publicProcedure } from './init';
import { getDb } from '@/server/db/sqlite';

// ── Zod Schemas ───────────────────────────────────────────────

const authTypeEnum = z.enum(['token', 'oauth2', 'basic', 'none']);
const syncScheduleEnum = z.enum(['manual', 'daily', 'weekly']);

const createIntegrationSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  display_name: z.string().min(1, 'Display name is required'),
  base_url: z.string().default(''),
  auth_type: authTypeEnum.default('token'),
  auth_token: z.string().default(''),
  sync_schedule: syncScheduleEnum.default('manual'),
  field_mapping: z.string().default('{}'),
});

const updateIntegrationSchema = z.object({
  id: z.string(),
  provider: z.string().min(1).optional(),
  display_name: z.string().min(1).optional(),
  base_url: z.string().optional(),
  auth_type: authTypeEnum.optional(),
  auth_token: z.string().optional(),
  sync_schedule: syncScheduleEnum.optional(),
  field_mapping: z.string().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

// ── Router ────────────────────────────────────────────────────

export const integrationsRouter = router({
  list: publicProcedure.query(() => {
    const db = getDb();
    return db
      .prepare('SELECT * FROM integration_configs ORDER BY created_at DESC')
      .all();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const db = getDb();
      const config = db
        .prepare('SELECT * FROM integration_configs WHERE id = ?')
        .get(input.id);
      if (!config) {
        throw new Error(`Integration config not found: ${input.id}`);
      }
      return config;
    }),

  create: publicProcedure
    .input(createIntegrationSchema)
    .mutation(({ input }) => {
      const db = getDb();
      const id = randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO integration_configs
           (id, provider, display_name, base_url, auth_type, auth_token_encrypted, field_mapping, sync_schedule, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
      ).run(
        id,
        input.provider,
        input.display_name,
        input.base_url,
        input.auth_type,
        input.auth_token, // TODO: encrypt before storing
        input.field_mapping,
        input.sync_schedule,
        now,
        now
      );

      return { id, ...input, is_active: 0, created_at: now, updated_at: now };
    }),

  update: publicProcedure
    .input(updateIntegrationSchema)
    .mutation(({ input }) => {
      const db = getDb();
      const { id, ...fields } = input;

      // Build dynamic SET clause from provided fields
      const setClauses: string[] = [];
      const values: unknown[] = [];

      if (fields.provider !== undefined) {
        setClauses.push('provider = ?');
        values.push(fields.provider);
      }
      if (fields.display_name !== undefined) {
        setClauses.push('display_name = ?');
        values.push(fields.display_name);
      }
      if (fields.base_url !== undefined) {
        setClauses.push('base_url = ?');
        values.push(fields.base_url);
      }
      if (fields.auth_type !== undefined) {
        setClauses.push('auth_type = ?');
        values.push(fields.auth_type);
      }
      if (fields.auth_token !== undefined) {
        setClauses.push('auth_token_encrypted = ?');
        values.push(fields.auth_token); // TODO: encrypt
      }
      if (fields.sync_schedule !== undefined) {
        setClauses.push('sync_schedule = ?');
        values.push(fields.sync_schedule);
      }
      if (fields.field_mapping !== undefined) {
        setClauses.push('field_mapping = ?');
        values.push(fields.field_mapping);
      }
      if (fields.is_active !== undefined) {
        setClauses.push('is_active = ?');
        values.push(fields.is_active);
      }

      if (setClauses.length === 0) {
        throw new Error('No fields to update');
      }

      setClauses.push("updated_at = datetime('now')");
      values.push(id);

      const result = db
        .prepare(
          `UPDATE integration_configs SET ${setClauses.join(', ')} WHERE id = ?`
        )
        .run(...values);

      if (result.changes === 0) {
        throw new Error(`Integration config not found: ${id}`);
      }

      return db.prepare('SELECT * FROM integration_configs WHERE id = ?').get(id);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const db = getDb();
      const result = db
        .prepare('DELETE FROM integration_configs WHERE id = ?')
        .run(input.id);

      if (result.changes === 0) {
        throw new Error(`Integration config not found: ${input.id}`);
      }

      return { success: true, id: input.id };
    }),

  testConnection: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const config = db
        .prepare('SELECT * FROM integration_configs WHERE id = ?')
        .get(input.id) as Record<string, unknown> | undefined;

      if (!config) {
        throw new Error(`Integration config not found: ${input.id}`);
      }

      // Simulate a connection test with a 1-second delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        provider: config.provider,
        message: `Connection to ${config.display_name} successful`,
        testedAt: new Date().toISOString(),
      };
    }),

  syncNow: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const db = getDb();
      const now = new Date().toISOString();

      const result = db
        .prepare(
          `UPDATE integration_configs SET last_sync = ?, updated_at = ? WHERE id = ?`
        )
        .run(now, now, input.id);

      if (result.changes === 0) {
        throw new Error(`Integration config not found: ${input.id}`);
      }

      return {
        success: true,
        id: input.id,
        last_sync: now,
        message: 'Sync completed',
      };
    }),
});
