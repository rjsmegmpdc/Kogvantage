---
description: Import SAP FI actuals (cost posting) CSV data into Kogvantage
---

# Import Actuals

When the user provides a CSV file with SAP financial actuals:

1. **Validate headers** — Required: Month, Posting Date, Cost Element, WBS element, Value in obj. crcy, Personnel number
2. **Auto-categorize** each row:
   - Cost element starting with 115x → Software
   - Cost element starting with 116x → Hardware
   - Personnel number != "0" → Contractor
   - Default → Labour
3. **Validate**: numeric amounts, valid cost elements, valid dates
4. **Import** via `ActualsImportService.importActuals(csvContent)`
5. **Report** processed/imported/failed counts

The service is at `src/server/services/coordinator/ActualsImportService.ts`.
