---
description: Import SAP CATS timesheet CSV data into Kogvantage
---

# Import Timesheets

When the user provides a CSV file with SAP timesheet data:

1. **Validate headers** — Required: Stream, Month, Name, Personnel Number, Date, Activity Type, WBSE, Hours
2. **Parse dates** in DD-MM-YYYY format (NZ standard)
3. **Validate each row**:
   - Hours: 0-24 range, numeric
   - Personnel Number: numeric format
   - Activity Type: N1-N6_CAP or N1-N6_OPX format
   - Date: valid DD-MM-YYYY
4. **Import** valid rows via `TimesheetImportService.importTimesheets(csvContent)`
5. **Report results**: records processed, imported, failed with row-level error details

The service is at `src/server/services/coordinator/TimesheetImportService.ts`.
CSV templates are in the `templates/` directory.
