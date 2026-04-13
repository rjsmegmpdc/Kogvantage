---
description: Generate a Work Breakdown Structure (WBS) from a project description using Claude AI
---

# Generate WBS

When the user describes a project and wants a work breakdown:

1. **Take the project description** — can be a few sentences or detailed brief
2. **Call ClaudeService.generateWBS(description)** — returns structured JSON hierarchy:
   - 2-4 Epics
   - 2-3 Features per Epic
   - 2-4 User Stories per Feature
3. **Present the hierarchy** for user review
4. **On confirmation**: Insert Epics into `epics` table, Features into `features` table

Each item has: title, type (Epic/Feature/User Story), state (New).

The service is at `src/server/services/ai/ClaudeService.ts`.
