---
description: Import labour rate bands (N1-N6 + External) into Kogvantage
---

# Import Labour Rates

When the user provides a CSV file with labour rate data:

1. **Handle 2-row title header** — Skip the first title row, use second row as headers
2. **Required fields**: Band, Activity Type, Hourly Rate, Daily Rate
3. **Validate rate relationship**: Daily Rate should be ~8x Hourly Rate (10% tolerance)
4. **Parse NZD amounts**: Strip $, commas, spaces
5. **Import** via `LabourRatesImportService.importRates(csvContent, fiscalYear)`
   - Note: existing rates for the fiscal year are replaced
6. **Report** results

Fiscal year format: "FY25" or "2024-2025".
Bands: N1, N2, N3, N4, N5, N6, External.
The service is at `src/server/services/coordinator/LabourRatesImportService.ts`.
