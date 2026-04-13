// src/server/services/ingestion/UniversalIngestor.ts
// Core ingestion service — analyses any file and maps it to Kogvantage schema

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IngestResult {
  files: FileAnalysis[];
  gapReport: GapReport;
  totalRecords: number;
  importableRecords: number;
}

export interface FileAnalysis {
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'json' | 'pdf' | 'image' | 'unknown';
  detectedDataType:
    | 'timesheets'
    | 'actuals'
    | 'labour_rates'
    | 'resources'
    | 'projects'
    | 'tasks'
    | 'unknown';
  rowCount: number;
  columns: string[];
  mappedColumns: Record<string, string>; // source column -> target column
  confidence: number; // 0-100
  issues: string[];
}

export interface GapReport {
  found: string[]; // "45 timesheet records (Jan-Mar 2025)"
  missing: string[]; // "No actuals data"
  warnings: string[]; // "Date format inconsistent"
}

// ---------------------------------------------------------------------------
// Known schemas — header keywords used for fuzzy detection
// ---------------------------------------------------------------------------

type DataType = FileAnalysis['detectedDataType'];

interface SchemaSignature {
  type: DataType;
  /** At least this many keywords must match for a positive detection */
  minMatches: number;
  /** Keywords to search for in headers (lowercase) */
  keywords: string[];
  /** Target column names mapped from keyword index */
  targetColumns: Record<string, string>;
}

const SCHEMA_SIGNATURES: SchemaSignature[] = [
  {
    type: 'timesheets',
    minMatches: 3,
    keywords: [
      'hours', 'date', 'personnel', 'activity', 'wbse', 'wbs',
      'employee', 'number unit', 'time', 'stream', 'receiver',
    ],
    targetColumns: {
      hours: 'number_unit',
      'number unit': 'number_unit',
      date: 'date',
      personnel: 'personnel_number',
      employee: 'name_of_employee',
      activity: 'activity_type',
      wbse: 'general_receiver',
      wbs: 'general_receiver',
      receiver: 'general_receiver',
      stream: 'stream',
      time: 'time_of_entry',
    },
  },
  {
    type: 'actuals',
    minMatches: 3,
    keywords: [
      'cost element', 'wbs', 'value', 'posting date', 'posting',
      'document', 'fiscal', 'period', 'currency', 'crcy',
    ],
    targetColumns: {
      'cost element': 'cost_element',
      wbs: 'wbs_element',
      value: 'value_in_obj_crcy',
      'posting date': 'posting_date',
      posting: 'posting_date',
      document: 'document_number',
      fiscal: 'fiscal_year',
      period: 'period',
      currency: 'transaction_currency',
      crcy: 'value_in_obj_crcy',
    },
  },
  {
    type: 'labour_rates',
    minMatches: 2,
    keywords: [
      'band', 'hourly', 'daily', 'rate', 'uplift', 'fiscal year',
      'activity type',
    ],
    targetColumns: {
      band: 'band',
      hourly: 'hourly_rate',
      daily: 'daily_rate',
      rate: 'hourly_rate',
      uplift: 'uplift_amount',
      'fiscal year': 'fiscal_year',
      'activity type': 'activity_type',
    },
  },
  {
    type: 'resources',
    minMatches: 2,
    keywords: [
      'name', 'employee', 'contract', 'email', 'work area',
      'personnel', 'resource', 'ado', 'identity',
    ],
    targetColumns: {
      name: 'resource_name',
      employee: 'employee_id',
      contract: 'contract_type',
      email: 'email',
      'work area': 'work_area',
      personnel: 'employee_id',
      resource: 'resource_name',
      ado: 'ado_identity_id',
      identity: 'ado_identity_id',
    },
  },
  {
    type: 'projects',
    minMatches: 2,
    keywords: [
      'title', 'project', 'status', 'budget', 'start', 'end',
      'priority', 'owner', 'description',
    ],
    targetColumns: {
      title: 'title',
      project: 'title',
      status: 'status',
      budget: 'budget',
      start: 'start_date',
      end: 'end_date',
      priority: 'priority',
      owner: 'owner',
      description: 'description',
    },
  },
  {
    type: 'tasks',
    minMatches: 2,
    keywords: [
      'task', 'assignee', 'due', 'estimate', 'sprint',
      'story', 'points', 'status', 'priority',
    ],
    targetColumns: {
      task: 'task_name',
      assignee: 'assignee',
      due: 'due_date',
      estimate: 'estimate_hours',
      sprint: 'sprint',
      story: 'story_points',
      points: 'story_points',
      status: 'status',
      priority: 'priority',
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/** Check whether `header` fuzzy-matches `keyword` */
function fuzzyMatch(header: string, keyword: string): boolean {
  const h = header.toLowerCase().trim();
  const k = keyword.toLowerCase().trim();

  // Exact or substring match
  if (h === k || h.includes(k) || k.includes(h)) return true;

  // Abbreviation match — first letters of each word
  const hWords = h.split(/[\s_\-]+/);
  const abbrev = hWords.map((w) => w[0]).join('');
  if (abbrev === k || k === abbrev) return true;

  // Levenshtein for short strings (typos)
  if (h.length <= 12 && k.length <= 12) {
    const maxDist = Math.max(1, Math.floor(Math.max(h.length, k.length) / 4));
    if (levenshtein(h, k) <= maxDist) return true;
  }

  return false;
}

/** Detect file type from name / mime */
function detectFileType(
  name: string,
  mimeOrType: string,
): FileAnalysis['fileType'] {
  const lower = name.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpe?g|gif|bmp|webp|tiff?)$/i.test(lower)) return 'image';

  // Fallback to mime
  if (mimeOrType.includes('csv') || mimeOrType.includes('comma')) return 'csv';
  if (mimeOrType.includes('spreadsheet') || mimeOrType.includes('excel'))
    return 'xlsx';
  if (mimeOrType.includes('json')) return 'json';
  if (mimeOrType.includes('pdf')) return 'pdf';
  if (mimeOrType.startsWith('image/')) return 'image';

  return 'unknown';
}

/** Extract headers and row count from CSV-like content */
function parseCSVHeaders(content: string): {
  headers: string[];
  rowCount: number;
} {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rowCount: 0 };

  // Detect delimiter
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter =
    tabCount > commaCount && tabCount > semiCount
      ? '\t'
      : semiCount > commaCount
        ? ';'
        : ',';

  const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  return { headers, rowCount: Math.max(0, lines.length - 1) };
}

