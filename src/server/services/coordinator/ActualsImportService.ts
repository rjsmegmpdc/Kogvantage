// src/server/services/coordinator/ActualsImportService.ts
// Ported from Electron-Roadmap — uses getDb() instead of injected DB instance

import Papa from 'papaparse';
import { getDb } from '@/server/db/sqlite';
import type { ImportResult, ImportError } from './types';

export class ActualsImportService {
  /**
   * Import actuals from SAP FI CSV export
   */
  async importActuals(csvData: string): Promise<ImportResult> {
    const db = getDb();

    const requiredFields = [
      'Month',
      'Posting Date',
      'Cost Element',
      'WBS element',
      'Value in Obj. Crcy'
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
      const rowNumber = index + 2;

      const hasData = Object.values(row).some(val => val !== null && val !== undefined && val !== '');
      if (!hasData) return;

      const rowErrors = this.validateActualRow(row, rowNumber);
      allErrors.push(...rowErrors);

      if (rowErrors.some(e => e.severity === 'error')) {
        errorRowCount++;
        return;
      }

      validRows.push(row);
    });

    // Insert into database using Kogvantage schema
    // Kogvantage raw_actuals columns: month, posting_date, cost_element,
    // wbs_element, value_nzd, personnel_number, category, imported_at
    const insertStmt = db.prepare(`
      INSERT INTO raw_actuals (
        month, posting_date, cost_element,
        wbs_element, value_nzd, personnel_number,
        category, imported_at
      ) VALUES (
        @month, @posting_date, @cost_element,
        @wbs_element, @value_nzd, @personnel_number,
        @category, @imported_at
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
   * Validate a single actual row
   */
  private validateActualRow(row: any, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    // Validate amount is numeric
    const amount = parseFloat(row['Value in Obj. Crcy']);
    if (isNaN(amount)) {
      errors.push({
        row: rowNumber,
        field: 'Value in Obj. Crcy',
        value: row['Value in Obj. Crcy'],
        message: `Invalid amount. Must be numeric.`,
        severity: 'error'
      });
    }

    // Validate cost element
    const costElement = row['Cost Element'];
    if (costElement && !/^\d+$/.test(costElement)) {
      errors.push({
        row: rowNumber,
        field: 'Cost Element',
        value: costElement,
        message: `Cost Element should be numeric`,
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
      month: row['Month'] || '',
      posting_date: row['Posting Date'] || '',
      cost_element: row['Cost Element'] || '',
      wbs_element: row['WBS element'] || '',
      value_nzd: parseFloat(row['Value in Obj. Crcy']) || 0,
      personnel_number: row['Personnel Number'] || '0',
      category: this.autoCategorize(row),
      imported_at: now
    };
  }

  /**
   * Auto-categorize an actual row based on cost element and personnel number
   * Cost Element 115x = Software, 116x = Hardware, personnel != '0' = Contractor
   */
  private autoCategorize(row: any): string {
    const costElement = row['Cost Element'] || '';
    const personnelNumber = row['Personnel Number'] || '0';

    // Software: Cost Element starts with 115
    if (costElement.startsWith('115')) {
      return 'software';
    }

    // Hardware: Cost Element starts with 116
    if (costElement.startsWith('116')) {
      return 'hardware';
    }

    // Contractor: Personnel Number is present and not '0'
    if (personnelNumber && personnelNumber !== '0') {
      return 'contractor';
    }

    return 'labour';
  }

  /**
   * Re-categorize existing uncategorized actuals in the database
   * Applies the same rules: 115x=software, 116x=hardware, personnel!=0=contractor
   */
  async categorizeActuals(): Promise<void> {
    const db = getDb();

    // Software: Cost Element starts with 115
    db.prepare(`
      UPDATE raw_actuals
      SET category = 'software'
      WHERE cost_element LIKE '115%' AND category = 'labour'
    `).run();

    // Contractor: Personnel Number != '0'
    db.prepare(`
      UPDATE raw_actuals
      SET category = 'contractor'
      WHERE personnel_number IS NOT NULL
        AND personnel_number != '0'
        AND category = 'labour'
    `).run();

    // Hardware: Cost Element starts with 116
    db.prepare(`
      UPDATE raw_actuals
      SET category = 'hardware'
      WHERE cost_element LIKE '116%' AND category = 'labour'
    `).run();
  }
}
