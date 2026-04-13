// src/server/services/coordinator/LabourRatesImportService.ts
// Ported from Electron-Roadmap — uses getDb() instead of injected DB instance

import Papa from 'papaparse';
import { getDb } from '@/server/db/sqlite';
import type { ImportResult, ImportError } from './types';

export class LabourRatesImportService {
  /**
   * Import labour rates from CSV
   * Labour Rates CSV has 2 title rows before the actual header row.
   * Rows 1-2 are title/description, Row 3 is the header, Row 4+ is data.
   */
  async importLabourRates(csvData: string, fiscalYear: string): Promise<ImportResult> {
    const db = getDb();

    // Labour Rates CSV has 2 title rows before the actual header
    // Skip first 2 rows and use row 3 as header
    const lines = csvData.split('\n');
    if (lines.length < 4) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsImported: 0,
        recordsFailed: 0,
        errors: [{ row: 0, message: 'CSV file has insufficient rows. Expected at least 4 rows (title rows + header + data)', severity: 'error' }],
        warnings: []
      };
    }

    // Reconstruct CSV with proper header (skip first 2 title rows)
    const processedCsv = lines.slice(2).join('\n');

    const requiredFields = ['Band', 'Activity Type', 'Hourly Rate', 'Daily Rate'];

    // Parse the processed CSV
    const parseResult = Papa.parse(processedCsv, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim()
    });

    const allErrors: ImportError[] = [];

    // Check for parse errors
    if (parseResult.errors.length > 0) {
      parseResult.errors.forEach((err: any) => {
        allErrors.push({
          row: err.row || 0,
          message: `CSV Parse Error: ${err.message}`,
          severity: 'error'
        });
      });
    }

    // Validate headers
    if (parseResult.data.length > 0 && typeof parseResult.data[0] === 'object' && parseResult.data[0] !== null) {
      const actualHeaders = Object.keys(parseResult.data[0] as object);
      const missingHeaders = requiredFields.filter(h => !actualHeaders.includes(h));

      if (missingHeaders.length > 0) {
        allErrors.push({
          row: 0,
          message: `Missing required columns: ${missingHeaders.join(', ')}. Found: ${actualHeaders.join(', ')}`,
          severity: 'error'
        });
        return {
          success: false,
          recordsProcessed: 0,
          recordsImported: 0,
          recordsFailed: 0,
          errors: allErrors,
          warnings: []
        };
      }
    }

    // Validate rows and collect valid data
    const validRows: any[] = [];
    let errorRowCount = 0;

    (parseResult.data as any[]).forEach((row: any, index: number) => {
      const rowNumber = index + 4; // +4 because 2 title rows + 1 header row + 1-indexed

      const hasData = Object.values(row).some(val => val !== null && val !== undefined && val !== '');
      if (!hasData) return;

      const rowErrors = this.validateRateRow(row, rowNumber);
      allErrors.push(...rowErrors);

      if (rowErrors.some(e => e.severity === 'error')) {
        errorRowCount++;
        return;
      }

      validRows.push(row);
    });

    // Delete existing rates for this fiscal year before inserting new ones
    db.prepare(`DELETE FROM raw_labour_rates WHERE fiscal_year = ?`).run(fiscalYear);

    // Insert into database using Kogvantage schema
    // Kogvantage raw_labour_rates columns: band, activity_type, fiscal_year,
    // hourly_rate, daily_rate, uplift_amount, uplift_percent, imported_at
    const insertStmt = db.prepare(`
      INSERT INTO raw_labour_rates (
        band, activity_type, fiscal_year,
        hourly_rate, daily_rate, uplift_amount, uplift_percent, imported_at
      ) VALUES (
        @band, @activity_type, @fiscal_year,
        @hourly_rate, @daily_rate, @uplift_amount, @uplift_percent, @imported_at
      )
    `);

    const insertMany = db.transaction((rows: any[]) => {
      let imported = 0;
      const insertErrors: ImportError[] = [];

      rows.forEach((row, index) => {
        try {
          const mapped = this.mapCsvRow(row, fiscalYear);
          insertStmt.run(mapped);
          imported++;
        } catch (error: any) {
          insertErrors.push({
            row: index + 4,
            message: `Insert failed: ${error.message}`,
            severity: 'error'
          });
        }
      });

      return { imported, insertErrors };
    });

    const result = insertMany(validRows);

    return {
      success: result.imported > 0,
      recordsProcessed: parseResult.data.length,
      recordsImported: result.imported,
      recordsFailed: errorRowCount + result.insertErrors.length,
      errors: [...allErrors, ...result.insertErrors],
      warnings: []
    };
  }

  /**
   * Validate a single rate row
   */
  private validateRateRow(row: any, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    // Validate hourly rate
    const hourly = this.parseNZDAmount(row['Hourly Rate']);
    if (hourly === null || hourly < 0) {
      errors.push({
        row: rowNumber,
        field: 'Hourly Rate',
        value: row['Hourly Rate'],
        message: `Invalid hourly rate`,
        severity: 'error'
      });
    }

    // Validate daily rate
    const daily = this.parseNZDAmount(row['Daily Rate']);
    if (daily === null || daily < 0) {
      errors.push({
        row: rowNumber,
        field: 'Daily Rate',
        value: row['Daily Rate'],
        message: `Invalid daily rate`,
        severity: 'error'
      });
    }

    // Check daily rate is approximately 8x hourly (allow 10% variance)
    if (hourly && daily) {
      const expected = hourly * 8;
      const variance = Math.abs((daily - expected) / expected);
      if (variance > 0.1) {
        errors.push({
          row: rowNumber,
          message: `Daily rate (${daily}) should be ~8x hourly rate (${hourly})`,
          severity: 'warning'
        });
      }
    }

    return errors;
  }

  /**
   * Parse NZD amount (handles $, commas, spaces)
   */
  private parseNZDAmount(value: string): number | null {
    if (!value) return null;

    // Remove $, spaces, commas
    const cleaned = value.replace(/[$\s,]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Map CSV row to Kogvantage database columns
   */
  private mapCsvRow(row: any, fiscalYear: string): Record<string, any> {
    const now = new Date().toISOString();

    return {
      band: row['Band'] || '',
      activity_type: row['Activity Type'] || '',
      fiscal_year: fiscalYear,
      hourly_rate: this.parseNZDAmount(row['Hourly Rate']) || 0,
      daily_rate: this.parseNZDAmount(row['Daily Rate']) || 0,
      uplift_amount: row['$ Uplift'] ? (this.parseNZDAmount(row['$ Uplift']) ?? 0) : 0,
      uplift_percent: row['% Uplift'] ? parseFloat(row['% Uplift'].replace('%', '')) || 0 : 0,
      imported_at: now
    };
  }
}
