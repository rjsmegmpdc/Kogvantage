// ============================================================
// KOGVANTAGE — Financial Coordinator tRPC Procedures
// Full sub-router for financial coordination services
// ============================================================

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from './init';
import { getDb } from '@/server/db/sqlite';
import { TimesheetImportService } from '@/server/services/coordinator/TimesheetImportService';
import { ActualsImportService } from '@/server/services/coordinator/ActualsImportService';
import { LabourRatesImportService } from '@/server/services/coordinator/LabourRatesImportService';
import { ResourceImportService } from '@/server/services/coordinator/ResourceImportService';
import { FinanceLedgerService } from '@/server/services/coordinator/FinanceLedgerService';

// ── Service Singletons ────────────────────────────────────────
const timesheetService = new TimesheetImportService();
const actualsService = new ActualsImportService();
const labourRatesService = new LabourRatesImportService();
const resourceImportService = new ResourceImportService();
const financeLedgerService = new FinanceLedgerService();

// ── Zod Schemas ───────────────────────────────────────────────

const contractTypeEnum = z.enum(['FTE', 'SOW', 'External Squad']);

const createResourceSchema = z.object({
  name: z.string().min(1, 'Resource name is required'),
  email: z.string().email().optional().or(z.literal('')),
  work_area: z.string().optional(),
  activity_type_cap: z.string().optional(),
  activity_type_opx: z.string().optional(),
  contract_type: contractTypeEnum,
  employee_id: z.string().optional(),
  ado_identity_id: z.string().optional(),
});

const updateResourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  work_area: z.string().optional(),
  activity_type_cap: z.string().optional(),
  activity_type_opx: z.string().optional(),
  contract_type: contractTypeEnum.optional(),
  employee_id: z.string().optional(),
  ado_identity_id: z.string().optional(),
});

// ── Router ────────────────────────────────────────────────────

