// src/server/services/coordinator/ResourceImportService.ts
// Ported from Electron-Roadmap — uses getDb() instead of injected DB instance

import Papa from 'papaparse';
import { randomUUID } from 'crypto';
import { getDb } from '@/server/db/sqlite';
import type { ImportResult, ImportError } from './types';

interface ResourceRow {
  Roadmap_ResourceID: string;
  ResourceName: string;
  Email: string;
  WorkArea: string;
  ActivityType_CAP: string;
  ActivityType_OPX: string;
  'Contract Type': string;
  EmployeeID: string;
}

export class ResourceImportService {
  /**
   * Import financial resources from CSV with UPSERT by employee_id
   */
  async importResources(csvData: string): Promise<ImportResult> {
    const db = getDb();

    const result: ImportResult = {
      success: false,
      recordsProcessed: 0,
      recordsImported: 0,
      recordsFailed: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Parse CSV
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header: string) => header.trim()
      });

      // Check for parse errors
      if (parseResult.errors.length > 0) {
        parseResult.errors.forEach((err: any) => {
          result.errors.push({
            row: err.row || 0,
            message: `CSV Parse Error: ${err.message}`,
            severity: 'error'
          });
        });
      }

      // Validate headers
      const requiredFields = ['ResourceName', 'Contract Type'];
      if (parseResult.data.length > 0 && typeof parseResult.data[0] === 'object' && parseResult.data[0] !== null) {
        const actualHeaders = Object.keys(parseResult.data[0] as object);
        const missingHeaders = requiredFields.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
          result.errors.push({
            row: 0,
            message: `Missing required columns: ${missingHeaders.join(', ')}. Found: ${actualHeaders.join(', ')}`,
            severity: 'error'
          });
          return result;
        }
      }

      // Validate each row
      const validRows: ResourceRow[] = [];

      (parseResult.data as any[]).forEach((row: any, index: number) => {
        const rowNumber = index + 2;

        const hasData = Object.values(row).some(val => val !== null && val !== undefined && val !== '');
        if (!hasData) return;

        const rowErrors = this.validateResourceRow(row, rowNumber);
        result.errors.push(...rowErrors);

        if (rowErrors.some(e => e.severity === 'error')) {
          result.recordsFailed++;
          return;
        }

        validRows.push(row as ResourceRow);
      });

      result.recordsProcessed = validRows.length + result.recordsFailed;

      // Transform valid rows into database records
      const now = new Date().toISOString();
      const validRecords: Array<Record<string, any>> = [];

      for (const row of validRows) {
        const contractType = row['Contract Type']?.trim();
        const activityCap = row.ActivityType_CAP === 'Nil' ? '' : row.ActivityType_CAP?.trim() || '';
        const activityOpx = row.ActivityType_OPX === 'Nil' ? '' : row.ActivityType_OPX?.trim() || '';

        validRecords.push({
          id: randomUUID(),
          roadmap_resource_id: row.Roadmap_ResourceID ? parseInt(row.Roadmap_ResourceID, 10) : null,
          name: row.ResourceName.trim(),
          email: row.Email?.trim() || '',
          work_area: row.WorkArea?.trim() || '',
          activity_type_cap: activityCap,
          activity_type_opx: activityOpx,
          contract_type: contractType,
          employee_id: row.EmployeeID?.trim() || '',
          created_at: now,
          updated_at: now,
        });
      }

      // UPSERT: Insert or update on employee_id conflict
      // Kogvantage financial_resources columns: id, name, email, work_area,
      // activity_type_cap, activity_type_opx, contract_type, employee_id,
      // ado_identity_id, created_at, updated_at
      if (validRecords.length > 0) {
        const insertStmt = db.prepare(`
          INSERT INTO financial_resources (
            id, name, email, work_area,
            activity_type_cap, activity_type_opx, contract_type, employee_id,
            created_at, updated_at
          ) VALUES (
            @id, @name, @email, @work_area,
            @activity_type_cap, @activity_type_opx, @contract_type, @employee_id,
            @created_at, @updated_at
          )
          ON CONFLICT(employee_id) DO UPDATE SET
            name = excluded.name,
            email = excluded.email,
            work_area = excluded.work_area,
            activity_type_cap = excluded.activity_type_cap,
            activity_type_opx = excluded.activity_type_opx,
            contract_type = excluded.contract_type,
            updated_at = excluded.updated_at
        `);

        const transaction = db.transaction((records: typeof validRecords) => {
          for (const record of records) {
            insertStmt.run(record);
          }
        });

        try {
          transaction(validRecords);
          result.recordsImported = validRecords.length;
        } catch (err: any) {
          result.errors.push({
            row: 0,
            message: `Database error: ${err.message}`,
            severity: 'error',
          });
          return result;
        }
      }

      result.success = result.recordsImported > 0 || result.recordsFailed === 0;
    } catch (err: any) {
      result.errors.push({
        row: 0,
        message: `Import error: ${err.message}`,
        severity: 'error',
      });
    }

    return result;
  }

  /**
   * Validate a single resource row
   */
  private validateResourceRow(row: any, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    // Validate contract type
    const contractType = row['Contract Type']?.trim();
    if (contractType && !['FTE', 'SOW', 'External Squad'].includes(contractType)) {
      errors.push({
        row: rowNumber,
        field: 'Contract Type',
        value: contractType,
        message: `Invalid Contract Type: "${contractType}". Must be FTE, SOW, or External Squad`,
        severity: 'error',
      });
    }

    // Validate activity types if provided
    const activityRegex = /^N[1-6]_(CAP|OPX)$/;
    if (row.ActivityType_CAP && row.ActivityType_CAP !== 'Nil' && row.ActivityType_CAP.trim() !== '') {
      if (!activityRegex.test(row.ActivityType_CAP.trim())) {
        errors.push({
          row: rowNumber,
          field: 'ActivityType_CAP',
          value: row.ActivityType_CAP,
          message: `Invalid ActivityType_CAP: "${row.ActivityType_CAP}". Must match N[1-6]_CAP format`,
          severity: 'error',
        });
      }
    }

    if (row.ActivityType_OPX && row.ActivityType_OPX !== 'Nil' && row.ActivityType_OPX.trim() !== '') {
      if (!activityRegex.test(row.ActivityType_OPX.trim())) {
        errors.push({
          row: rowNumber,
          field: 'ActivityType_OPX',
          value: row.ActivityType_OPX,
          message: `Invalid ActivityType_OPX: "${row.ActivityType_OPX}". Must match N[1-6]_OPX format`,
          severity: 'error',
        });
      }
    }

    return errors;
  }
}
