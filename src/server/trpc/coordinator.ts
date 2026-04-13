// ============================================================
// KOGVANTAGE — Financial Coordinator tRPC Procedures
// Placeholder sub-router for financial coordination services
// ============================================================

import { router, publicProcedure } from './init';
import { getDb } from '@/server/db/sqlite';

export const coordinatorRouter = router({
  // Placeholder: returns summary of financial data availability
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
});