export const coordinatorRouter = router({
  // ============================================================
  // IMPORT PROCEDURES
  // ============================================================

  importTimesheets: publicProcedure
    .input(z.object({ csvContent: z.string().min(1, 'CSV content is required') }))
    .mutation(async ({ input }) => {
      return timesheetService.importTimesheets(input.csvContent);
    }),

  importActuals: publicProcedure
    .input(z.object({ csvContent: z.string().min(1, 'CSV content is required') }))
    .mutation(async ({ input }) => {
      return actualsService.importActuals(input.csvContent);
    }),

  importLabourRates: publicProcedure
    .input(z.object({
      csvContent: z.string().min(1, 'CSV content is required'),
      fiscalYear: z.string().regex(/^FY\d{2}$/, 'Fiscal year must match FY## format (e.g., FY26)'),
    }))
    .mutation(async ({ input }) => {
      return labourRatesService.importLabourRates(input.csvContent, input.fiscalYear);
    }),

  importResources: publicProcedure
    .input(z.object({ csvContent: z.string().min(1, 'CSV content is required') }))
    .mutation(async ({ input }) => {
      return resourceImportService.importResources(input.csvContent);
    }),

  // ============================================================
  // RESOURCE MANAGEMENT
  // ============================================================

  listResources: publicProcedure.query(() => {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM financial_resources
      ORDER BY name ASC
    `).all();
  }),

  getResource: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const db = getDb();
      const resource = db.prepare(`
        SELECT * FROM financial_resources WHERE id = ?
      `).get(input.id);

      if (!resource) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Resource with id "${input.id}" not found`,
        });
      }

      return resource;
    }),

  createResource: publicProcedure
    .input(createResourceSchema)
    .mutation(({ input }) => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = randomUUID();

      db.prepare(`
        INSERT INTO financial_resources (
          id, name, email, work_area,
          activity_type_cap, activity_type_opx, contract_type, employee_id,
          ado_identity_id, created_at, updated_at
        ) VALUES (
          @id, @name, @email, @work_area,
          @activity_type_cap, @activity_type_opx, @contract_type, @employee_id,
          @ado_identity_id, @created_at, @updated_at
        )
      `).run({
        id,
        name: input.name,
        email: input.email ?? '',
        work_area: input.work_area ?? '',
        activity_type_cap: input.activity_type_cap ?? '',
        activity_type_opx: input.activity_type_opx ?? '',
        contract_type: input.contract_type,
        employee_id: input.employee_id ?? '',
        ado_identity_id: input.ado_identity_id ?? null,
        created_at: now,
        updated_at: now,
      });

      return db.prepare('SELECT * FROM financial_resources WHERE id = ?').get(id);
    }),

  updateResource: publicProcedure
    .input(updateResourceSchema)
    .mutation(({ input }) => {
      const db = getDb();
      const { id, ...fields } = input;

      // Verify resource exists
      const existing = db.prepare('SELECT * FROM financial_resources WHERE id = ?').get(id);
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Resource with id "${id}" not found`,
        });
      }

      // Build dynamic SET clause from provided fields
      const setClauses: string[] = [];
      const params: Record<string, any> = { id };

      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          setClauses.push(`${key} = @${key}`);
          params[key] = value;
        }
      }

      if (setClauses.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No fields provided for update',
        });
      }

      setClauses.push('updated_at = @updated_at');
      params.updated_at = new Date().toISOString();

      db.prepare(`
        UPDATE financial_resources
        SET ${setClauses.join(', ')}
        WHERE id = @id
      `).run(params);

      return db.prepare('SELECT * FROM financial_resources WHERE id = ?').get(id);
    }),

  deleteResource: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const db = getDb();

      // Verify resource exists
      const existing = db.prepare('SELECT * FROM financial_resources WHERE id = ?').get(input.id);
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Resource with id "${input.id}" not found`,
        });
      }

      // Check for active commitments
      const activeCommitments = db.prepare(`
        SELECT COUNT(*) as count FROM resource_commitments
        WHERE resource_id = ?
      `).get(input.id) as { count: number } | undefined;

      if (activeCommitments && activeCommitments.count > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot delete resource: ${activeCommitments.count} active commitment(s) exist. Remove commitments first.`,
        });
      }

      // Check for feature allocations
      const allocations = db.prepare(`
        SELECT COUNT(*) as count FROM feature_allocations
        WHERE resource_id = ?
      `).get(input.id) as { count: number } | undefined;

      if (allocations && allocations.count > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot delete resource: ${allocations.count} feature allocation(s) exist. Remove allocations first.`,
        });
      }

      db.prepare('DELETE FROM financial_resources WHERE id = ?').run(input.id);

      return { success: true, id: input.id };
    }),

  // ============================================================
  // FINANCE LEDGER
  // ============================================================

  getLedger: publicProcedure
    .input(z.object({
      projectId: z.string().optional(),
      month: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return financeLedgerService.getFinanceLedger(input?.projectId, input?.month);
    }),

  getSummary: publicProcedure
    .input(z.object({
      projectId: z.string().optional(),
      month: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return financeLedgerService.getFinanceSummary(input?.projectId, input?.month);
    }),

  getAvailableMonths: publicProcedure.query(async () => {
    return financeLedgerService.getAvailableMonths();
  }),

  // ============================================================
  // VARIANCE ALERTS
  // ============================================================

  listAlerts: publicProcedure
    .input(z.object({
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      type: z.enum(['commitment', 'effort', 'cost', 'schedule', 'unauthorized']).optional(),
      acknowledged: z.boolean().optional(),
    }).optional())
    .query(({ input }) => {
      const db = getDb();

      const conditions: string[] = [];
      const params: any[] = [];

      if (input?.severity) {
        conditions.push('severity = ?');
        params.push(input.severity);
      }

      if (input?.type) {
        conditions.push('alert_type = ?');
        params.push(input.type);
      }

      if (input?.acknowledged !== undefined) {
        conditions.push('acknowledged = ?');
        params.push(input.acknowledged ? 1 : 0);
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      return db.prepare(`
        SELECT * FROM variance_alerts
        ${whereClause}
        ORDER BY created_at DESC
      `).all(...params);
    }),

  acknowledgeAlert: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const db = getDb();

      const alert = db.prepare('SELECT * FROM variance_alerts WHERE id = ?').get(input.id);
      if (!alert) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Alert with id "${input.id}" not found`,
        });
      }

      const now = new Date().toISOString();

      db.prepare(`
        UPDATE variance_alerts
        SET acknowledged = 1, acknowledged_at = ?
        WHERE id = ?
      `).run(now, input.id);

      return db.prepare('SELECT * FROM variance_alerts WHERE id = ?').get(input.id);
    }),

  getAlertStats: publicProcedure.query(() => {
    const db = getDb();

    const stats = db.prepare(`
      SELECT
        severity,
        COUNT(*) as total,
        SUM(CASE WHEN acknowledged = 0 THEN 1 ELSE 0 END) as unacknowledged
      FROM variance_alerts
      GROUP BY severity
    `).all() as Array<{ severity: string; total: number; unacknowledged: number }>;

    // Ensure all severity levels are represented
    const result: Record<string, { total: number; unacknowledged: number }> = {
      low: { total: 0, unacknowledged: 0 },
      medium: { total: 0, unacknowledged: 0 },
      high: { total: 0, unacknowledged: 0 },
      critical: { total: 0, unacknowledged: 0 },
    };

    for (const row of stats) {
      result[row.severity] = {
        total: row.total,
        unacknowledged: row.unacknowledged,
      };
    }

    return result;
  }),

  // ============================================================
  // DASHBOARD SUMMARY
  // ============================================================

  summary: publicProcedure.query(() => {
    const db = getDb();

    const timesheetCount = (
      db.prepare('SELECT COUNT(*) as count FROM raw_timesheets').get() as { count: number }
    ).count;

    const actualsCount = (
      db.prepare('SELECT COUNT(*) as count FROM raw_actuals').get() as { count: number }
    ).count;

    const resourceCount = (
      db.prepare('SELECT COUNT(*) as count FROM financial_resources').get() as { count: number }
    ).count;

    const alertCount = (
      db.prepare('SELECT COUNT(*) as count FROM variance_alerts WHERE acknowledged = 0').get() as {
        count: number;
      }
    ).count;

    return {
      timesheetRows: timesheetCount,
      actualsRows: actualsCount,
      resources: resourceCount,
      unacknowledgedAlerts: alertCount,
    };
  }),

  // ============================================================
  // IMPORT COUNTS
  // ============================================================

  getImportCounts: publicProcedure.query(() => {
    const db = getDb();

    const timesheets = (
      db.prepare('SELECT COUNT(*) as count FROM raw_timesheets').get() as { count: number }
    ).count;

    const actuals = (
      db.prepare('SELECT COUNT(*) as count FROM raw_actuals').get() as { count: number }
    ).count;

    const labourRates = (
      db.prepare('SELECT COUNT(*) as count FROM raw_labour_rates').get() as { count: number }
    ).count;

    return {
      raw_timesheets: timesheets,
      raw_actuals: actuals,
      raw_labour_rates: labourRates,
    };
  }),
});
