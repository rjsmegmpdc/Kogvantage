// ============================================================
// KOGVANTAGE -- PowerPoint Report Generator
// Generates executive slide decks using pptxgenjs
// Server-side only
// ============================================================

import PptxGenJS from 'pptxgenjs';
import type { PortfolioSnapshot, ProjectSummary, AlertSummary } from './ReportDataService';

// =====================
// Design Constants
// =====================

const COLORS = {
  darkNavy: '0f172a',
  navy: '1e293b',
  slate: '334155',
  slateLight: '64748b',
  white: 'FFFFFF',
  whiteSubtle: 'CBD5E1',
  primary: '2563eb',
  primaryLight: '3b82f6',
  green: '22c55e',
  yellow: 'eab308',
  red: 'ef4444',
  orange: 'f97316',
} as const;

const FONT = 'Calibri';

// =====================
// Helpers
// =====================

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'done':
      return COLORS.green;
    case 'in-progress':
      return COLORS.primary;
    case 'blocked':
      return COLORS.red;
    case 'planned':
      return COLORS.slateLight;
    default:
      return COLORS.whiteSubtle;
  }
}

function healthColor(health: number): string {
  if (health >= 70) return COLORS.green;
  if (health >= 40) return COLORS.yellow;
  return COLORS.red;
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return COLORS.red;
    case 'high':
      return COLORS.orange;
    case 'medium':
      return COLORS.yellow;
    case 'low':
      return COLORS.green;
    default:
      return COLORS.whiteSubtle;
  }
}

function addFooter(slide: PptxGenJS.Slide, pageNumber: number): void {
  slide.addText('Kogvantage', {
    x: 0.5,
    y: 7.0,
    w: 4,
    h: 0.3,
    fontSize: 8,
    color: COLORS.slateLight,
    fontFace: FONT,
  });
  slide.addText(`${pageNumber}`, {
    x: 8.5,
    y: 7.0,
    w: 1,
    h: 0.3,
    fontSize: 8,
    color: COLORS.slateLight,
    fontFace: FONT,
    align: 'right',
  });
}

function addSlideTitle(slide: PptxGenJS.Slide, title: string): void {
  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: COLORS.white,
    fontFace: FONT,
  });
  // Accent line under title
  slide.addShape('rect' as unknown as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 0.85,
    w: 2,
    h: 0.04,
    fill: { color: COLORS.primary },
  });
}

// =====================
// Generator
// =====================