/** Extract headers from JSON content */
function parseJSONHeaders(content: string): {
  headers: string[];
  rowCount: number;
} {
  try {
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : parsed.data || parsed.records || parsed.rows || [];
    if (!Array.isArray(arr) || arr.length === 0) return { headers: [], rowCount: 0 };

    const headers = Object.keys(arr[0]);
    return { headers, rowCount: arr.length };
  } catch {
    return { headers: [], rowCount: 0 };
  }
}

// ---------------------------------------------------------------------------
// Universal Ingestor
// ---------------------------------------------------------------------------

export class UniversalIngestor {
  /**
   * Scan all files, detect types by header matching, produce gap report.
   */
  analyzeFiles(
    fileContents: { name: string; content: string; type: string }[],
  ): IngestResult {
    const analyses: FileAnalysis[] = [];
    let totalRecords = 0;
    let importableRecords = 0;

    for (const file of fileContents) {
      const fileType = detectFileType(file.name, file.type);
      const analysis = this.analyzeFile(file.name, file.content, fileType);
      analyses.push(analysis);

      totalRecords += analysis.rowCount;
      if (analysis.confidence > 50) {
        importableRecords += analysis.rowCount;
      }
    }

    const gapReport = this.generateGapReport(analyses);

    return {
      files: analyses,
      gapReport,
      totalRecords,
      importableRecords,
    };
  }

  /**
   * Detect the data type from a set of headers using fuzzy matching.
   */
  detectDataType(headers: string[]): { type: DataType; confidence: number } {
    let bestType: DataType = 'unknown';
    let bestScore = 0;
    let bestTotal = 1;

    for (const sig of SCHEMA_SIGNATURES) {
      let matches = 0;
      for (const keyword of sig.keywords) {
        for (const header of headers) {
          if (fuzzyMatch(header, keyword)) {
            matches++;
            break; // Don't double-count the same keyword
          }
        }
      }

      if (matches >= sig.minMatches && matches > bestScore) {
        bestScore = matches;
        bestTotal = sig.keywords.length;
        bestType = sig.type;
      }
    }

    // Confidence: proportion of keywords matched, scaled 0-100
    const confidence =
      bestType === 'unknown'
        ? 0
        : Math.min(100, Math.round((bestScore / bestTotal) * 100 * 1.5));

    return { type: bestType, confidence };
  }

  /**
   * Map source columns to target schema columns using fuzzy matching.
   */
  mapColumns(
    headers: string[],
    targetType: string,
  ): Record<string, string> {
    const mapped: Record<string, string> = {};
    const sig = SCHEMA_SIGNATURES.find((s) => s.type === targetType);
    if (!sig) return mapped;

    for (const header of headers) {
      let bestKeyword = '';
      let bestDistance = Infinity;

      for (const keyword of sig.keywords) {
        if (fuzzyMatch(header, keyword)) {
          const dist = levenshtein(header.toLowerCase(), keyword.toLowerCase());
          if (dist < bestDistance) {
            bestDistance = dist;
            bestKeyword = keyword;
          }
        }
      }

      if (bestKeyword && sig.targetColumns[bestKeyword]) {
        mapped[header] = sig.targetColumns[bestKeyword];
      }
    }

    return mapped;
  }

