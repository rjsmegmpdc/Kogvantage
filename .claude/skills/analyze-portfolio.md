---
description: Analyze the portfolio using Claude AI for risks, health, and recommendations
---

# Analyze Portfolio

When the user asks for portfolio analysis:

1. **Build context** from the database:
   - All active projects with status, budget, health, task counts
   - Active variance alerts
   - Resource utilization summaries
2. **Call ClaudeService.analyzePortfolio(query)** with the user's question
3. **Present results** with actionable recommendations

Common analysis queries:
- "What are the top risks in my portfolio?"
- "Which projects are over budget?"
- "Show me resource conflicts"
- "Which projects are behind schedule?"

The service is at `src/server/services/ai/ClaudeService.ts`.
