---
description: Analyze uploaded governance report templates and generate matching reports
---

# Governance Template Analysis

When the user uploads an organizational report template (PPTX, DOCX, XLSX):

1. **Read the template** — extract format, structure, and styling
2. **Identify**:
   - Color palette (brand colors as hex values)
   - Primary and heading fonts
   - Language style (formal, semi-formal, concise)
   - Section structure (ordered list of section headers)
   - Tone examples (sample phrases from the template)
   - Logo and branding elements
3. **Store as TemplateProfile** in the `governance_templates` table
4. **Confirm** with the user: "I've learned your [template type] style. Future reports will match this format."

When generating reports using a stored template:
1. Query the TemplateProfile for the requested report type
2. Build report content from portfolio data
3. Apply the template's language style, section structure, and tone
4. Output in the template's format (PPTX/DOCX/XLSX)

Template profiles are stored in `governance_templates` table.