  /**
   * Generate a gap report identifying what data types are present vs missing.
   */
  generateGapReport(analyses: FileAnalysis[]): GapReport {
    const found: string[] = [];
    const missing: string[] = [];
    const warnings: string[] = [];

    const detectedTypes = new Set<string>();

    for (const a of analyses) {
      if (a.detectedDataType !== 'unknown' && a.confidence > 50) {
        detectedTypes.add(a.detectedDataType);
        const label = a.detectedDataType.replace(/_/g, ' ');
        found.push(
          `${a.rowCount} ${label} records from ${a.fileName}`,
        );
      }

      // Collect file-level issues as warnings
      for (const issue of a.issues) {
        warnings.push(`${a.fileName}: ${issue}`);
      }
    }

    // Check for missing data types against the core set
    const coreTypes: { type: string; label: string; suggestion: string }[] = [
      {
        type: 'timesheets',
        label: 'Timesheets',
        suggestion: 'Upload SAP timesheet extract CSV',
      },
      {
        type: 'actuals',
        label: 'Actuals',
        suggestion: 'Upload SAP cost actuals export',
      },
      {
        type: 'labour_rates',
        label: 'Labour Rates',
        suggestion: 'Upload band-level rate table',
      },
      {
        type: 'resources',
        label: 'Resources',
        suggestion: 'Upload resource register',
      },
    ];

    for (const core of coreTypes) {
      if (!detectedTypes.has(core.type)) {
        missing.push(`No ${core.label} data found — ${core.suggestion}`);
      }
    }

    // Warn about low-confidence files
    for (const a of analyses) {
      if (a.confidence > 0 && a.confidence <= 50) {
        warnings.push(
          `${a.fileName}: Low confidence (${a.confidence}%) — column mapping may be inaccurate`,
        );
      }
      if (a.detectedDataType === 'unknown') {
        warnings.push(
          `${a.fileName}: Could not determine data type — manual mapping required`,
        );
      }
    }

    return { found, missing, warnings };
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private analyzeFile(
    fileName: string,
    content: string,
    fileType: FileAnalysis['fileType'],
  ): FileAnalysis {
    const issues: string[] = [];
    let headers: string[] = [];
    let rowCount = 0;

    // Extract headers based on file type
    if (fileType === 'csv') {
      const parsed = parseCSVHeaders(content);
      headers = parsed.headers;
      rowCount = parsed.rowCount;
    } else if (fileType === 'json') {
      const parsed = parseJSONHeaders(content);
      headers = parsed.headers;
      rowCount = parsed.rowCount;
    } else if (fileType === 'xlsx') {
      // XLSX needs a library at runtime — try treating content as CSV
      // (the caller may have pre-converted to CSV text)
      const parsed = parseCSVHeaders(content);
      headers = parsed.headers;
      rowCount = parsed.rowCount;
      if (headers.length === 0) {
        issues.push('XLSX parsing requires pre-conversion to CSV or JSON');
      }
    } else if (fileType === 'pdf' || fileType === 'image') {
      issues.push(
        `${fileType.toUpperCase()} files require OCR or AI extraction — not auto-mapped`,
      );
      return {
        fileName,
        fileType,
        detectedDataType: 'unknown',
        rowCount: 0,
        columns: [],
        mappedColumns: {},
        confidence: 0,
        issues,
      };
    } else {
      issues.push('Unrecognised file type — try CSV, XLSX, or JSON');
      return {
        fileName,
        fileType,
        detectedDataType: 'unknown',
        rowCount: 0,
        columns: [],
        mappedColumns: {},
        confidence: 0,
        issues,
      };
    }

    if (headers.length === 0) {
      issues.push('No column headers found');
      return {
        fileName,
        fileType,
        detectedDataType: 'unknown',
        rowCount,
        columns: [],
        mappedColumns: {},
        confidence: 0,
        issues,
      };
    }

    // Detect data type
    const { type, confidence } = this.detectDataType(headers);

    // Map columns
    const mappedColumns =
      type !== 'unknown' ? this.mapColumns(headers, type) : {};

    // Flag unmapped columns
    const unmappedCount = headers.length - Object.keys(mappedColumns).length;
    if (unmappedCount > 0 && type !== 'unknown') {
      issues.push(`${unmappedCount} column(s) could not be mapped to ${type.replace(/_/g, ' ')} schema`);
    }

    // Check for empty rows
    if (rowCount === 0) {
      issues.push('File contains headers but no data rows');
    }

    return {
      fileName,
      fileType,
      detectedDataType: type,
      rowCount,
      columns: headers,
      mappedColumns,
      confidence,
      issues,
    };
  }
}
