// ============================================================
// KOGVANTAGE — Claude AI Service
// Replaces Gemini AI from Gemini-Roadmap project
// Uses @anthropic-ai/sdk with Claude Sonnet
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/server/db/sqlite';

const MODEL = 'claude-sonnet-4-20250514';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-key-here') {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// --- System Prompt ---
const SYSTEM_PROMPT = `You are the AI assistant for Kogvantage, an enterprise portfolio intelligence platform.

Your role is to help project managers and portfolio leaders:
- Analyze roadmaps, identify risks, and suggest optimizations
- Interpret financial data (budgets, actuals, variances, burn rates)
- Generate work breakdown structures from project descriptions
- Detect resource conflicts and suggest rebalancing
- Draft stakeholder reports matching organizational templates
- Explain variance alerts in plain English with recommended actions
- Answer natural language questions about portfolio data

You have access to project data including timelines, budgets, health scores, resources, and financial metrics.

Be concise, professional, and actionable. Use NZD for currency. Dates are DD-MM-YYYY format.

When the user's role requires codeword filtering, use codewords instead of real project names.`;

// --- Types ---
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PortfolioContext {
  projects: Array<{
    name: string;
    status: string;
    budget: number;
    spent: number;
    health: number;
    taskCount: number;
    startDate: string;
    endDate: string;
  }>;
  totalBudget: number;
  totalSpent: number;
  projectCount: number;
  averageHealth: number;
}

export interface WBSItem {
  title: string;
  type: 'Epic' | 'Feature' | 'User Story';
  state: string;
  children?: WBSItem[];
}

// --- Build portfolio context from database ---
export function buildPortfolioContext(): PortfolioContext {
  const db = getDb();
  const projects = db
    .prepare(
      `SELECT id, title, status, budget_cents, health, start_date, end_date
       FROM projects WHERE status != 'archived' ORDER BY title`
    )
    .all() as Array<{
    id: string;
    title: string;
    status: string;
    budget_cents: number;
    health: number;
    start_date: string;
    end_date: string;
  }>;

  const taskCounts = db
    .prepare(`SELECT project_id, COUNT(*) as count FROM tasks GROUP BY project_id`)
    .all() as Array<{ project_id: string; count: number }>;

  const taskCountMap = new Map(taskCounts.map((t) => [t.project_id, t.count]));

  const projectSummaries = projects.map((p) => ({
    name: p.title,
    status: p.status,
    budget: p.budget_cents / 100,
    spent: 0, // TODO: calculate from actuals
    health: p.health,
    taskCount: taskCountMap.get(p.id) || 0,
    startDate: p.start_date,
    endDate: p.end_date,
  }));

  const totalBudget = projectSummaries.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projectSummaries.reduce((sum, p) => sum + p.spent, 0);
  const averageHealth =
    projectSummaries.length > 0
      ? Math.round(
          projectSummaries.reduce((sum, p) => sum + p.health, 0) / projectSummaries.length
        )
      : 0;

  return {
    projects: projectSummaries,
    totalBudget,
    totalSpent,
    projectCount: projectSummaries.length,
    averageHealth,
  };
}

// --- Chat with portfolio context ---
export async function chat(
  messages: ChatMessage[],
  portfolioContext?: PortfolioContext
): Promise<string> {
  const anthropic = getClient();
  const context = portfolioContext || buildPortfolioContext();

  const contextBlock =
    context.projectCount > 0
      ? `\n\nCurrent Portfolio Summary:
- ${context.projectCount} active projects
- Total budget: $${context.totalBudget.toLocaleString()} NZD
- Total spent: $${context.totalSpent.toLocaleString()} NZD
- Average health: ${context.averageHealth}%

Projects:
${context.projects.map((p) => `- ${p.name} (${p.status}, $${p.budget.toLocaleString()}, ${p.health}% health, ${p.taskCount} tasks)`).join('\n')}`
      : '\n\nNo projects in portfolio yet.';

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT + contextBlock,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock ? textBlock.text : 'No response generated.';
}

// --- Analyze Portfolio ---
export async function analyzePortfolio(query: string): Promise<string> {
  const context = buildPortfolioContext();
  return chat([{ role: 'user', content: query }], context);
}

// --- Generate Work Breakdown Structure ---
export async function generateWBS(projectDescription: string): Promise<WBSItem[]> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You generate work breakdown structures for software/IT projects.
Return a JSON array of items with this structure:
[{
  "title": "Epic Name",
  "type": "Epic",
  "state": "New",
  "children": [{
    "title": "Feature Name",
    "type": "Feature",
    "state": "New",
    "children": [{
      "title": "User Story",
      "type": "User Story",
      "state": "New"
    }]
  }]
}]

