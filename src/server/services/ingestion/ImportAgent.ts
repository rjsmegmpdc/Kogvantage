// ============================================================
// KOGVANTAGE — Import Agent
// Reads any CSV/XLSX file, auto-detects data type, anonymizes
// sensitive data, and imports into SQLite as demo data.
//
// Usage: npx tsx src/server/services/ingestion/ImportAgent.ts <file-or-folder>
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { getDb } from '@/server/db/sqlite';
import { Anonymizer } from './Anonymizer';
import { randomUUID } from 'crypto';

const anon = new Anonymizer();

// ── Column pattern matchers ────────────────────────────────────
// Each pattern has: keywords to match in headers, the target table, and a mapper function

interface DetectedSheet {
  name: string;
  type: 'timesheets' | 'actuals' | 'labour_rates' | 'resources' | 'projects' | 'org_chart' | 'unknown';
  headers: string[];
  rows: Record<string, string>[];
  confidence: number;
}

const TIMESHEET_KEYWORDS = ['personnel', 'hours', 'activity type', 'date', 'number (unit)', 'number unit', 'cats'];
const ACTUALS_KEYWORDS = ['cost element', 'wbs element', 'value', 'posting date', 'fiscal year', 'document number'];
const LABOUR_RATE_KEYWORDS = ['band', 'hourly rate', 'daily rate', 'activity type', 'uplift'];
const RESOURCE_KEYWORDS = ['name', 'email', 'band', 'role', 'activity'];
const PROJECT_KEYWORDS = ['title', 'budget', 'status', 'financial treatment', 'start date'];
const ORG_KEYWORDS = ['employeeid', 'managerid', 'level', 'roletype'];

function detectType(headers: string[]): { type: DetectedSheet['type']; confidence: number } {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const joined = lower.join(' ');

  const scores: [DetectedSheet['type'], number][] = [
    ['timesheets', TIMESHEET_KEYWORDS.filter((k) => joined.includes(k)).length],
    ['actuals', ACTUALS_KEYWORDS.filter((k) => joined.includes(k)).length],
    ['labour_rates', LABOUR_RATE_KEYWORDS.filter((k) => joined.includes(k)).length],
    ['resources', RESOURCE_KEYWORDS.filter((k) => joined.includes(k)).length],
    ['projects', PROJECT_KEYWORDS.filter((k) => joined.includes(k)).length],
    ['org_chart', ORG_KEYWORDS.filter((k) => joined.includes(k)).length],
  ];

  scores.sort((a, b) => b[1] - a[1]);
  const [bestType, bestScore] = scores[0];

  if (bestScore === 0) return { type: 'unknown', confidence: 0 };
  const maxPossible = {
    timesheets: TIMESHEET_KEYWORDS.length,
    actuals: ACTUALS_KEYWORDS.length,
    labour_rates: LABOUR_RATE_KEYWORDS.length,
    resources: RESOURCE_KEYWORDS.length,
    projects: PROJECT_KEYWORDS.length,
    org_chart: ORG_KEYWORDS.length,
    unknown: 1,
  };
  const confidence = Math.round((bestScore / maxPossible[bestType]) * 100);
  return { type: bestType, confidence };
}

// ── Find column by fuzzy match ─────────────────────────────────
function findCol(headers: string[], ...patterns: string[]): string | null {
  for (const pattern of patterns) {
    const p = pattern.toLowerCase();
    const match = headers.find((h) => h.toLowerCase().includes(p));
    if (match) return match;
  }
  return null;
}

function getVal(row: Record<string, string>, headers: string[], ...patterns: string[]): string {
  const col = findCol(headers, ...patterns);
  if (!col) return '';
  return String(row[col] ?? '').trim();
}

