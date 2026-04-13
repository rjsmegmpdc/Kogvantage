---
description: Import financial resource (team member) data into Kogvantage
---

# Import Resources

When the user provides a CSV file with resource/team member data:

1. **Required fields**: Name, Employee ID, Contract Type
2. **Optional fields**: Email, Work Area, Activity Type CAP, Activity Type OPX
3. **Validate**:
   - Contract Type: FTE, SOW, or External Squad
   - Activity Type format: N[1-6]_CAP or N[1-6]_OPX
4. **UPSERT logic**: If employee_id already exists, update the record; otherwise insert new
5. **Import** via `ResourceImportService.importResources(csvContent)`
6. **Report** created vs updated counts

The service is at `src/server/services/coordinator/ResourceImportService.ts`.