Generate 2-4 Epics, each with 2-3 Features, each with 2-4 User Stories.
Return ONLY valid JSON, no markdown.`,
    messages: [
      {
        role: 'user',
        content: `Generate a work breakdown structure for: ${projectDescription}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) return getDefaultWBS();

  try {
    return JSON.parse(textBlock.text) as WBSItem[];
  } catch {
    return getDefaultWBS();
  }
}

// --- Analyze Variance Alerts ---
export async function analyzeVariance(
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    entity_type: string;
    variance_amount: number;
    variance_percent: number;
  }>
): Promise<string> {
  if (alerts.length === 0) return 'No active variance alerts.';

  const alertSummary = alerts
    .map(
      (a) =>
        `- [${a.severity.toUpperCase()}] ${a.type}: ${a.message} (${a.variance_percent.toFixed(1)}% variance)`
    )
    .join('\n');

  return chat([
    {
      role: 'user',
      content: `Analyze these portfolio variance alerts and provide actionable recommendations:\n\n${alertSummary}`,
    },
  ]);
}

// --- Estimate Effort ---
export async function estimateEffort(
  featureDescription: string,
  historicalData?: string
): Promise<string> {
  const context = historicalData
    ? `\n\nHistorical reference data:\n${historicalData}`
    : '';

  return chat([
    {
      role: 'user',
      content: `Estimate the effort (in hours) for this feature and explain your reasoning:

Feature: ${featureDescription}${context}

Provide:
1. Estimated hours (range: low-high)
2. Confidence level (low/medium/high)
3. Key assumptions
4. Risks that could increase effort`,
    },
  ]);
}

// --- Generate Stakeholder Report ---
export async function generateReport(
  reportType: 'weekly' | 'monthly' | 'executive'
): Promise<string> {
  const context = buildPortfolioContext();

  return chat(
    [
      {
        role: 'user',
        content: `Generate a ${reportType} stakeholder report for the portfolio. Include:
1. Executive summary (2-3 sentences)
2. Portfolio health overview
3. Key accomplishments
4. Risks and issues
5. Upcoming milestones
6. Resource highlights
7. Financial summary (budget vs actuals)

Format as clean markdown suitable for sharing with leadership.`,
      },
    ],
    context
  );
}

// --- Natural Language Query ---
export async function queryData(question: string): Promise<string> {
  const context = buildPortfolioContext();

  return chat(
    [
      {
        role: 'user',
        content: `Answer this question about the portfolio data: ${question}

Use the portfolio context provided. If the data isn't available to answer the question precisely, say so and suggest what data would be needed.`,
      },
    ],
    context
  );
}

// --- Generate Comparison Narrative ---
export async function generateComparisonNarrative(comparison: any): Promise<string> {
  return chat([{
    role: 'user',
    content: `Analyze this portfolio comparison and provide a concise executive narrative (3-5 paragraphs) explaining what changed and what it means:

New projects: ${JSON.stringify(comparison.newProjects?.map((p: any) => p.title) || [])}
Removed projects: ${JSON.stringify(comparison.removedProjects?.map((p: any) => p.title) || [])}
Budget change: $${comparison.financialDelta?.budgetChange?.toLocaleString() || 0} NZD
Actuals change: $${comparison.financialDelta?.actualsChange?.toLocaleString() || 0} NZD
Alert changes: ${comparison.alertsDelta?.newAlerts || 0} new, ${comparison.alertsDelta?.resolvedAlerts || 0} resolved
Project changes: ${comparison.projectChanges?.length || 0} projects with changes

Focus on: what's improved, what's at risk, and recommended actions.`
  }]);
}

// --- Default WBS Fallback ---
function getDefaultWBS(): WBSItem[] {
  return [
    {
      title: 'Phase 1: Foundation',
      type: 'Epic',
      state: 'New',
      children: [
        {
          title: 'Core Infrastructure',
          type: 'Feature',
          state: 'New',
          children: [
            { title: 'Set up development environment', type: 'User Story', state: 'New' },
            { title: 'Create project scaffold', type: 'User Story', state: 'New' },
          ],
        },
      ],
    },
    {
      title: 'Phase 2: Core Features',
      type: 'Epic',
      state: 'New',
      children: [
        {
          title: 'Primary Functionality',
          type: 'Feature',
          state: 'New',
          children: [
            { title: 'Implement main workflow', type: 'User Story', state: 'New' },
            { title: 'Add data management', type: 'User Story', state: 'New' },
          ],
        },
      ],
    },
  ];
}
