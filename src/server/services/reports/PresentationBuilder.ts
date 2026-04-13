// ============================================================
// KOGVANTAGE -- Presentation Builder
// Converts a PortfolioSnapshot into PresentationSlide[] for
// the LivePresentation component.
// Server-side only -- no 'use client'
// ============================================================

export interface PresentationSlide {
  type: 'title' | 'kpi' | 'chart' | 'table' | 'summary';
  title: string;
  subtitle?: string;
  data?: any;
  chartType?: 'bar' | 'pie' | 'line' | 'gauge';
}

/**
 * Build a 7-slide presentation from a portfolio snapshot.
 *
 * @param snapshot - The portfolio data (from ReportDataService.gatherSnapshot)
 * @param template - Optional branding / palette overrides
 * @returns An array of PresentationSlide objects
 */
export function buildPresentation(snapshot: any, template?: any): PresentationSlide[] {
  const orgName = snapshot?.orgName || 'Kogvantage';
  const generatedAt = snapshot?.generatedAt
    ? new Date(snapshot.generatedAt).toLocaleDateString('en-NZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-NZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  const projects: any[] = snapshot?.projects || [];
  const activeAlerts: any[] = snapshot?.activeAlerts || [];

  // -----------------------------------------------------------
  // Slide 1: Title
  // -----------------------------------------------------------
  const titleSlide: PresentationSlide = {
    type: 'title',
    title: orgName,
    subtitle: 'Portfolio Status Report',
    data: { date: generatedAt },
  };

  // -----------------------------------------------------------
  // Slide 2: KPI overview
  // -----------------------------------------------------------
  const kpiSlide: PresentationSlide = {
    type: 'kpi',
    title: 'Key Performance Indicators',
    data: {
      kpis: [
        {
          label: 'Projects',
          value: snapshot?.totalProjects ?? projects.length,
        },
        {
          label: 'Avg Health',
          value: `${snapshot?.averageHealth ?? 0}%`,
          color: (snapshot?.averageHealth ?? 0) >= 70 ? '#10b981' : '#f59e0b',
        },
        {
          label: 'Total Budget',
          value: `$${((snapshot?.totalBudget ?? 0) / 1000).toFixed(0)}k`,
        },
        {
          label: 'Burn Rate',
          value: `$${((snapshot?.burnRate ?? 0) / 1000).toFixed(0)}k/mo`,
        },
        {
          label: 'Active Alerts',
          value: activeAlerts.length,
          color: activeAlerts.length > 5 ? '#ef4444' : activeAlerts.length > 0 ? '#f59e0b' : '#10b981',
        },
        {
          label: 'Resources',
          value: snapshot?.totalResources ?? 0,
        },
      ],
    },
  };

  // -----------------------------------------------------------
  // Slide 3: Budget vs Actuals (bar chart)
  // -----------------------------------------------------------
  const budgetChartSlide: PresentationSlide = {
    type: 'chart',
    title: 'Budget vs Actuals',
    subtitle: 'Per project comparison (NZD)',
    chartType: 'bar',
    data: {
      labels: ['Budget', 'Actuals'],
      items: projects.map((p: any) => ({
        name: p.title || 'Untitled',
        values: [p.budgetDollars || 0, p.actualsDollars || 0],
      })),
    },
  };

  // -----------------------------------------------------------
  // Slide 4: Status distribution (pie chart)
  // -----------------------------------------------------------
  const byStatus: Record<string, number> = snapshot?.byStatus || {};
  const statusPieSlide: PresentationSlide = {
    type: 'chart',
    title: 'Status Distribution',
    subtitle: 'Project breakdown by current status',
    chartType: 'pie',
    data: {
      items: Object.entries(byStatus).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        values: [count],
      })),
    },
  };

  // -----------------------------------------------------------
  // Slide 5: Project status table
  // -----------------------------------------------------------
  const projectTableSlide: PresentationSlide = {
    type: 'table',
    title: 'Project Status Overview',
    data: {
      headers: ['Project', 'Status', 'Health', 'Budget (NZD)'],
      rows: projects.map((p: any) => [
        p.title || 'Untitled',
        (p.status || 'unknown').charAt(0).toUpperCase() + (p.status || 'unknown').slice(1),
        `${p.health ?? 0}%`,
        `$${(p.budgetDollars || 0).toLocaleString('en-NZ')}`,
      ]),
    },
  };

  // -----------------------------------------------------------
  // Slide 6: Active alerts table
  // -----------------------------------------------------------
  const alertsTableSlide: PresentationSlide = {
    type: 'table',
    title: 'Active Alerts',
    data: {
      headers: ['Severity', 'Type', 'Message'],
      rows: activeAlerts.length > 0
        ? activeAlerts.map((a: any) => [
            (a.severity || 'info').toUpperCase(),
            a.type || '-',
            a.message || '-',
          ])
        : [['--', '--', 'No active alerts']],
    },
  };

  // -----------------------------------------------------------
  // Slide 7: AI summary placeholder
  // -----------------------------------------------------------
  const summarySlide: PresentationSlide = {
    type: 'summary',
    title: 'Key Findings',
    subtitle: 'AI-generated insights',
    data: {
      points: [
        'Key findings will be generated by AI based on the current portfolio snapshot.',
        'Connect an Anthropic API key to enable intelligent narrative summaries.',
        'AI can identify trends, risks, and recommendations across all projects.',
      ],
    },
  };

  return [
    titleSlide,
    kpiSlide,
    budgetChartSlide,
    statusPieSlide,
    projectTableSlide,
    alertsTableSlide,
    summarySlide,
  ];
}