export async function generateExecutiveReport(snapshot: PortfolioSnapshot): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.author = 'Kogvantage';
  pptx.company = snapshot.orgName || 'Kogvantage';
  pptx.subject = 'Portfolio Status Report';
  pptx.title = `Portfolio Status Report - ${formatDate(snapshot.generatedAt)}`;

  // Define slide master with dark background
  pptx.defineSlideMaster({
    title: 'KOGVANTAGE_DARK',
    background: { fill: COLORS.darkNavy },
  });

  // -------------------------------------------------------
  // Slide 1: Title
  // -------------------------------------------------------
  const slide1 = pptx.addSlide({ masterName: 'KOGVANTAGE_DARK' });

  // Accent bar at top
  slide1.addShape('rect' as unknown as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.08,
    fill: { color: COLORS.primary },
  });

  slide1.addText('Portfolio Status Report', {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 1.0,
    fontSize: 36,
    bold: true,
    color: COLORS.white,
    fontFace: FONT,
  });

  slide1.addText(snapshot.orgName || 'Kogvantage', {
    x: 0.5,
    y: 3.1,
    w: 9,
    h: 0.6,
    fontSize: 20,
    color: COLORS.primaryLight,
    fontFace: FONT,
  });

  slide1.addText(formatDate(snapshot.generatedAt), {
    x: 0.5,
    y: 3.8,
    w: 9,
    h: 0.5,
    fontSize: 14,
    color: COLORS.whiteSubtle,
    fontFace: FONT,
  });

  addFooter(slide1, 1);

  // -------------------------------------------------------
  // Slide 2: Portfolio Overview
  // -------------------------------------------------------
  const slide2 = pptx.addSlide({ masterName: 'KOGVANTAGE_DARK' });
  addSlideTitle(slide2, 'Portfolio Overview');

  // KPI cards row
  const kpis = [
    { label: 'Total Projects', value: `${snapshot.totalProjects}`, color: COLORS.primary },
    { label: 'Avg Health', value: `${snapshot.averageHealth}%`, color: healthColor(snapshot.averageHealth) },
    { label: 'Total Budget', value: formatCurrency(snapshot.totalBudget), color: COLORS.primary },
    { label: 'Resources', value: `${snapshot.totalResources}`, color: COLORS.primary },
  ];

  kpis.forEach((kpi, i) => {
    const xPos = 0.5 + i * 2.3;
    // Card background
    slide2.addShape('rect' as unknown as PptxGenJS.ShapeType, {
      x: xPos,
      y: 1.3,
      w: 2.1,
      h: 1.4,
      fill: { color: COLORS.navy },
      rectRadius: 0.1,
    });
    // Value
    slide2.addText(kpi.value, {
      x: xPos,
      y: 1.4,
      w: 2.1,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: kpi.color,
      fontFace: FONT,
      align: 'center',
    });
    // Label
    slide2.addText(kpi.label, {
      x: xPos,
      y: 2.15,
      w: 2.1,
      h: 0.4,
      fontSize: 11,
      color: COLORS.whiteSubtle,
      fontFace: FONT,
      align: 'center',
    });
  });

  // Status breakdown
  slide2.addText('Projects by Status', {
    x: 0.5,
    y: 3.1,
    w: 4,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: COLORS.white,
    fontFace: FONT,
  });

  const statusEntries = Object.entries(snapshot.byStatus);
  statusEntries.forEach(([status, count], i) => {
    slide2.addText(`${status}: ${count}`, {
      x: 0.7,
      y: 3.6 + i * 0.35,
      w: 3,
      h: 0.3,
      fontSize: 12,
      color: statusColor(status),
      fontFace: FONT,
    });
  });

  // Budget summary
  slide2.addText('Financial Summary', {
    x: 5,
    y: 3.1,
    w: 4,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: COLORS.white,
    fontFace: FONT,
  });

  const finLines = [
    `Budget: ${formatCurrency(snapshot.totalBudget)}`,
    `Actuals: ${formatCurrency(snapshot.totalActuals)}`,
    `Variance: ${formatCurrency(snapshot.totalVariance)}`,
    `Burn Rate: ${formatCurrency(snapshot.burnRate)}/mo`,
  ];
  finLines.forEach((line, i) => {
    slide2.addText(line, {
      x: 5.2,
      y: 3.6 + i * 0.35,
      w: 4,
      h: 0.3,
      fontSize: 12,
      color: COLORS.whiteSubtle,
      fontFace: FONT,
    });
  });

  addFooter(slide2, 2);

  // -------------------------------------------------------
  // Slide 3: Project Status Table
  // -------------------------------------------------------
  const slide3 = pptx.addSlide({ masterName: 'KOGVANTAGE_DARK' });
  addSlideTitle(slide3, 'Project Status');

  const tableHeader: PptxGenJS.TableRow = [
    { text: 'Project', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT } },
    { text: 'Status', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT } },
    { text: 'Health', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT, align: 'center' } },
    { text: 'Budget', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT, align: 'right' } },
    { text: 'Tasks', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT, align: 'center' } },
    { text: 'Epics', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT, align: 'center' } },
  ];

  const tableRows: PptxGenJS.TableRow[] = snapshot.projects
    .slice(0, 15) // Limit rows for readability
    .map((p: ProjectSummary, idx: number) => {
      const rowFill = idx % 2 === 0 ? COLORS.darkNavy : COLORS.navy;
      return [
        { text: p.title, options: { fontSize: 9, color: COLORS.white, fill: { color: rowFill }, fontFace: FONT } },
        { text: p.status, options: { fontSize: 9, color: statusColor(p.status), fill: { color: rowFill }, fontFace: FONT } },
        { text: `${p.health}%`, options: { fontSize: 9, color: healthColor(p.health), fill: { color: rowFill }, fontFace: FONT, align: 'center' } },
        { text: formatCurrency(p.budgetDollars), options: { fontSize: 9, color: COLORS.whiteSubtle, fill: { color: rowFill }, fontFace: FONT, align: 'right' } },
        { text: `${p.taskCount}`, options: { fontSize: 9, color: COLORS.whiteSubtle, fill: { color: rowFill }, fontFace: FONT, align: 'center' } },
        { text: `${p.epicCount}`, options: { fontSize: 9, color: COLORS.whiteSubtle, fill: { color: rowFill }, fontFace: FONT, align: 'center' } },
      ] as PptxGenJS.TableRow;
    });

  slide3.addTable([tableHeader, ...tableRows], {
    x: 0.5,
    y: 1.2,
    w: 9,
    colW: [3.0, 1.2, 0.9, 1.5, 0.8, 0.8],
    border: { type: 'solid', pt: 0.5, color: COLORS.slate },
    margin: [3, 5, 3, 5],
  });

  if (snapshot.totalProjects > 15) {
    slide3.addText(`Showing 15 of ${snapshot.totalProjects} projects`, {
      x: 0.5,
      y: 6.5,
      w: 9,
      h: 0.3,
      fontSize: 9,
      italic: true,
      color: COLORS.slateLight,
      fontFace: FONT,
    });
  }

  addFooter(slide3, 3);

  // -------------------------------------------------------
  // Slide 4: Financial Summary
  // -------------------------------------------------------
  const slide4 = pptx.addSlide({ masterName: 'KOGVANTAGE_DARK' });
  addSlideTitle(slide4, 'Financial Summary');

  // Budget vs Actuals comparison cards
  const finCards = [
    { label: 'Total Budget', value: formatCurrency(snapshot.totalBudget), color: COLORS.primary },
    { label: 'Total Actuals', value: formatCurrency(snapshot.totalActuals), color: COLORS.primaryLight },
    { label: 'Variance', value: formatCurrency(snapshot.totalVariance), color: snapshot.totalVariance >= 0 ? COLORS.green : COLORS.red },
    { label: 'Monthly Burn Rate', value: formatCurrency(snapshot.burnRate), color: COLORS.orange },
  ];

  finCards.forEach((card, i) => {
    const xPos = 0.5 + i * 2.3;
    slide4.addShape('rect' as unknown as PptxGenJS.ShapeType, {
      x: xPos,
      y: 1.3,
      w: 2.1,
      h: 1.4,
      fill: { color: COLORS.navy },
      rectRadius: 0.1,
    });
    slide4.addText(card.value, {
      x: xPos,
      y: 1.4,
      w: 2.1,
      h: 0.8,
      fontSize: 22,
      bold: true,
      color: card.color,
      fontFace: FONT,
      align: 'center',
    });
    slide4.addText(card.label, {
      x: xPos,
      y: 2.15,
      w: 2.1,
      h: 0.4,
      fontSize: 11,
      color: COLORS.whiteSubtle,
      fontFace: FONT,
      align: 'center',
    });
  });

  // Per-project financial breakdown table
  slide4.addText('Budget by Project', {
    x: 0.5,
    y: 3.1,
    w: 9,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: COLORS.white,
    fontFace: FONT,
  });

  const finTableHeader: PptxGenJS.TableRow = [
    { text: 'Project', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT } },
    { text: 'Budget', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT, align: 'right' } },
    { text: 'Health', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT, align: 'center' } },
    { text: 'Status', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 10, fontFace: FONT } },
  ];

  const finTableRows: PptxGenJS.TableRow[] = snapshot.projects
    .slice(0, 10)
    .map((p: ProjectSummary, idx: number) => {
      const rowFill = idx % 2 === 0 ? COLORS.darkNavy : COLORS.navy;
      return [
        { text: p.title, options: { fontSize: 9, color: COLORS.white, fill: { color: rowFill }, fontFace: FONT } },
        { text: formatCurrency(p.budgetDollars), options: { fontSize: 9, color: COLORS.whiteSubtle, fill: { color: rowFill }, fontFace: FONT, align: 'right' } },
        { text: `${p.health}%`, options: { fontSize: 9, color: healthColor(p.health), fill: { color: rowFill }, fontFace: FONT, align: 'center' } },
        { text: p.status, options: { fontSize: 9, color: statusColor(p.status), fill: { color: rowFill }, fontFace: FONT } },
      ] as PptxGenJS.TableRow;
    });

  slide4.addTable([finTableHeader, ...finTableRows], {
    x: 0.5,
    y: 3.6,
    w: 9,
    colW: [4.0, 2.0, 1.5, 1.5],
    border: { type: 'solid', pt: 0.5, color: COLORS.slate },
    margin: [3, 5, 3, 5],
  });

  addFooter(slide4, 4);

  // -------------------------------------------------------
  // Slide 5: Risk & Alerts
  // -------------------------------------------------------
  const slide5 = pptx.addSlide({ masterName: 'KOGVANTAGE_DARK' });
  addSlideTitle(slide5, 'Risk & Alerts');

  if (snapshot.activeAlerts.length === 0) {
    slide5.addText('No active alerts', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 18,
      color: COLORS.green,
      fontFace: FONT,
      align: 'center',
    });
  } else {
    // Alert summary cards
    const severities = ['critical', 'high', 'medium', 'low'];
    severities.forEach((sev, i) => {
      const count = snapshot.alertsBySeverity[sev] || 0;
      if (count > 0 || i < 2) {
        const xPos = 0.5 + i * 2.3;
        slide5.addShape('rect' as unknown as PptxGenJS.ShapeType, {
          x: xPos,
          y: 1.3,
          w: 2.1,
          h: 0.9,
          fill: { color: COLORS.navy },
          rectRadius: 0.1,
        });
        slide5.addText(`${count}`, {
          x: xPos,
          y: 1.3,
          w: 2.1,
          h: 0.55,
          fontSize: 24,
          bold: true,
          color: severityColor(sev),
          fontFace: FONT,
          align: 'center',
        });
        slide5.addText(sev.charAt(0).toUpperCase() + sev.slice(1), {
          x: xPos,
          y: 1.8,
          w: 2.1,
          h: 0.35,
          fontSize: 10,
          color: COLORS.whiteSubtle,
          fontFace: FONT,
          align: 'center',
        });
      }
    });

    // Alerts table
    const alertHeader: PptxGenJS.TableRow = [
      { text: 'Severity', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 9, fontFace: FONT } },
      { text: 'Type', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 9, fontFace: FONT } },
      { text: 'Message', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 9, fontFace: FONT } },
      { text: 'Variance', options: { bold: true, color: COLORS.white, fill: { color: COLORS.primary }, fontSize: 9, fontFace: FONT, align: 'right' } },
    ];

    const alertRows: PptxGenJS.TableRow[] = snapshot.activeAlerts
      .slice(0, 12)
      .map((a: AlertSummary, idx: number) => {
        const rowFill = idx % 2 === 0 ? COLORS.darkNavy : COLORS.navy;
        return [
          { text: a.severity.toUpperCase(), options: { fontSize: 8, bold: true, color: severityColor(a.severity), fill: { color: rowFill }, fontFace: FONT } },
          { text: a.type, options: { fontSize: 8, color: COLORS.whiteSubtle, fill: { color: rowFill }, fontFace: FONT } },
          { text: a.message.length > 60 ? a.message.substring(0, 57) + '...' : a.message, options: { fontSize: 8, color: COLORS.white, fill: { color: rowFill }, fontFace: FONT } },
          { text: `${a.variancePercent.toFixed(1)}%`, options: { fontSize: 8, color: COLORS.whiteSubtle, fill: { color: rowFill }, fontFace: FONT, align: 'right' } },
        ] as PptxGenJS.TableRow;
      });

    slide5.addTable([alertHeader, ...alertRows], {
      x: 0.5,
      y: 2.5,
      w: 9,
      colW: [1.2, 1.3, 5.0, 1.5],
      border: { type: 'solid', pt: 0.5, color: COLORS.slate },
      margin: [3, 5, 3, 5],
    });
  }

  addFooter(slide5, 5);

  // -------------------------------------------------------
  // Slide 6: Key Metrics
  // -------------------------------------------------------
  const slide6 = pptx.addSlide({ masterName: 'KOGVANTAGE_DARK' });
  addSlideTitle(slide6, 'Key Metrics');

  // Resource metrics
  slide6.addText('Resource Overview', {
    x: 0.5,
    y: 1.3,
    w: 4,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: COLORS.white,
    fontFace: FONT,
  });

  slide6.addShape('rect' as unknown as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 1.8,
    w: 4,
    h: 2.2,
    fill: { color: COLORS.navy },
    rectRadius: 0.1,
  });

  slide6.addText(`Total Resources: ${snapshot.totalResources}`, {
    x: 0.7,
    y: 1.9,
    w: 3.6,
    h: 0.35,
    fontSize: 12,
    color: COLORS.white,
    fontFace: FONT,
  });

  const contractEntries = Object.entries(snapshot.byContractType);
  contractEntries.forEach(([type, count], i) => {
    slide6.addText(`${type}: ${count}`, {
      x: 0.9,
      y: 2.3 + i * 0.3,
      w: 3.4,
      h: 0.3,
      fontSize: 11,
      color: COLORS.whiteSubtle,
      fontFace: FONT,
    });
  });

  // Timesheet metrics
  slide6.addText('Recent Activity', {
    x: 5,
    y: 1.3,
    w: 4.5,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: COLORS.white,
    fontFace: FONT,
  });

  slide6.addShape('rect' as unknown as PptxGenJS.ShapeType, {
    x: 5,
    y: 1.8,
    w: 4.5,
    h: 2.2,
    fill: { color: COLORS.navy },
    rectRadius: 0.1,
  });

  slide6.addText(`${snapshot.recentTimesheetHours}`, {
    x: 5,
    y: 1.9,
    w: 4.5,
    h: 0.7,
    fontSize: 36,
    bold: true,
    color: COLORS.primary,
    fontFace: FONT,
    align: 'center',
  });

  slide6.addText('Hours Logged', {
    x: 5,
    y: 2.6,
    w: 4.5,
    h: 0.3,
    fontSize: 11,
    color: COLORS.whiteSubtle,
    fontFace: FONT,
    align: 'center',
  });

  slide6.addText(snapshot.recentTimesheetPeriod, {
    x: 5,
    y: 2.9,
    w: 4.5,
    h: 0.3,
    fontSize: 10,
    color: COLORS.slateLight,
    fontFace: FONT,
    align: 'center',
  });

  // Portfolio health gauge visual
  slide6.addText('Portfolio Health Distribution', {
    x: 0.5,
    y: 4.3,
    w: 9,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: COLORS.white,
    fontFace: FONT,
  });

  const healthBuckets = { healthy: 0, atRisk: 0, critical: 0 };
  snapshot.projects.forEach((p: ProjectSummary) => {
    if (p.health >= 70) healthBuckets.healthy++;
    else if (p.health >= 40) healthBuckets.atRisk++;
    else healthBuckets.critical++;
  });

  const healthItems = [
    { label: 'Healthy (70-100%)', count: healthBuckets.healthy, color: COLORS.green },
    { label: 'At Risk (40-69%)', count: healthBuckets.atRisk, color: COLORS.yellow },
    { label: 'Critical (0-39%)', count: healthBuckets.critical, color: COLORS.red },
  ];

  healthItems.forEach((item, i) => {
    const xPos = 0.5 + i * 3.2;
    slide6.addShape('rect' as unknown as PptxGenJS.ShapeType, {
      x: xPos,
      y: 4.8,
      w: 2.8,
      h: 1.2,
      fill: { color: COLORS.navy },
      rectRadius: 0.1,
    });
    slide6.addText(`${item.count}`, {
      x: xPos,
      y: 4.85,
      w: 2.8,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: item.color,
      fontFace: FONT,
      align: 'center',
    });
    slide6.addText(item.label, {
      x: xPos,
      y: 5.45,
      w: 2.8,
      h: 0.4,
      fontSize: 10,
      color: COLORS.whiteSubtle,
      fontFace: FONT,
      align: 'center',
    });
  });

  addFooter(slide6, 6);

  // -------------------------------------------------------
  // Write to buffer
  // -------------------------------------------------------
  const output = await pptx.write({ outputType: 'nodebuffer' });
  return output as Buffer;
}
