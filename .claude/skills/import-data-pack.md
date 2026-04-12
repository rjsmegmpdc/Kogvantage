---
description: Ingest a data pack of mixed files (CSV, XLSX, images, PDFs), analyze contents, identify gaps, and import into Kogvantage
---

# Universal Data Ingestion

When the user provides files or a folder for import:

## Step 1: Scan & Identify
- Read all files in the provided path (CSV, XLSX, JSON, PDF, images)
- For each file, identify the data type by analyzing headers and content:
  - **Timesheets**: Look for columns like Hours, Date, Personnel, Activity Type, WBSE
  - **Actuals**: Look for Cost Element, WBS element, Value, Posting Date
  - **Labour Rates**: Look for Band, Hourly Rate, Daily Rate, Activity Type
  - **Resources**: Look for Name, Email, Contract Type, Employee ID
  - **Projects**: Look for Title, Status, Budget, Start Date, End Date
  - **Epics/Features**: Look for Epic/Feature, State, Effort, Business Value
  - **Tasks**: Look for Task, Status, Assigned To, Effort Hours
- For images: describe what's visible (table, chart, org chart, whiteboard)

## Step 2: Analyze & Map
- For each identified file, map columns to the Kogvantage schema
- Use fuzzy matching for column names (e.g., "Emp No" → personnel_number)
- Handle date format variations (DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD)
- Normalize currency values (strip $, commas, handle decimals)

## Step 3: Gap Analysis
Report what was found AND what's missing:
```
✅ Found: [count] timesheet records ([date range])
✅ Found: [count] resources with rates
⚠️ Missing: No actuals data — provide cost postings or estimate from timesheets × rates
⚠️ Missing: No dependency data — suggest dependencies from task names?
❌ Missing: No WBSE mapping — provide workstream→WBSE or create default mapping
```

## Step 4: Transform & Import
- Normalize all data to Kogvantage format
- Deduplicate records (by personnel_number, date, WBSE for timesheets)
- Resolve name inconsistencies ("J. Smith" = "John Smith")
- Import valid records, queue ambiguous ones for user review
- Report: processed/imported/failed with row-level errors

## Important Notes
- Always present findings to user BEFORE importing
- Never overwrite existing data without confirmation
- CSV templates are in the `templates/` directory for reference
- Financial data uses NZD, dates use DD-MM-YYYY
