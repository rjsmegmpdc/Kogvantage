// src/server/services/coordinator/TimesheetImportService.ts
// Ported from Electron-Roadmap — uses getDb() instead of injected DB instance

import Papa from 'papaparse';
import { getDb } from '@/server/db/sqlite';
import type { ImportResult, ImportError } from './types';

/**
 * Validate DD-MM-YYYY date format
 */
function parseNZDate(value: string): boolean {
  if (!value) return false;
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return false;
  const [, dd, mm, yyyy] = match;
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 2000 || year > 2100) return false;
  return true;
}

export class TimesheetImportService {
  /**
   * Import timesheets from CSV
   */
  async importTimesheets(csvData: string): Promise<ImportResult> {
    const db = getDb();

    const requiredFields = [
      'Stream',
      'Month',
      'Name of employee or applicant',
      'Personnel Number',
      'Date',
      'Activity Type',
      'General receiver', // WBSE
      'Number (unit)' // Hours
    ];

    // Parse CSV
    const parseResult = Papa.parse(csvData, {
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
      const rowNumber = index + 2; // +2 for header offset

      // Skip empty rows
      const hasData = Object.values(row).some(val => val !== null && val !== undefined && val !== '');
      if (!hasData) return;

      const rowErrors = this.validateTimesheetRow(row, rowNumber);
      allErrors.push(...rowErrors);

      if (rowErrors.some(e => e.severity === 'error')) {
        errorRowCount++;
        return;
      }

      validRows.push(row);
    });

    // Insert into database using Kogvantage schema
    // Kogvantage raw_timesheets columns: stream, month, name, personnel_number,
    // date, activity_type, wbse, hours, processed, imported_at
    const insertStmt = db.prepare(`
      INSERT INTO raw_timesheets (
        stream, month, name, personnel_number,
        date, activity_type, wbse, hours,
        processed, imported_at
      ) VALUES (
        @stream, @month, @name, @personnel_number,
        @date, @activity_type, @wbse, @hours,
        0, @imported_at
      )
    `);

    const insertMany = db.transaction((rows: any[]) => {
      let imported = 0;
      const insertErrors: ImportError[] = [];

      rows.forEach((row, index) => {
        try {
          const mapped = this.mapCsvRow(row);
          insertStmt.run(mapped);
          imported++;
        } catch (error: any) {
          insertErrors.push({
            row: index + 2,
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
   * Validate a single timesheet row
   */
  private validateTimesheetRow(row: any, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    // Validate date format (DD-MM-YYYY)
    const dateValue = row['Date'];
    if (dateValue && !parseNZDate(dateValue)) {
      errors.push({
        row: rowNumber,
        field: 'Date',
        value: dateValue,
        message: `Invalid date format. Expected DD-MM-YYYY, got: ${dateValue}`,
        severity: 'error'
      });
    }

    // Validate hours (must be positive number)
    const hours = parseFloat(row['Number (unit)']);
    if (isNaN(hours) || hours < 0) {
      errors.push({
        row: rowNumber,
        field: 'Number (unit)',
        value: row['Number (unit)'],
        message: `Invalid hours value. Must be positive number, got: ${row['Number (unit)']}`,
        severity: 'error'
      });
    }

    // Validate hours not exceeding 24 per day
    if (hours > 24) {
      errors.push({
        row: rowNumber,
        field: 'Number (unit)',
        value: hours,
        message: `Hours exceed 24 for single day: ${hours}`,
        severity: 'warning'
      });
    }

    // Validate personnel number is numeric
    const personnelNumber = row['Personnel Number'];
    if (personnelNumber && !/^\d+$/.test(personnelNumber)) {
      errors.push({
        row: rowNumber,
        field: 'Personnel Number',
        value: personnelNumber,
        message: `Personnel Number should be numeric, got: ${personnelNumber}`,
        severity: 'warning'
      });
    }

    return errors;
  }

  /**
   * Map CSV row to Kogvantage database columns
   */
  private mapCsvRow(row: any): Record<string, any> {
    const now = new Date().toISOString();

    return {
      stream: row['Stream'] || '',
      month: row['Month'] || '',
      name: row['Name of employee or applicant'] || '',
      personnel_number: row['Personnel Number'] || '',
      date: row['Date'] || '',
      activity_type: row['Activity Type'] || '',
      wbse: row['General receiver'] || '', // WBSE
      hours: parseFloat(row['Number (unit)']) || 0,
      imported_at: now
    };
  }

  /**
   * Get unprocessed timesheets
   */
  async getUnprocessedTimesheets(): Promise<any[]> {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM raw_timesheets
      WHERE processed = 0
      ORDER BY date ASC
    `).all();
  }

  /**
   * Mark timesheets as processed
   */
  async markAsProcessed(ids: number[]): Promise<void> {
    const db = getDb();
    const updateStmt = db.prepare(`
      UPDATE raw_timesheets SET processed = 1 WHERE id = ?
    `);

    const updateMany = db.transaction((idList: number[]) => {
      idList.forEach(id => updateStmt.run(id));
    });

    updateMany(ids);
  }
}