// Excel serial date → DD-MM-YYYY
function excelDateToString(serial: string | number): string {
  const num = typeof serial === 'string' ? parseFloat(serial) : serial;
  if (isNaN(num) || num < 1000) return String(serial); // Not a serial number
  // Excel epoch is 1900-01-01, but has a leap year bug (day 60 = Feb 29 1900 which doesn't exist)
  const epoch = new Date(1899, 11, 30); // Dec 30, 1899
  const date = new Date(epoch.getTime() + num * 86400000);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Normalize any date to DD-MM-YYYY
function normalizeDate(value: string): string {
  if (!value) return value;
  // Already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value;
  // Excel serial number
  if (/^\d{4,5}(\.\d+)?$/.test(value)) return excelDateToString(value);
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}-${m}-${y}`;
  }
  // MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
    const [m, d, y] = value.split('/');
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }
  return value;
}

// ── Importers ──────────────────────────────────────────────────

function importTimesheets(rows: Record<string, string>[], headers: string[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO raw_timesheets (stream, month, name, personnel_number, date, activity_type, wbse, hours, processed, imported_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `);

  let count = 0;
  const tx = db.transaction(() => {
    for (const row of rows) {
      const name = getVal(row, headers, 'name of employee', 'name');
      const personnelNum = getVal(row, headers, 'personnel number', 'personnel');
      const rawDate = getVal(row, headers, 'date');
      const date = normalizeDate(rawDate);
      const activityType = getVal(row, headers, 'activity type');
      const wbse = getVal(row, headers, 'general receiver', 'wbse', 'wbs');
      const hoursStr = getVal(row, headers, 'number (unit)', 'number unit', 'hours');
      const stream = getVal(row, headers, 'stream', 'acct assgnt', 'sender cost');
      const month = getVal(row, headers, 'month');

      const hours = parseFloat(hoursStr);
      if (isNaN(hours) || hours <= 0) continue;
      if (!date || !activityType) continue;

      insert.run(
        anon.anonymizeCostCenter(stream || 'General'),
        month || '',
        anon.anonymizeName(name),
        anon.anonymizePersonnelNumber(personnelNum),
        date,
        activityType,
        anon.anonymizeWBSE(wbse),
        hours
      );
      count++;
    }
  });
  tx();
  return count;
}

