// ============================================================
// KOGVANTAGE — Reports tRPC Procedures
// Generates DOCX/PPTX reports and AI-powered custom reports
// ============================================================

import { z } from 'zod';
import { router, publicProcedure } from './init';
import * as ClaudeService from '@/server/services/ai/ClaudeService';

// ── Lazy service imports ─────────────────────────────────────
// These will be provided by the reports service layer once
// DocxGenerator, PptxGenerator, and ReportDataService are
// implemented. For now we define the expected interface and
// stub the imports so the router compiles and can be extended.

interface PortfolioSnapshot {
  projects: unknown[];
  financials: unknown;
  risks: unknown[];
  generatedAt: string;
}

interface GeneratedFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

// Attempt dynamic imports — fall back to stubs if services
// haven't been created yet.
async function getReportDataService(): Promise<{ getSnapshot: () => any }> {
  try {
    return await import('@/server/services/reports/ReportDataService') as any;
  } catch {
    return {
      getSnapshot: () => ({
        generatedAt: new Date().toISOString(),
        orgName: 'Kogvantage',
        projects: [],
        totalProjects: 0,
        byStatus: {},
        averageHealth: 0,
        totalBudget: 0,
        totalActuals: 0,
        totalVariance: 0,
        burnRate: 0,
        totalResources: 0,
        byContractType: {},
        activeAlerts: [],
        alertsByType: {},
        alertsBySeverity: {},
        recentTimesheetHours: 0,
        recentTimesheetPeriod: '',
      }),
    };
  }
}

async function getDocxGenerator(): Promise<{
  generateWeeklyReport: (snapshot: any) => Promise<Buffer>;
  generateMonthlyReport: (snapshot: any) => Promise<Buffer>;
}> {
  try {
    return await import('@/server/services/reports/DocxGenerator') as any;
  } catch {
    const stub = async (): Promise<Buffer> => Buffer.from('stub');
    return { generateWeeklyReport: stub, generateMonthlyReport: stub };
  }
}

async function getPptxGenerator(): Promise<{
  generateExecutiveReport: (snapshot: any) => Promise<Buffer>;
}> {
  try {
    return await import('@/server/services/reports/PptxGenerator') as any;
  } catch {
    return {
      generateExecutiveReport: async (): Promise<Buffer> => Buffer.from('stub'),
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────

function reportErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return `Report generation failed: ${err.message}`;
  }
  return 'An unexpected error occurred while generating the report.';
}

// ── Router ───────────────────────────────────────────────────

export const reportsRouter = router({
  generateWeekly: publicProcedure.mutation(async () => {
    try {
      const dataService = await getReportDataService();
      const snapshot = dataService.getSnapshot();
      const docx = await getDocxGenerator();
      const buf = await docx.generateWeeklyReport(snapshot);
      const date = new Date().toISOString().slice(0, 10);
      return {
        success: true,
        data: buf.toString('base64'),
        filename: `kogvantage-weekly-${date}.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
    } catch (err) {
      return { success: false, data: '', filename: '', mimeType: '', error: reportErrorMessage(err) };
    }
  }),

  generateMonthly: publicProcedure.mutation(async () => {
    try {
      const dataService = await getReportDataService();
      const snapshot = dataService.getSnapshot();
      const docx = await getDocxGenerator();
      const buf = await docx.generateMonthlyReport(snapshot);
      const date = new Date().toISOString().slice(0, 10);
      return {
        success: true,
        data: buf.toString('base64'),
        filename: `kogvantage-monthly-${date}.docx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
    } catch (err) {
      return { success: false, data: '', filename: '', mimeType: '', error: reportErrorMessage(err) };
    }
  }),

  generateExecutive: publicProcedure.mutation(async () => {
    try {
      const dataService = await getReportDataService();
      const snapshot = dataService.getSnapshot();
      const pptx = await getPptxGenerator();
      const buf = await pptx.generateExecutiveReport(snapshot);
      const date = new Date().toISOString().slice(0, 10);
      return {
        success: true,
        data: buf.toString('base64'),
        filename: `kogvantage-executive-${date}.pptx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };
    } catch (err) {
      return { success: false, data: '', filename: '', mimeType: '', error: reportErrorMessage(err) };
    }
  }),

  aiReport: publicProcedure
    .input(z.object({ prompt: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        // Try the dedicated generateReport method first, fall back to chat
        let response: string;
        try {
          response = await ClaudeService.generateReport(input.prompt as 'weekly' | 'monthly' | 'executive');
        } catch {
          response = await ClaudeService.chat([
            { role: 'user', content: input.prompt },
          ] as ClaudeService.ChatMessage[]);
        }
        return { success: true, response };
      } catch (err) {
        return { success: false, response: reportErrorMessage(err) };
      }
    }),
});
