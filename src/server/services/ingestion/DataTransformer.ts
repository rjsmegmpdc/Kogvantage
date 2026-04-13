// src/server/services/ingestion/DataTransformer.ts
// Data normalisation service — transforms raw values to Kogvantage standards

// ---------------------------------------------------------------------------
// Month lookup
// ---------------------------------------------------------------------------

const MONTH_NAMES: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4,
  may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4,
  jun: 6, jul: 7, aug: 8, sep: 9, sept: 9,
  oct: 10, nov: 11, dec: 12,
};

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function isValidDate(day: number, month: number, year: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  // Basic month-length check
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

// ---------------------------------------------------------------------------
// DataTransformer
// ---------------------------------------------------------------------------

export class DataTransformer {
  /**
   * Convert any recognised date format to DD-MM-YYYY (NZ standard).
   *
   * Handles:
   *   DD-MM-YYYY, DD/MM/YYYY
   *   MM/DD/YYYY (US)
   *   YYYY-MM-DD (ISO)
   *   "January 15, 2025" / "15 January 2025"
   *   "15 Jan 2025" / "Jan 15, 2025"
   *   "Jan-2025" (assumes 1st of month)
   *
   * Returns the original string if unrecognisable.
   */
  normalizeDate(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return value;

    // --- ISO: YYYY-MM-DD ---
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, yyyy, mm, dd] = isoMatch;
      const y = parseInt(yyyy, 10);
      const m = parseInt(mm, 10);
      const d = parseInt(dd, 10);
      if (isValidDate(d, m, y)) {
        return `${pad2(d)}-${pad2(m)}-${yyyy}`;
      }
    }

    // --- DD-MM-YYYY or DD/MM/YYYY ---
    const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const a = parseInt(dmy[1], 10);
      const b = parseInt(dmy[2], 10);
      const y = parseInt(dmy[3], 10);

      // If separator is "/" it's ambiguous — try MM/DD/YYYY (US) first when
      // the first number > 12 it must be DD-MM-YYYY
      if (trimmed.includes('/')) {
        // US: MM/DD/YYYY
        if (a <= 12 && isValidDate(b, a, y)) {
          return `${pad2(b)}-${pad2(a)}-${y}`;
        }
        // Fallback: DD/MM/YYYY
        if (isValidDate(a, b, y)) {
          return `${pad2(a)}-${pad2(b)}-${y}`;
        }
      } else {
        // Hyphenated — DD-MM-YYYY
        if (isValidDate(a, b, y)) {
          return `${pad2(a)}-${pad2(b)}-${y}`;
        }
      }
    }

    // --- "Month DD, YYYY" or "DD Month YYYY" ---
    const longDate = trimmed.match(
      /^(\d{1,2})?\s*([A-Za-z]+)\s+(\d{1,2})?,?\s*(\d{4})$/,
    );
    if (longDate) {
      const part1 = longDate[1] ? parseInt(longDate[1], 10) : 0;
      const monthName = longDate[2].toLowerCase();
      const part3 = longDate[3] ? parseInt(longDate[3], 10) : 0;
      const year = parseInt(longDate[4], 10);
      const month = MONTH_NAMES[monthName];

      if (month) {
        // "15 January 2025" — part1=15, part3=undefined
        if (part1 > 0 && part3 === 0 && isValidDate(part1, month, year)) {
          return `${pad2(part1)}-${pad2(month)}-${year}`;
        }
        // "January 15, 2025" — part1=undefined, part3=15
        if (part1 === 0 && part3 > 0 && isValidDate(part3, month, year)) {
          return `${pad2(part3)}-${pad2(month)}-${year}`;
        }
      }
    }

    // --- "Month DD, YYYY" variant with leading month ---
    const monthFirst = trimmed.match(
      /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
    );
    if (monthFirst) {
      const monthName = monthFirst[1].toLowerCase();
      const day = parseInt(monthFirst[2], 10);
      const year = parseInt(monthFirst[3], 10);
      const month = MONTH_NAMES[monthName];
      if (month && isValidDate(day, month, year)) {
        return `${pad2(day)}-${pad2(month)}-${year}`;
      }
    }

    // --- "Mon-YYYY" (abbreviated, day defaults to 01) ---
    const monYear = trimmed.match(/^([A-Za-z]+)[\/\-](\d{4})$/);
    if (monYear) {
      const monthName = monYear[1].toLowerCase();
      const year = parseInt(monYear[2], 10);
      const month = MONTH_NAMES[monthName];
      if (month) {
        return `01-${pad2(month)}-${year}`;
      }
    }

    // Unrecognised — return original
    return value;
  }

  /**
   * Strip currency symbols, thousands separators, and whitespace.
   * Returns a plain number. Returns NaN if unparseable.
   */
  normalizeCurrency(value: string): number {
    const cleaned = value
      .replace(/[A-Za-z$\s]/g, '') // strip letters, $, spaces
      .replace(/,/g, '');           // strip thousand separators

    const num = parseFloat(cleaned);
    return isNaN(num) ? NaN : num;
  }

  /**
   * Normalise a person's name to Title Case.
   *
   *   "SMITH, JOHN"   -> "John Smith"
   *   "j. smith"      -> "J. Smith"
   *   "  jane doe  "  -> "Jane Doe"
   */
  normalizePersonName(name: string): string {
    let cleaned = name.trim();
    if (!cleaned) return cleaned;

    // Handle "LAST, FIRST" format
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',').map((p) => p.trim());
      if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
        cleaned = `${parts[1]} ${parts[0]}`;
      }
    }

    // Title-case each word
    return cleaned
      .split(/\s+/)
      .map((word) => {
        if (!word) return word;
        // Preserve initials like "J."
        if (word.length <= 2 && word.endsWith('.')) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Remove exact duplicate records based on a combination of key fields.
   * Returns the unique set and the count of duplicates removed.
   */
  deduplicateRecords(
    records: Record<string, string>[],
    keyFields: string[],
  ): { unique: Record<string, string>[]; duplicates: number } {
    const seen = new Set<string>();
    const unique: Record<string, string>[] = [];
    let duplicates = 0;

    for (const record of records) {
      const key = keyFields
        .map((f) => (record[f] ?? '').trim().toLowerCase())
        .join('||');

      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
        unique.push(record);
      }
    }

    return { unique, duplicates };
  }
}
