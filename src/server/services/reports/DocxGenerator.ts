// ============================================================
// KOGVANTAGE -- Word Document Report Generator
// Generates weekly and monthly reports using the docx library
// Server-side only
// ============================================================

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Footer,
  PageNumber,
  WidthType,
  ShadingType,
  Header,
  Tab,
  TabStopPosition,
  TabStopType,
} from 'docx';
import type { PortfolioSnapshot, ProjectSummary, AlertSummary } from './ReportDataService';

// =====================
// Design Constants
// =====================

const COLORS = {
  primary: '2563EB',
  primaryDark: '1E40AF',
  green: '22C55E',
  yellow: 'EAB308',
  red: 'EF4444',
  orange: 'F97316',
  darkText: '1E293B',
  bodyText: '334155',
  mutedText: '64748B',
  tableHeader: '2563EB',
  tableRowEven: 'F8FAFC',
  tableRowOdd: 'FFFFFF',
  border: 'E2E8F0',
} as const;

const FONT = 'Calibri';

// =====================
// Helpers
// =====================

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} NZD`;
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

function statusColorHex(status: string): string {
  switch (status) {
    case 'done': return COLORS.green;
    case 'in-progress': return COLORS.primary;
    case 'blocked': return COLORS.red;
    case 'planned': return COLORS.mutedText;
    default: return COLORS.bodyText;
  }
}

function healthColorHex(health: number): string {
  if (health >= 70) return COLORS.green;
  if (health >= 40) return COLORS.yellow;
  return COLORS.red;
}

function severityColorHex(severity: string): string {
  switch (severity) {
    case 'critical': return COLORS.red;
    case 'high': return COLORS.orange;
    case 'medium': return COLORS.yellow;
    case 'low': return COLORS.green;
    default: return COLORS.bodyText;
  }
}

function createTableBorders() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: COLORS.border };
  return { top: border, bottom: border, left: border, right: border };
}

function headerCell(text: string, widthPercent?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', font: FONT, size: 20 })],
        alignment: AlignmentType.LEFT,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: COLORS.tableHeader, fill: COLORS.tableHeader },
    borders: createTableBorders(),
    ...(widthPercent ? { width: { size: widthPercent, type: WidthType.PERCENTAGE } } : {}),
  });
}

function dataCell(text: string, options?: { color?: string; bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }, rowIdx?: number): TableCell {
  const isEven = (rowIdx ?? 0) % 2 === 0;
  const fillColor = isEven ? COLORS.tableRowEven : COLORS.tableRowOdd;
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            color: options?.color || COLORS.bodyText,
            bold: options?.bold || false,
            font: FONT,
            size: 20,
          }),
        ],
        alignment: options?.align || AlignmentType.LEFT,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: fillColor, fill: fillColor },
    borders: createTableBorders(),
  });
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 300, after: 120 },
    run: { font: FONT, color: COLORS.darkText },
  });
}

function bodyText(text: string, options?: { bold?: boolean; spacing?: { before?: number; after?: number } }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 22,
        color: COLORS.bodyText,
        bold: options?.bold || false,
      }),
    ],
    spacing: options?.spacing || { before: 60, after: 60 },
  });
}

function bulletPoint(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text, font: FONT, size: 22, color: COLORS.bodyText }),
    ],
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
  });
}

function spacer(): Paragraph {
  return new Paragraph({ text: '', spacing: { before: 100, after: 100 } });
}

function buildHeader(orgName: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: orgName || 'Kogvantage', font: FONT, size: 16, color: COLORS.mutedText, bold: true }),
          new TextRun({ text: '\t' }),
          new TextRun({ text: 'CONFIDENTIAL', font: FONT, size: 16, color: COLORS.mutedText, italics: true }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      }),
    ],
  });
}

function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'Generated by Kogvantage', font: FONT, size: 16, color: COLORS.mutedText }),
          new TextRun({ text: '\t' }),
          new TextRun({ text: 'Page ' }),
          new TextRun({ children: [PageNumber.CURRENT] }),
          new TextRun({ text: ' of ' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      }),
    ],
  });
}

// =====================
// Executive Summary Helpers
// =====================

function generateExecutiveBullets(snapshot: PortfolioSnapshot): string[] {
  const bullets: string[] = [];

  // Health summary
  const healthyCount = snapshot.projects.filter((p: ProjectSummary) => p.health >= 70).length;
  const atRiskCount = snapshot.projects.filter((p: ProjectSummary) => p.health >= 40 && p.health < 70).length;
  const criticalCount = snapshot.projects.filter((p: ProjectSummary) => p.health < 40).length;

  bullets.push(
    `Portfolio contains ${snapshot.totalProjects} active projects with an average health of ${snapshot.averageHealth}% ` +
    `(${healthyCount} healthy, ${atRiskCount} at risk, ${criticalCount} critical).`
  );

  // Financial
  if (snapshot.totalBudget > 0) {
    const utilizationPct = snapshot.totalActuals > 0
      ? Math.round((snapshot.totalActuals / snapshot.totalBudget) * 100)
      : 0;
    bullets.push(
      `Total portfolio budget is ${formatCurrency(snapshot.totalBudget)} with ${formatCurrency(snapshot.totalActuals)} in actuals ` +
      `(${utilizationPct}% utilization). Variance stands at ${formatCurrency(snapshot.totalVariance)}.`
    );
  }

  // Alerts
  if (snapshot.activeAlerts.length > 0) {
    const critAlerts = snapshot.alertsBySeverity['critical'] || 0;
    const highAlerts = snapshot.alertsBySeverity['high'] || 0;
    bullets.push(
      `${snapshot.activeAlerts.length} active variance alerts requiring attention` +
      (critAlerts > 0 || highAlerts > 0 ? ` (${critAlerts} critical, ${highAlerts} high severity).` : '.')
    );
  } else {
    bullets.push('No active variance alerts across the portfolio.');
  }

  return bullets;
}

// =====================
// Project Status Table
// =====================

function buildProjectTable(projects: ProjectSummary[]): Table {
  const headerRow = new TableRow({
    children: [
      headerCell('Project', 35),
      headerCell('Status', 15),
      headerCell('Health', 10),
      headerCell('Budget', 20),
      headerCell('Tasks', 10),
      headerCell('Epics', 10),
    ],
    tableHeader: true,
  });

  const dataRows = projects.map((p: ProjectSummary, idx: number) =>
    new TableRow({
      children: [
        dataCell(p.title, { bold: true }, idx),
        dataCell(p.status, { color: statusColorHex(p.status) }, idx),
        dataCell(`${p.health}%`, { color: healthColorHex(p.health), bold: true, align: AlignmentType.CENTER }, idx),
        dataCell(formatCurrency(p.budgetDollars), { align: AlignmentType.RIGHT }, idx),
        dataCell(`${p.taskCount}`, { align: AlignmentType.CENTER }, idx),
        dataCell(`${p.epicCount}`, { align: AlignmentType.CENTER }, idx),
      ],
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// =====================
// Alerts Table
// =====================

function buildAlertsTable(alerts: AlertSummary[]): Table {
  const headerRow = new TableRow({
    children: [
      headerCell('Severity', 15),
      headerCell('Type', 15),
      headerCell('Message', 55),
      headerCell('Variance', 15),
    ],
    tableHeader: true,
  });

  const dataRows = alerts.map((a: AlertSummary, idx: number) =>
    new TableRow({
      children: [
        dataCell(a.severity.toUpperCase(), { color: severityColorHex(a.severity), bold: true }, idx),
        dataCell(a.type, {}, idx),
        dataCell(a.message, {}, idx),
        dataCell(`${a.variancePercent.toFixed(1)}%`, { align: AlignmentType.RIGHT }, idx),
      ],
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// =====================
// Weekly Report
// =====================

export async function generateWeeklyReport(snapshot: PortfolioSnapshot): Promise<Buffer> {
  const sections: Paragraph[] = [];

  // Title
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Weekly Portfolio Status Report',
          font: FONT,
          size: 48,
          bold: true,
          color: COLORS.primaryDark,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
    })
  );

  // Subtitle with date and org
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${snapshot.orgName || 'Kogvantage'} | ${formatDate(snapshot.generatedAt)}`,
          font: FONT,
          size: 24,
          color: COLORS.mutedText,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Horizontal rule
  sections.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary } },
      spacing: { after: 200 },
    })
  );

  // Executive Summary
  sections.push(heading('Executive Summary', HeadingLevel.HEADING_1));
  const bullets = generateExecutiveBullets(snapshot);
  for (const b of bullets) {
    sections.push(bulletPoint(b));
  }

  // Portfolio Health
  sections.push(spacer());
  sections.push(heading('Portfolio Health', HeadingLevel.HEADING_1));
  sections.push(bodyText(
    `The portfolio currently tracks ${snapshot.totalProjects} projects across ${Object.keys(snapshot.byStatus).length} statuses. ` +
    `Average health score is ${snapshot.averageHealth}%.`
  ));

  const statusSummary = Object.entries(snapshot.byStatus)
    .map(([status, count]) => `${status}: ${count}`)
    .join(', ');
  sections.push(bodyText(`Status breakdown: ${statusSummary}.`));

  // Build document with table in a separate section content array
  const projectTableContent: (Paragraph | Table)[] = [...sections];
  projectTableContent.push(spacer());
  projectTableContent.push(buildProjectTable(snapshot.projects));

  // Financial Overview
  projectTableContent.push(spacer());
  projectTableContent.push(heading('Financial Overview', HeadingLevel.HEADING_1));

  const finTable = new Table({
    rows: [
      new TableRow({
        children: [
          headerCell('Metric', 50),
          headerCell('Value', 50),
        ],
        tableHeader: true,
      }),
      new TableRow({
        children: [
          dataCell('Total Budget', { bold: true }, 0),
          dataCell(formatCurrency(snapshot.totalBudget), { align: AlignmentType.RIGHT }, 0),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Total Actuals', { bold: true }, 1),
          dataCell(formatCurrency(snapshot.totalActuals), { align: AlignmentType.RIGHT }, 1),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Variance', { bold: true }, 2),
          dataCell(
            formatCurrency(snapshot.totalVariance),
            { color: snapshot.totalVariance >= 0 ? COLORS.green : COLORS.red, bold: true, align: AlignmentType.RIGHT },
            2
          ),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Monthly Burn Rate', { bold: true }, 3),
          dataCell(formatCurrency(snapshot.burnRate), { align: AlignmentType.RIGHT }, 3),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  projectTableContent.push(spacer());
  projectTableContent.push(finTable);

  // Risk & Issues
  projectTableContent.push(spacer());
  projectTableContent.push(heading('Risk & Issues', HeadingLevel.HEADING_1));

  if (snapshot.activeAlerts.length === 0) {
    projectTableContent.push(bodyText('No active variance alerts across the portfolio.'));
  } else {
    projectTableContent.push(bodyText(
      `There are ${snapshot.activeAlerts.length} active alerts requiring attention.`
    ));
    projectTableContent.push(spacer());
    projectTableContent.push(buildAlertsTable(snapshot.activeAlerts));
  }

  // Resource Utilization
  projectTableContent.push(spacer());
  projectTableContent.push(heading('Resource Utilization', HeadingLevel.HEADING_1));

  projectTableContent.push(bodyText(`Total resources: ${snapshot.totalResources}`));
  for (const [type, count] of Object.entries(snapshot.byContractType)) {
    projectTableContent.push(bulletPoint(`${type}: ${count} resources`));
  }
  projectTableContent.push(spacer());
  projectTableContent.push(bodyText(
    `Recent timesheet activity: ${snapshot.recentTimesheetHours} hours logged (${snapshot.recentTimesheetPeriod}).`
  ));

  // Next Steps
  projectTableContent.push(spacer());
  projectTableContent.push(heading('Next Steps', HeadingLevel.HEADING_1));

  const blockedProjects = snapshot.projects.filter((p: ProjectSummary) => p.status === 'blocked');
  const lowHealthProjects = snapshot.projects.filter((p: ProjectSummary) => p.health < 40);

  if (blockedProjects.length > 0) {
    projectTableContent.push(bulletPoint(
      `Unblock ${blockedProjects.length} project(s): ${blockedProjects.map((p: ProjectSummary) => p.title).join(', ')}.`
    ));
  }
  if (lowHealthProjects.length > 0) {
    projectTableContent.push(bulletPoint(
      `Address critical health on: ${lowHealthProjects.map((p: ProjectSummary) => p.title).join(', ')}.`
    ));
  }
  if (snapshot.activeAlerts.length > 0) {
    const critAlerts = snapshot.alertsBySeverity['critical'] || 0;
    if (critAlerts > 0) {
      projectTableContent.push(bulletPoint(`Review and action ${critAlerts} critical variance alert(s).`));
    }
  }
  if (blockedProjects.length === 0 && lowHealthProjects.length === 0 && snapshot.activeAlerts.length === 0) {
    projectTableContent.push(bulletPoint('Continue monitoring portfolio health and variance thresholds.'));
  }

  // Build document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: COLORS.bodyText },
        },
        heading1: {
          run: { font: FONT, size: 32, bold: true, color: COLORS.primaryDark },
        },
        heading2: {
          run: { font: FONT, size: 26, bold: true, color: COLORS.darkText },
        },
      },
    },
    sections: [
      {
        headers: { default: buildHeader(snapshot.orgName) },
        footers: { default: buildFooter() },
        children: projectTableContent,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// =====================
// Monthly Report
// =====================

export async function generateMonthlyReport(snapshot: PortfolioSnapshot): Promise<Buffer> {
  const content: (Paragraph | Table)[] = [];

  // Title
  content.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Monthly Portfolio Status Report',
          font: FONT,
          size: 48,
          bold: true,
          color: COLORS.primaryDark,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
    })
  );

  content.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${snapshot.orgName || 'Kogvantage'} | ${formatDate(snapshot.generatedAt)}`,
          font: FONT,
          size: 24,
          color: COLORS.mutedText,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  content.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.primary } },
      spacing: { after: 200 },
    })
  );

  // Executive Summary
  content.push(heading('Executive Summary', HeadingLevel.HEADING_1));
  const bullets = generateExecutiveBullets(snapshot);
  for (const b of bullets) {
    content.push(bulletPoint(b));
  }

  // Portfolio Health Overview
  content.push(spacer());
  content.push(heading('Portfolio Health Overview', HeadingLevel.HEADING_1));

  const healthyCount = snapshot.projects.filter((p: ProjectSummary) => p.health >= 70).length;
  const atRiskCount = snapshot.projects.filter((p: ProjectSummary) => p.health >= 40 && p.health < 70).length;
  const criticalCount = snapshot.projects.filter((p: ProjectSummary) => p.health < 40).length;

  content.push(bodyText(
    `Portfolio health distribution: ${healthyCount} healthy, ${atRiskCount} at risk, ${criticalCount} critical. ` +
    `Average health score across all projects is ${snapshot.averageHealth}%.`
  ));

  content.push(spacer());
  content.push(buildProjectTable(snapshot.projects));

  // Detailed Per-Project Breakdowns
  content.push(spacer());
  content.push(heading('Detailed Project Breakdowns', HeadingLevel.HEADING_1));

  for (const project of snapshot.projects) {
    content.push(heading(project.title, HeadingLevel.HEADING_2));

    content.push(bodyText(`Status: ${project.status} | Health: ${project.health}% | Lane: ${project.lane || 'N/A'}`));
    content.push(bodyText(`Timeline: ${project.startDate} to ${project.endDate}`));
    content.push(bodyText(`Budget: ${formatCurrency(project.budgetDollars)} | Epics: ${project.epicCount} | Tasks: ${project.taskCount}`));

    // Health indicator
    const healthLabel = project.health >= 70 ? 'HEALTHY' : project.health >= 40 ? 'AT RISK' : 'CRITICAL';
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Health Assessment: `, font: FONT, size: 22, color: COLORS.bodyText }),
          new TextRun({
            text: healthLabel,
            font: FONT,
            size: 22,
            bold: true,
            color: healthColorHex(project.health),
          }),
        ],
        spacing: { before: 40, after: 80 },
      })
    );
  }

  // Financial Trend Analysis
  content.push(spacer());
  content.push(heading('Financial Trend Analysis', HeadingLevel.HEADING_1));

  if (snapshot.totalBudget > 0) {
    const utilizationPct = snapshot.totalActuals > 0
      ? Math.round((snapshot.totalActuals / snapshot.totalBudget) * 100)
      : 0;

    content.push(bodyText(
      `The portfolio has a combined budget of ${formatCurrency(snapshot.totalBudget)} with ` +
      `${formatCurrency(snapshot.totalActuals)} in recorded actuals, representing a ${utilizationPct}% budget utilization rate.`
    ));

    if (snapshot.burnRate > 0) {
      const remainingBudget = snapshot.totalBudget - snapshot.totalActuals;
      const monthsRemaining = snapshot.burnRate > 0 ? Math.round(remainingBudget / snapshot.burnRate) : 0;
      content.push(bodyText(
        `At the current burn rate of ${formatCurrency(snapshot.burnRate)} per month, ` +
        `the remaining budget of ${formatCurrency(remainingBudget)} would sustain approximately ${monthsRemaining} months of activity.`
      ));
    }

    content.push(bodyText(
      `Variance stands at ${formatCurrency(snapshot.totalVariance)}${snapshot.totalVariance < 0 ? ' (over budget)' : ' (under budget)'}.`
    ));
  } else {
    content.push(bodyText('No financial data has been recorded for the portfolio.'));
  }

  // Financial summary table
  content.push(spacer());
  const finTable = new Table({
    rows: [
      new TableRow({
        children: [
          headerCell('Metric', 50),
          headerCell('Value', 50),
        ],
        tableHeader: true,
      }),
      new TableRow({
        children: [
          dataCell('Total Budget', { bold: true }, 0),
          dataCell(formatCurrency(snapshot.totalBudget), { align: AlignmentType.RIGHT }, 0),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Total Actuals', { bold: true }, 1),
          dataCell(formatCurrency(snapshot.totalActuals), { align: AlignmentType.RIGHT }, 1),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Variance', { bold: true }, 2),
          dataCell(
            formatCurrency(snapshot.totalVariance),
            { color: snapshot.totalVariance >= 0 ? COLORS.green : COLORS.red, bold: true, align: AlignmentType.RIGHT },
            2
          ),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Monthly Burn Rate', { bold: true }, 3),
          dataCell(formatCurrency(snapshot.burnRate), { align: AlignmentType.RIGHT }, 3),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
  content.push(finTable);

  // Per-project budget table
  content.push(spacer());
  content.push(heading('Budget by Project', HeadingLevel.HEADING_2));

  const projectBudgetRows = snapshot.projects.map((p: ProjectSummary, idx: number) =>
    new TableRow({
      children: [
        dataCell(p.title, { bold: true }, idx),
        dataCell(formatCurrency(p.budgetDollars), { align: AlignmentType.RIGHT }, idx),
        dataCell(`${p.health}%`, { color: healthColorHex(p.health), bold: true, align: AlignmentType.CENTER }, idx),
        dataCell(p.status, { color: statusColorHex(p.status) }, idx),
      ],
    })
  );

  const budgetTable = new Table({
    rows: [
      new TableRow({
        children: [
          headerCell('Project', 40),
          headerCell('Budget', 25),
          headerCell('Health', 15),
          headerCell('Status', 20),
        ],
        tableHeader: true,
      }),
      ...projectBudgetRows,
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
  content.push(budgetTable);

  // Risk & Issues
  content.push(spacer());
  content.push(heading('Risk & Issues', HeadingLevel.HEADING_1));

  if (snapshot.activeAlerts.length === 0) {
    content.push(bodyText('No active variance alerts across the portfolio this period.'));
  } else {
    content.push(bodyText(
      `There are ${snapshot.activeAlerts.length} active variance alerts requiring attention.`
    ));

    // Alert type breakdown
    if (Object.keys(snapshot.alertsByType).length > 0) {
      content.push(bodyText('Alerts by type:', { bold: true }));
      for (const [type, count] of Object.entries(snapshot.alertsByType)) {
        content.push(bulletPoint(`${type}: ${count}`));
      }
    }

    content.push(spacer());
    content.push(buildAlertsTable(snapshot.activeAlerts));
  }

  // Resource Allocation Summary
  content.push(spacer());
  content.push(heading('Resource Allocation Summary', HeadingLevel.HEADING_1));

  content.push(bodyText(`The portfolio is supported by ${snapshot.totalResources} resources.`));

  if (Object.keys(snapshot.byContractType).length > 0) {
    const resourceRows = Object.entries(snapshot.byContractType).map(([type, count], idx) =>
      new TableRow({
        children: [
          dataCell(type, { bold: true }, idx),
          dataCell(`${count}`, { align: AlignmentType.CENTER }, idx),
          dataCell(
            snapshot.totalResources > 0 ? `${Math.round((count / snapshot.totalResources) * 100)}%` : '0%',
            { align: AlignmentType.CENTER },
            idx
          ),
        ],
      })
    );

    const resourceTable = new Table({
      rows: [
        new TableRow({
          children: [
            headerCell('Contract Type', 40),
            headerCell('Count', 30),
            headerCell('Percentage', 30),
          ],
          tableHeader: true,
        }),
        ...resourceRows,
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    });

    content.push(spacer());
    content.push(resourceTable);
  }

  content.push(spacer());
  content.push(bodyText(
    `Recent timesheet activity: ${snapshot.recentTimesheetHours} hours logged (${snapshot.recentTimesheetPeriod}).`
  ));

  // Governance Status
  content.push(spacer());
  content.push(heading('Governance Status', HeadingLevel.HEADING_1));

  const inProgressCount = snapshot.byStatus['in-progress'] || 0;
  const doneCount = snapshot.byStatus['done'] || 0;
  const plannedCount = snapshot.byStatus['planned'] || 0;
  const blockedCount = snapshot.byStatus['blocked'] || 0;

  content.push(bodyText(
    `Of ${snapshot.totalProjects} projects: ${inProgressCount} are actively in progress, ` +
    `${doneCount} completed, ${plannedCount} in planning, and ${blockedCount} blocked.`
  ));

  if (blockedCount > 0) {
    const blockedNames = snapshot.projects
      .filter((p: ProjectSummary) => p.status === 'blocked')
      .map((p: ProjectSummary) => p.title)
      .join(', ');
    content.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Blocked projects requiring escalation: ', font: FONT, size: 22, color: COLORS.bodyText }),
          new TextRun({ text: blockedNames, font: FONT, size: 22, bold: true, color: COLORS.red }),
        ],
        spacing: { before: 60, after: 60 },
      })
    );
  }

  // Next Steps / Upcoming Milestones
  content.push(spacer());
  content.push(heading('Next Steps & Recommendations', HeadingLevel.HEADING_1));

  const lowHealthProjects = snapshot.projects.filter((p: ProjectSummary) => p.health < 40);
  const blockedProjects = snapshot.projects.filter((p: ProjectSummary) => p.status === 'blocked');

  if (blockedProjects.length > 0) {
    content.push(bulletPoint(
      `Escalate and unblock ${blockedProjects.length} project(s): ${blockedProjects.map((p: ProjectSummary) => p.title).join(', ')}.`
    ));
  }
  if (lowHealthProjects.length > 0) {
    content.push(bulletPoint(
      `Initiate recovery plans for ${lowHealthProjects.length} project(s) with critical health: ${lowHealthProjects.map((p: ProjectSummary) => p.title).join(', ')}.`
    ));
  }
  if (snapshot.activeAlerts.length > 0) {
    content.push(bulletPoint(
      `Triage and respond to ${snapshot.activeAlerts.length} active variance alert(s).`
    ));
  }
  if (snapshot.burnRate > 0 && snapshot.totalBudget > 0) {
    const utilizationPct = Math.round((snapshot.totalActuals / snapshot.totalBudget) * 100);
    if (utilizationPct > 80) {
      content.push(bulletPoint(
        `Budget utilization is at ${utilizationPct}%. Review remaining commitments and consider re-forecasting.`
      ));
    }
  }
  if (blockedProjects.length === 0 && lowHealthProjects.length === 0 && snapshot.activeAlerts.length === 0) {
    content.push(bulletPoint('Portfolio is in good standing. Continue monitoring health and financial metrics.'));
    content.push(bulletPoint('Review upcoming project milestones and resource commitments for the next period.'));
  }

  // Build document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: COLORS.bodyText },
        },
        heading1: {
          run: { font: FONT, size: 32, bold: true, color: COLORS.primaryDark },
        },
        heading2: {
          run: { font: FONT, size: 26, bold: true, color: COLORS.darkText },
        },
      },
    },
    sections: [
      {
        headers: { default: buildHeader(snapshot.orgName) },
        footers: { default: buildFooter() },
        children: content,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