function importActuals(rows: Record<string, string>[], headers: string[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO raw_actuals (month, posting_date, cost_element, wbs_element, value_nzd, personnel_number, category, imported_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let count = 0;
  const tx = db.transaction(() => {
    for (const row of rows) {
      const rawPostingDate = getVal(row, headers, 'posting date');
      const postingDate = normalizeDate(rawPostingDate);
      const costElement = getVal(row, headers, 'cost element');
      const wbsElement = getVal(row, headers, 'wbs element');
      const valueStr = getVal(row, headers, 'value in obj', 'value trancurr', 'value');
      const personnelNum = getVal(row, headers, 'personnel number', 'personnel');
      const month = getVal(row, headers, 'month');

      const value = parseFloat(String(valueStr).replace(/[$,\s]/g, ''));
      if (isNaN(value)) continue;
      if (!costElement) continue;

      // Auto-categorize
      let category = 'labour';
      const ce = costElement.replace(/\D/g, '');
      if (ce.startsWith('115')) category = 'software';
      else if (ce.startsWith('116')) category = 'hardware';
      else if (personnelNum && personnelNum !== '0' && personnelNum !== '') category = 'contractor';

      insert.run(
        month || '',
        postingDate,
        costElement,
        anon.anonymizeWBSE(wbsElement),
        value,
        anon.anonymizePersonnelNumber(personnelNum),
        category
      );
      count++;
    }
  });
  tx();
  return count;
}

function importLabourRates(rows: Record<string, string>[], headers: string[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO raw_labour_rates (band, activity_type, fiscal_year, hourly_rate, daily_rate, uplift_amount, uplift_percent, imported_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  let count = 0;
  const parseMoney = (v: string) => parseFloat(String(v).replace(/[$,\s\u00A0]/g, '')) || 0;

  const tx = db.transaction(() => {
    for (const row of rows) {
      const band = getVal(row, headers, 'band', 'short band');
      const activityType = getVal(row, headers, 'activity type');
      const hourlyRate = parseMoney(getVal(row, headers, 'hourly rate', 'hourly'));
      const dailyRate = parseMoney(getVal(row, headers, 'daily rate', 'daily'));
      const upliftAmt = parseMoney(getVal(row, headers, 'uplift', '$ uplift'));
      const upliftPct = parseMoney(getVal(row, headers, '% uplift', 'uplift %'));

      if (!band || !activityType || hourlyRate <= 0) continue;

      // Detect fiscal year from header names
      let fy = 'FY25';
      const fyHeader = headers.find((h) => /fy\d{2}/i.test(h));
      if (fyHeader) {
        const match = fyHeader.match(/fy(\d{2})/i);
        if (match) fy = `FY${match[1]}`;
      }

      insert.run(band, activityType, fy, hourlyRate, dailyRate, upliftAmt, upliftPct);
      count++;
    }
  });
  tx();
  return count;
}

function importResources(rows: Record<string, string>[], headers: string[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO financial_resources (id, name, email, work_area, activity_type_cap, activity_type_opx, contract_type, employee_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  let count = 0;
  const tx = db.transaction(() => {
    for (const row of rows) {
      const name = getVal(row, headers, 'name');
      const email = getVal(row, headers, 'email');
      const band = getVal(row, headers, 'band', 'short band');
      const activityType = getVal(row, headers, 'activity type', 'activitytype');
      const role = getVal(row, headers, 'role');

      if (!name) continue;

      const anonName = anon.anonymizeName(name);
      const anonEmail = email ? anon.anonymizeEmail(email) : '';
      const anonRole = anon.getRole(name);

      // Derive CAP/OPX from activity type
      let capType = activityType || '';
      let opxType = '';
      if (capType.includes('CAP')) {
        opxType = capType.replace('CAP', 'OPX');
      } else if (capType.includes('OPX')) {
        opxType = capType;
        capType = capType.replace('OPX', 'CAP');
      }

      insert.run(
        randomUUID(),
        anonName,
        anonEmail,
        anonRole,
        capType,
        opxType,
        'FTE',
        anon.anonymizePersonnelNumber(name) // Use name as fallback for employee ID
      );
      count++;
    }
  });
  tx();
  return count;
}

function importOrgChart(rows: Record<string, string>[], headers: string[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO financial_resources (id, name, email, work_area, contract_type, employee_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  let count = 0;
  const tx = db.transaction(() => {
    for (const row of rows) {
      const empId = getVal(row, headers, 'employeeid');
      const name = getVal(row, headers, 'name');
      const roleType = getVal(row, headers, 'roletype');
      const level = getVal(row, headers, 'level');

      if (!name || !empId) continue;

      const anonName = anon.anonymizeName(name);
      const contractType = roleType === 'Permanent' ? 'FTE'
        : roleType === 'Contractor' ? 'SOW'
        : 'External Squad';

      insert.run(
        randomUUID(),
        anonName,
        anon.anonymizeEmail(`${name.toLowerCase().replace(/\s+/g, '.')}@org.nz`),
        `Level ${level}`,
        contractType,
        anon.anonymizePersonnelNumber(empId)
      );
      count++;
    }
  });
  tx();
  return count;
}

function importProjects(rows: Record<string, string>[], headers: string[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO projects (id, title, description, status, start_date, end_date, budget_cents, financial_treatment, lane, pm_name, health, created_at, updated_at)
    VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  let count = 0;
  const tx = db.transaction(() => {
    for (const row of rows) {
      const title = getVal(row, headers, 'title', 'name', 'project');
      const status = getVal(row, headers, 'status');
      const startDate = getVal(row, headers, 'start date', 'start');
      const endDate = getVal(row, headers, 'end date', 'end');
      const budgetStr = getVal(row, headers, 'budget');
      const treatment = getVal(row, headers, 'financial treatment', 'treatment');

      if (!title) continue;

      const budget = parseFloat(String(budgetStr).replace(/[$,\s]/g, '')) || 0;
      const budgetCents = Math.round(budget * 100);

      // Normalize status
      let normStatus = 'planned';
      const s = status.toLowerCase();
      if (s.includes('progress') || s.includes('active') || s.includes('engineering')) normStatus = 'in-progress';
      else if (s.includes('block')) normStatus = 'blocked';
      else if (s.includes('done') || s.includes('complete') || s.includes('release')) normStatus = 'done';

      const normTreatment = treatment.toUpperCase().includes('CAPEX') ? 'CAPEX'
        : treatment.toUpperCase().includes('OPEX') ? 'OPEX' : 'MIXED';

      insert.run(
        randomUUID(),
        title,
        normStatus,
        startDate,
        endDate,
        budgetCents,
        normTreatment,
        '',
        '',
        50 + Math.floor(Math.random() * 40)
      );
      count++;
    }
  });
  tx();
  return count;
}

// ── File reader ────────────────────────────────────────────────

function readFile(filePath: string): DetectedSheet[] {
  const ext = path.extname(filePath).toLowerCase();
  const sheets: DetectedSheet[] = [];

  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return sheets;

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });

    const { type, confidence } = detectType(headers);
    sheets.push({ name: path.basename(filePath), type, headers, rows, confidence });

  } else if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: '' });

      if (jsonData.length === 0) continue;

      const headers = Object.keys(jsonData[0]);
      const { type, confidence } = detectType(headers);

      // Skip sheets with very low confidence or tiny data
      if (confidence === 0 && jsonData.length < 3) continue;

      sheets.push({
        name: `${path.basename(filePath)} > ${sheetName}`,
        type,
        headers,
        rows: jsonData.map((row) => {
          const cleaned: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            cleaned[k] = String(v);
          }
          return cleaned;
        }),
        confidence,
      });
    }
  }

  return sheets;
}

// ── Main import function ───────────────────────────────────────

export function importFiles(filePaths: string[]): void {
  console.log('\n=== KOGVANTAGE IMPORT AGENT ===\n');
  console.log('Anonymization: ENABLED (all names, emails, IDs replaced)\n');

  const allSheets: DetectedSheet[] = [];

  for (const fp of filePaths) {
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      // Scan directory for CSV/XLSX files
      const files = fs.readdirSync(fp).filter((f) =>
        /\.(csv|xlsx|xls)$/i.test(f)
      );
      for (const f of files) {
        allSheets.push(...readFile(path.join(fp, f)));
      }
    } else {
      allSheets.push(...readFile(fp));
    }
  }

  if (allSheets.length === 0) {
    console.log('No importable data found.');
    return;
  }

  // Report what was found
  console.log('DETECTED DATA:\n');
  console.log('  #  | Type           | Rows  | Confidence | Source');
  console.log('  ---+----------------+-------+------------+-----------------------------------');
  for (let i = 0; i < allSheets.length; i++) {
    const s = allSheets[i];
    const typeStr = s.type.padEnd(14);
    const rowStr = String(s.rows.length).padStart(5);
    const confStr = `${s.confidence}%`.padStart(10);
    console.log(`  ${String(i + 1).padStart(2)} | ${typeStr} | ${rowStr} | ${confStr} | ${s.name}`);
  }

  // Import each detected sheet
  console.log('\nIMPORTING:\n');

  let totalImported = 0;

  for (const sheet of allSheets) {
    let imported = 0;
    const label = `  ${sheet.type.padEnd(14)} from ${sheet.name}`;

    try {
      switch (sheet.type) {
        case 'timesheets':
          imported = importTimesheets(sheet.rows, sheet.headers);
          break;
        case 'actuals':
          imported = importActuals(sheet.rows, sheet.headers);
          break;
        case 'labour_rates':
          imported = importLabourRates(sheet.rows, sheet.headers);
          break;
        case 'resources':
          imported = importResources(sheet.rows, sheet.headers);
          break;
        case 'projects':
          imported = importProjects(sheet.rows, sheet.headers);
          break;
        case 'org_chart':
          imported = importOrgChart(sheet.rows, sheet.headers);
          break;
        default:
          console.log(`${label} — SKIPPED (unknown type)`);
          continue;
      }
      console.log(`${label} — ${imported} rows imported`);
      totalImported += imported;
    } catch (err) {
      console.log(`${label} — ERROR: ${err}`);
    }
  }

  // Anonymization summary
  const summary = anon.getSummary();
  console.log('\nANONYMIZATION SUMMARY:\n');
  console.log(`  Names replaced:      ${summary.names}`);
  console.log(`  Emails replaced:     ${summary.emails}`);
  console.log(`  Personnel IDs:       ${summary.personnelNumbers}`);
  console.log(`  WBSE codes:          ${summary.wbseCodes}`);
  console.log(`  Cost centers:        ${summary.costCenters}`);

  console.log(`\n========================================`);
  console.log(`  Total imported: ${totalImported} rows`);
  console.log(`  All sensitive data anonymized.`);
  console.log(`========================================\n`);
}

// ── CLI entry point ────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: npx tsx src/server/services/ingestion/ImportAgent.ts <file-or-folder> [file2] [file3] ...');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx src/server/services/ingestion/ImportAgent.ts ~/Downloads/CATS-5DEC2025.xlsx');
    console.log('  npx tsx src/server/services/ingestion/ImportAgent.ts ~/Downloads/*.xlsx ~/Downloads/*.csv');
    console.log('  npx tsx src/server/services/ingestion/ImportAgent.ts ~/Downloads/');
    console.log('');
    console.log('Supported: .csv, .xlsx, .xls');
    console.log('Auto-detects: timesheets, actuals, labour rates, resources, projects, org charts');
    console.log('Anonymizes: names, emails, personnel numbers, WBSE codes, cost centers');
    process.exit(1);
  }

  importFiles(args);
}
