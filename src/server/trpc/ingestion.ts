// ============================================================
// KOGVANTAGE — Universal Data Ingestion tRPC Procedures
// AI-powered file analysis and import via coordinator services
// ============================================================

import { z } from 'zod';
import { router, publicProcedure } from './init';
import { getDb } from '@/server/db/sqlite';
import { TimesheetImportService } from '@/server/services/coordinator/TimesheetImportService';
import { ActualsImportService } from '@/server/services/coordinator/ActualsImportService';
import { LabourRatesImportService } from '@/server/services/coordinator/LabourRatesImportService';
import { ResourceImportService } from '@/server/services/coordinator/ResourceImportService';

// ── Service Singletons ──────────────────────────────────────

const timesheetService = new TimesheetImportService();
const actualsService = new ActualsImportService();
const labourRatesService = new LabourRatesImportService();
const resourceImportService = new ResourceImportService();

// ── Types ────────────────────────────────────────────────────

interface FileAnalysis {
  name: string;
  detectedDataType:
    | 'timesheet'
    | 'actuals'
    | 'labour_rates'
    | 'resources'
    | 'project_plan'
    | 'unknown';
  confidence: number;
  rowCount: number;
  columns: string[];
  issues: string[];
}

interface IngestFileInput {
  name: string;
  content: string;
  detectedDataType: string;
}

// ── Zod Schemas ─────────────────────────────────────────────

const fileSchema = z.object({
  name: z.string(),
  content: z.string(),
  type: z.string(),
});

const ingestFileSchema = z.object({
  name: z.string(),
  content: z.string(),
  detectedDataType: z.string(),
});

// ── Analysis Helpers ─────────────────────────────────────────

function detectDataType(
  name: string,
  headers: string[]
): FileAnalysis['detectedDataType'] {
  const lowerName = name.toLowerCase();
  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // Timesheet detection
  if (
    lowerName.includes('timesheet') ||
    lowerName.includes('time_sheet') ||
    lowerHeaders.some((h) => h.includes('personnel_number') || h.includes('activity_type'))
  ) {
    return 'timesheet';
  }

  // Actuals detection
  if (
    lowerName.includes('actual') ||
    lowerHeaders.some((h) => h.includes('cost_element') || h.includes('wbs_element'))
  ) {
    return 'actuals';
  }

  // Labour rates detection
  if (
    lowerName.includes('rate') ||
    lowerName.includes('labour') ||
    lowerHeaders.some((h) => h.includes('hourly_rate') || h.includes('daily_rate'))
  ) {
    return 'labour_rates';
  }

  // Resource detection
  if (
    lowerName.includes('resource') ||
    lowerName.includes('staff') ||
    lowerHeaders.some((h) => h.includes('employee_id') || h.includes('contract_type'))
  ) {
    return 'resources';
  }

  // Project plan detection
  if (
    lowerName.includes('project') ||
    lowerName.includes('plan') ||
    lowerHeaders.some((h) => h.includes('start_date') && lowerHeaders.includes('end_date'))
  ) {
    return 'project_plan';
  }

  return 'unknown';
}

function analyzeFileContent(file: { name: string; content: string; type: string }): FileAnalysis {
  const lines = file.content.trim().split('\n');
  const headers = lines.length > 0 ? lines[0].split(',').map((h) => h.trim()) : [];
  const dataType = detectDataType(file.name, headers);

  const issues: string[] = [];
  if (lines.length < 2) issues.push('File appears to have no data rows');
  if (headers.length < 2) issues.push('Very few columns detected');
  if (dataType === 'unknown') issues.push('Could not auto-detect data type');

  return {
    name: file.name,
    detectedDataType: dataType,
    confidence: dataType === 'unknown' ? 0.2 : 0.85,
    rowCount: Math.max(0, lines.length - 1),
    columns: headers,
    issues,
  };
}

// ── Router ────────────────────────────────────────────────────

export const ingestionRouter = router({
  analyze: publicProcedure
    .input(z.object({ files: z.array(fileSchema) }))
    .mutation(({ input }) => {
      const results = input.files.map((file) => analyzeFileContent(file));

      return {
        files: results,
        totalFiles: results.length,
        autoDetected: results.filter((r) => r.detectedDataType !== 'unknown').length,
        needsReview: results.filter(
          (r) => r.detectedDataType === 'unknown' || r.issues.length > 0
        ).length,
      };
    }),

  import: publicProcedure
    .input(z.object({ files: z.array(ingestFileSchema) }))
    .mutation(async ({ input }) => {
      const results: Array<{
        name: string;
        dataType: string;
        success: boolean;
        recordsImported: number;
        error?: string;
      }> = [];

      for (const file of input.files) {
        try {
          let importResult;

          switch (file.detectedDataType) {
            case 'timesheet':
              importResult = await timesheetService.importTimesheets(file.content);
              break;
            case 'actuals':
              importResult = await actualsService.importActuals(file.content);
              break;
            case 'labour_rates':
              importResult = await labourRatesService.importLabourRates(file.content, 'FY25');
              break;
            case 'resources':
              importResult = await resourceImportService.importResources(file.content);
              break;
            default:
              results.push({
                name: file.name,
                dataType: file.detectedDataType,
                success: false,
                recordsImported: 0,
                error: `Unsupported data type: ${file.detectedDataType}`,
              });
              continue;
          }

          results.push({
            name: file.name,
            dataType: file.detectedDataType,
            success: importResult.success,
            recordsImported: importResult.recordsImported,
            error: importResult.errors.length > 0
              ? importResult.errors.map((e) => e.message).join('; ')
              : undefined,
          });
        } catch (err) {
          results.push({
            name: file.name,
            dataType: file.detectedDataType,
            success: false,
            recordsImported: 0,
            error: err instanceof Error ? err.message : 'Import failed',
          });
        }
      }

      // Record the ingestion event
      const db = getDb();
      const now = new Date().toISOString();
      const totalImported = results.reduce((sum, r) => sum + r.recordsImported, 0);

      db.prepare(
        `INSERT OR REPLACE INTO app_settings (key, value)
         VALUES ('last_ingestion', ?)`
      ).run(
        JSON.stringify({
          timestamp: now,
          filesProcessed: results.length,
          totalRecordsImported: totalImported,
          hasErrors: results.some((r) => !r.success),
        })
      );

      return {
        files: results,
        totalImported,
        successCount: results.filter((r) => r.success).length,
        errorCount: results.filter((r) => !r.success).length,
      };
    }),

  getStatus: publicProcedure.query(() => {
    const db = getDb();
    const row = db
      .prepare("SELECT value FROM app_settings WHERE key = 'last_ingestion'")
      .get() as { value: string } | undefined;

    if (!row) {
      return {
        hasRun: false,
        timestamp: null,
        filesProcessed: 0,
        totalRecordsImported: 0,
        hasErrors: false,
      };
    }

    try {
      const data = JSON.parse(row.value);
      return { hasRun: true, ...data };
    } catch {
      return {
        hasRun: false,
        timestamp: null,
        filesProcessed: 0,
        totalRecordsImported: 0,
        hasErrors: false,
      };
    }
  }),
});
