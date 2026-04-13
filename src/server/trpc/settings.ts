// ============================================================
// KOGVANTAGE — App Settings tRPC Procedures
// ============================================================

import { z } from 'zod';
import { router, publicProcedure } from './init';
import { getDb } from '@/server/db/sqlite';

export const settingsRouter = router({
  getAll: publicProcedure.query(() => {
    const db = getDb();
    const rows = db
      .prepare('SELECT key, value FROM app_settings')
      .all() as { key: string; value: string }[];

    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }),

  get: publicProcedure
    .input(z.object({ key: z.string().min(1) }))
    .query(({ input }) => {
      const db = getDb();
      const row = db
        .prepare('SELECT value FROM app_settings WHERE key = ?')
        .get(input.key) as { value: string } | undefined;
      return row?.value ?? null;
    }),

  set: publicProcedure
    .input(
      z.object({
        key: z.string().min(1),
        value: z.string(),
      })
    )
    .mutation(({ input }) => {
      const db = getDb();
      db.prepare(
        'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      ).run(input.key, input.value);
      return { key: input.key, value: input.value };
    }),
});
