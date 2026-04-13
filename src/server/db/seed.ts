// ============================================================
// KOGVANTAGE — Database Seed Script
// Run: npx tsx src/server/db/seed.ts
// ============================================================

import { getDb, closeDb } from './sqlite';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const db = getDb();

// ---- Guard against double-seeding ----
const existingProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
if (existingProjects.count > 0) {
  console.log('Database already seeded. Skipping.');
  closeDb();
  process.exit(0);
}

console.log('Starting Kogvantage database seed...\n');

// ============================================================
// ID generators (pre-assign so we can reference across tables)
// ============================================================
const projectIds = {
  platformMod: randomUUID(),
  securityEnh: randomUUID(),
  cloudMig: randomUUID(),
  identityZT: randomUUID(),
  virtualDesk: randomUUID(),
  aiInnovation: randomUUID(),
  uxRedesign: randomUUID(),
  orgTransform: randomUUID(),
};

const epicIds = {
  apiGateway: randomUUID(),
  legacyMigration: randomUUID(),
  secOpsAutomation: randomUUID(),
  secPenTesting: randomUUID(),
  deviceManagement: randomUUID(),
  macOsProgram: randomUUID(),
  cloudInfra: randomUUID(),
  ztArchitecture: randomUUID(),
  ztMfaRollout: randomUUID(),
  vdiModernize: randomUUID(),
  vdiPerformance: randomUUID(),
  mlPipeline: randomUUID(),
  aiAssistant: randomUUID(),
  uxResearch: randomUUID(),
  uxDesignSystem: randomUUID(),
  changeManagement: randomUUID(),
  orgTraining: randomUUID(),
};

const taskIds: Record<string, string> = {};
function taskId(key: string): string {
  if (!taskIds[key]) taskIds[key] = randomUUID();
  return taskIds[key];
}

const resourceIds: Record<string, string> = {};
function resourceId(key: string): string {
  if (!resourceIds[key]) resourceIds[key] = randomUUID();
  return resourceIds[key];
}

// ============================================================
// Run everything in a transaction for speed
// ============================================================
const seedAll = db.transaction(() => {
  // ==========================================================
  // 1. PROJECTS
  // ==========================================================
  const insertProject = db.prepare(`
    INSERT INTO projects (id, title, description, status, start_date, end_date, budget_cents, financial_treatment, lane, pm_name, row_position, health, subway_color, subway_sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const projects = [
    [projectIds.platformMod, 'Platform Modernization', 'End-to-end modernization of core platform services including API gateway, service mesh, and legacy system migration.', 'in-progress', '2025-03-01', '2026-06-30', 250000000, 'CAPEX', 'BTE Tribe', 'Sarah Johnson', 0, 78, '#3b82f6', 1],
    [projectIds.securityEnh, 'Security Enhancement', 'Comprehensive security uplift covering SecOps automation, penetration testing, and SIEM modernization.', 'in-progress', '2025-04-01', '2026-03-31', 180000000, 'OPEX', 'Security', 'Alex Taylor', 1, 65, '#ef4444', 2],
    [projectIds.cloudMig, 'Cloud Migration', 'Migration of on-premises workloads to Azure cloud including device management and macOS fleet.', 'planned', '2025-06-01', '2026-12-31', 320000000, 'CAPEX', 'EUC', 'David Brown', 2, 82, '#8b5cf6', 3],
    [projectIds.identityZT, 'Identity Zero Trust', 'Implementation of zero trust architecture with conditional access, MFA rollout, and identity governance.', 'in-progress', '2025-02-01', '2026-04-30', 120000000, 'MIXED', 'Identity', 'Chris Lee', 3, 90, '#06b6d4', 4],
    [projectIds.virtualDesk, 'Virtual Desktop', 'VDI modernization and performance optimization for hybrid workforce enablement.', 'in-progress', '2025-05-01', '2026-06-30', 95000000, 'OPEX', 'Virtual Desktop', 'Sam Rivera', 4, 72, '#ec4899', 5],
    [projectIds.aiInnovation, 'AI Innovation', 'ML pipeline development and AI assistant integration across enterprise tooling.', 'planned', '2025-07-01', '2026-09-30', 210000000, 'CAPEX', 'AI Innovation', 'Jordan Park', 5, 85, '#10b981', 6],
    [projectIds.uxRedesign, 'UX Redesign', 'User research, design system overhaul, and accessibility compliance for customer-facing applications.', 'blocked', '2025-04-01', '2026-03-31', 75000000, 'OPEX', 'BTE Tribe', 'Emma Wilson', 6, 45, '#3b82f6', 7],
    [projectIds.orgTransform, 'Org Transformation', 'Organizational change management and training programs to support digital transformation.', 'planned', '2025-08-01', '2026-06-30', 50000000, 'OPEX', 'Org & People', 'Morgan Kelly', 7, 70, '#64748b', 8],
  ];

  for (const p of projects) insertProject.run(...p);
  console.log(`Seeding projects... done (${projects.length})`);

  // ==========================================================
  // 2. EPICS
  // ==========================================================
  const insertEpic = db.prepare(`
    INSERT INTO epics (id, project_id, title, description, state, effort, business_value, time_criticality, start_date, end_date, assigned_to, risk_level, sizing, subway_lane_type, subway_merge_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const epics = [
    // Platform Modernization
    [epicIds.apiGateway, projectIds.platformMod, 'API Gateway', 'Design and deploy centralized API gateway with rate limiting, auth, and observability.', 'Active', 120, 90, 85, '2025-03-01', '2026-03-31', 'Sarah Johnson', 'Medium', 'L', 'trunk', null],
    [epicIds.legacyMigration, projectIds.platformMod, 'Legacy Migration', 'Migrate COBOL batch jobs and mainframe integrations to cloud-native microservices.', 'Active', 200, 80, 90, '2025-06-01', '2026-06-30', 'Mike Chen', 'High', 'XL', 'sublane', '2026-03-01'],

    // Security Enhancement
    [epicIds.secOpsAutomation, projectIds.securityEnh, 'SecOps Automation', 'Automate incident response playbooks, threat detection rules, and SOAR integration.', 'Active', 80, 95, 80, '2025-04-01', '2026-01-31', 'Alex Taylor', 'High', 'L', 'trunk', null],
    [epicIds.secPenTesting, projectIds.securityEnh, 'Penetration Testing Program', 'Establish continuous pen testing cadence with internal red team and external assessors.', 'New', 40, 70, 60, '2025-09-01', '2026-03-31', 'Alex Taylor', 'Medium', 'M', 'sublane', '2026-02-15'],

    // Cloud Migration
    [epicIds.deviceManagement, projectIds.cloudMig, 'Device Management', 'Intune enrollment, compliance policies, and app deployment for Windows fleet.', 'New', 150, 85, 75, '2025-06-01', '2026-06-30', 'David Brown', 'Medium', 'L', 'trunk', null],
    [epicIds.macOsProgram, projectIds.cloudMig, 'macOS Program', 'Extend MDM to macOS fleet with Jamf integration and self-service portal.', 'New', 80, 60, 50, '2025-09-01', '2026-12-31', 'Lisa Martinez', 'Low', 'M', 'sublane', '2026-06-01'],
    [epicIds.cloudInfra, projectIds.cloudMig, 'Cloud Infrastructure', 'Landing zone setup, networking, and governance guardrails in Azure.', 'New', 100, 90, 85, '2025-06-01', '2026-09-30', 'David Brown', 'High', 'L', 'trunk', null],

    // Identity Zero Trust
    [epicIds.ztArchitecture, projectIds.identityZT, 'ZT Architecture', 'Define and implement conditional access policies, micro-segmentation, and device trust.', 'Active', 90, 95, 90, '2025-02-01', '2026-02-28', 'Chris Lee', 'High', 'L', 'trunk', null],
    [epicIds.ztMfaRollout, projectIds.identityZT, 'MFA Rollout', 'Enterprise-wide MFA deployment with phishing-resistant authenticators.', 'Active', 60, 85, 95, '2025-04-01', '2026-04-30', 'Chris Lee', 'Medium', 'M', 'sublane', '2025-12-15'],

    // Virtual Desktop
    [epicIds.vdiModernize, projectIds.virtualDesk, 'VDI Modernization', 'Migrate from legacy Citrix to Azure Virtual Desktop with GPU-enabled profiles.', 'Active', 100, 80, 70, '2025-05-01', '2026-03-31', 'Sam Rivera', 'Medium', 'L', 'trunk', null],
    [epicIds.vdiPerformance, projectIds.virtualDesk, 'Performance Optimization', 'FSLogix profiling, bandwidth optimization, and latency reduction for remote users.', 'New', 50, 70, 65, '2025-08-01', '2026-06-30', 'Sam Rivera', 'Low', 'M', 'sublane', '2026-04-01'],

    // AI Innovation
    [epicIds.mlPipeline, projectIds.aiInnovation, 'ML Pipeline', 'Build MLOps pipeline with feature store, model registry, and automated retraining.', 'New', 130, 90, 70, '2025-07-01', '2026-06-30', 'Jordan Park', 'Medium', 'XL', 'trunk', null],
    [epicIds.aiAssistant, projectIds.aiInnovation, 'AI Assistant', 'Enterprise AI assistant powered by Claude for internal knowledge and workflow automation.', 'New', 80, 85, 60, '2025-10-01', '2026-09-30', 'Jordan Park', 'Low', 'L', 'sublane', '2026-07-01'],

    // UX Redesign
    [epicIds.uxResearch, projectIds.uxRedesign, 'UX Research', 'User interviews, journey mapping, and usability benchmarking for top 5 user flows.', 'Active', 40, 80, 85, '2025-04-01', '2025-09-30', 'Emma Wilson', 'Low', 'M', 'trunk', null],
    [epicIds.uxDesignSystem, projectIds.uxRedesign, 'Design System', 'Component library, tokens, and Figma kit aligned with WCAG 2.1 AA.', 'New', 70, 75, 70, '2025-07-01', '2026-03-31', 'Emma Wilson', 'Medium', 'L', 'sublane', '2026-01-15'],

    // Org Transformation
    [epicIds.changeManagement, projectIds.orgTransform, 'Change Management', 'Stakeholder engagement, impact assessments, and communication plans for digital transformation.', 'New', 60, 70, 65, '2025-08-01', '2026-03-31', 'Morgan Kelly', 'Low', 'M', 'trunk', null],
    [epicIds.orgTraining, projectIds.orgTransform, 'Training Programs', 'Role-based training curriculum and LMS rollout for new tools and processes.', 'New', 50, 65, 55, '2025-10-01', '2026-06-30', 'Morgan Kelly', 'Low', 'M', 'sublane', '2026-04-15'],
  ];

  for (const e of epics) insertEpic.run(...e);
  console.log(`Seeding epics... done (${epics.length})`);

  // ==========================================================
  // 3. TASKS
  // ==========================================================
  const insertTask = db.prepare(`
    INSERT INTO tasks (id, project_id, epic_id, title, status, start_date, end_date, effort_hours, percent_complete, subway_station_type, subway_label_top, subway_label_bottom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tasks = [
    // Platform Modernization (API Gateway)
    [taskId('pm1'), projectIds.platformMod, epicIds.apiGateway, 'API Discovery & Assessment', 'done', '2025-03-01', '2025-04-15', 120, 100, 'majorMilestone', 'Mar 2025', 'API Discovery'],
    [taskId('pm2'), projectIds.platformMod, epicIds.apiGateway, 'Gateway Architecture Design', 'done', '2025-04-16', '2025-06-30', 160, 100, 'minorMilestone', 'Jun 2025', 'Architecture'],
    [taskId('pm3'), projectIds.platformMod, epicIds.apiGateway, 'Gateway Implementation', 'in-progress', '2025-07-01', '2025-12-31', 400, 65, 'workEnvironment', 'Dec 2025', 'Implementation'],
    [taskId('pm4'), projectIds.platformMod, epicIds.apiGateway, 'Integration Testing', 'planned', '2026-01-01', '2026-03-31', 200, 0, 'issueResolution', 'Mar 2026', 'Testing'],
    [taskId('pm5'), projectIds.platformMod, epicIds.legacyMigration, 'Legacy System Inventory', 'done', '2025-06-01', '2025-07-31', 80, 100, 'majorMilestone', 'Jul 2025', 'Inventory'],

    // Security Enhancement
    [taskId('se1'), projectIds.securityEnh, epicIds.secOpsAutomation, 'Threat Landscape Analysis', 'done', '2025-04-01', '2025-05-31', 80, 100, 'majorMilestone', 'May 2025', 'Threat Analysis'],
    [taskId('se2'), projectIds.securityEnh, epicIds.secOpsAutomation, 'SOAR Platform Selection', 'done', '2025-06-01', '2025-07-31', 60, 100, 'minorMilestone', 'Jul 2025', 'SOAR Selection'],
    [taskId('se3'), projectIds.securityEnh, epicIds.secOpsAutomation, 'Playbook Development', 'in-progress', '2025-08-01', '2026-01-31', 240, 40, 'workEnvironment', 'Jan 2026', 'Playbooks'],
    [taskId('se4'), projectIds.securityEnh, epicIds.secOpsAutomation, 'SOC Integration', 'planned', '2026-02-01', '2026-03-31', 120, 0, 'humanEvent', 'Mar 2026', 'SOC Go-Live'],

    // Cloud Migration
    [taskId('cm1'), projectIds.cloudMig, epicIds.deviceManagement, 'Cloud Readiness Assessment', 'planned', '2025-06-01', '2025-08-31', 100, 0, 'majorMilestone', 'Aug 2025', 'Assessment'],
    [taskId('cm2'), projectIds.cloudMig, epicIds.deviceManagement, 'Intune Policy Design', 'planned', '2025-09-01', '2025-11-30', 140, 0, 'minorMilestone', 'Nov 2025', 'Policy Design'],
    [taskId('cm3'), projectIds.cloudMig, epicIds.deviceManagement, 'Pilot Enrollment', 'planned', '2025-12-01', '2026-02-28', 180, 0, 'workEnvironment', 'Feb 2026', 'Pilot'],
    [taskId('cm4'), projectIds.cloudMig, epicIds.cloudInfra, 'Landing Zone Build', 'planned', '2025-06-01', '2025-10-31', 200, 0, 'companyEvent', 'Oct 2025', 'Landing Zone'],

    // Identity Zero Trust
    [taskId('iz1'), projectIds.identityZT, epicIds.ztArchitecture, 'Zero Trust Assessment', 'done', '2025-02-01', '2025-03-31', 80, 100, 'majorMilestone', 'Mar 2025', 'ZT Assessment'],
    [taskId('iz2'), projectIds.identityZT, epicIds.ztArchitecture, 'Conditional Access Policies', 'done', '2025-04-01', '2025-06-30', 120, 100, 'minorMilestone', 'Jun 2025', 'CA Policies'],
    [taskId('iz3'), projectIds.identityZT, epicIds.ztArchitecture, 'Micro-segmentation Rollout', 'in-progress', '2025-07-01', '2025-12-31', 200, 55, 'workEnvironment', 'Dec 2025', 'Segmentation'],
    [taskId('iz4'), projectIds.identityZT, epicIds.ztMfaRollout, 'MFA Pilot', 'done', '2025-04-01', '2025-06-30', 60, 100, 'humanEvent', 'Jun 2025', 'MFA Pilot'],
    [taskId('iz5'), projectIds.identityZT, epicIds.ztMfaRollout, 'MFA Enterprise Rollout', 'in-progress', '2025-07-01', '2025-12-15', 100, 70, 'companyEvent', 'Dec 2025', 'MFA Rollout'],

    // Virtual Desktop
    [taskId('vd1'), projectIds.virtualDesk, epicIds.vdiModernize, 'VDI Discovery', 'done', '2025-05-01', '2025-06-30', 60, 100, 'majorMilestone', 'Jun 2025', 'VDI Discovery'],
    [taskId('vd2'), projectIds.virtualDesk, epicIds.vdiModernize, 'AVD Architecture Design', 'done', '2025-07-01', '2025-09-30', 120, 100, 'minorMilestone', 'Sep 2025', 'AVD Design'],
    [taskId('vd3'), projectIds.virtualDesk, epicIds.vdiModernize, 'AVD Build & Pilot', 'in-progress', '2025-10-01', '2026-02-28', 240, 35, 'workEnvironment', 'Feb 2026', 'AVD Pilot'],
    [taskId('vd4'), projectIds.virtualDesk, epicIds.vdiModernize, 'Production Migration', 'planned', '2026-03-01', '2026-06-30', 200, 0, 'companyEvent', 'Jun 2026', 'Go-Live'],

    // AI Innovation
    [taskId('ai1'), projectIds.aiInnovation, epicIds.mlPipeline, 'Data Platform Assessment', 'planned', '2025-07-01', '2025-08-31', 80, 0, 'majorMilestone', 'Aug 2025', 'Data Assessment'],
    [taskId('ai2'), projectIds.aiInnovation, epicIds.mlPipeline, 'Feature Store Design', 'planned', '2025-09-01', '2025-11-30', 120, 0, 'minorMilestone', 'Nov 2025', 'Feature Store'],
    [taskId('ai3'), projectIds.aiInnovation, epicIds.mlPipeline, 'MLOps Pipeline Build', 'planned', '2025-12-01', '2026-04-30', 300, 0, 'workEnvironment', 'Apr 2026', 'MLOps Build'],
    [taskId('ai4'), projectIds.aiInnovation, epicIds.aiAssistant, 'AI Assistant Prototype', 'planned', '2025-10-01', '2026-01-31', 160, 0, 'humanEvent', 'Jan 2026', 'AI Prototype'],

    // UX Redesign
    [taskId('ux1'), projectIds.uxRedesign, epicIds.uxResearch, 'User Interview Program', 'done', '2025-04-01', '2025-06-30', 60, 100, 'majorMilestone', 'Jun 2025', 'Interviews'],
    [taskId('ux2'), projectIds.uxRedesign, epicIds.uxResearch, 'Journey Mapping Workshop', 'in-progress', '2025-07-01', '2025-09-30', 40, 50, 'humanEvent', 'Sep 2025', 'Journey Maps'],
    [taskId('ux3'), projectIds.uxRedesign, epicIds.uxDesignSystem, 'Design Token Definition', 'blocked', '2025-07-01', '2025-10-31', 80, 20, 'issueResolution', 'Oct 2025', 'Design Tokens'],
    [taskId('ux4'), projectIds.uxRedesign, epicIds.uxDesignSystem, 'Component Library Build', 'planned', '2025-11-01', '2026-03-31', 200, 0, 'workEnvironment', 'Mar 2026', 'Components'],

    // Org Transformation
    [taskId('ot1'), projectIds.orgTransform, epicIds.changeManagement, 'Stakeholder Analysis', 'planned', '2025-08-01', '2025-09-30', 40, 0, 'majorMilestone', 'Sep 2025', 'Stakeholders'],
    [taskId('ot2'), projectIds.orgTransform, epicIds.changeManagement, 'Impact Assessment', 'planned', '2025-10-01', '2025-12-31', 60, 0, 'minorMilestone', 'Dec 2025', 'Impact'],
    [taskId('ot3'), projectIds.orgTransform, epicIds.changeManagement, 'Communication Plan Execution', 'planned', '2026-01-01', '2026-03-31', 80, 0, 'workEnvironment', 'Mar 2026', 'Comms Plan'],
    [taskId('ot4'), projectIds.orgTransform, epicIds.orgTraining, 'Training Needs Analysis', 'planned', '2025-10-01', '2025-11-30', 30, 0, 'humanEvent', 'Nov 2025', 'Training Needs'],
    [taskId('ot5'), projectIds.orgTransform, epicIds.orgTraining, 'LMS Deployment', 'planned', '2025-12-01', '2026-03-31', 100, 0, 'companyEvent', 'Mar 2026', 'LMS Launch'],
  ];

  for (const t of tasks) insertTask.run(...t);
  console.log(`Seeding tasks... done (${tasks.length})`);

  // ==========================================================
  // 4. DEPENDENCIES
  // ==========================================================
  const insertDep = db.prepare(`
    INSERT INTO dependencies (id, source_type, source_id, target_type, target_id, dependency_type, lag_days, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const dependencies = [
    // Platform Mod: Discovery -> Design -> Implementation -> Testing
    [randomUUID(), 'task', taskId('pm1'), 'task', taskId('pm2'), 'FS', 0, 'Design depends on discovery completion'],
    [randomUUID(), 'task', taskId('pm2'), 'task', taskId('pm3'), 'FS', 0, 'Implementation depends on architecture'],
    [randomUUID(), 'task', taskId('pm3'), 'task', taskId('pm4'), 'FS', 0, 'Testing depends on implementation'],

    // Security: Threat Analysis -> SOAR -> Playbooks -> SOC
    [randomUUID(), 'task', taskId('se1'), 'task', taskId('se2'), 'FS', 0, 'SOAR selection informed by threat analysis'],
    [randomUUID(), 'task', taskId('se2'), 'task', taskId('se3'), 'FS', 0, 'Playbooks built on SOAR platform'],
    [randomUUID(), 'task', taskId('se3'), 'task', taskId('se4'), 'FS', 0, 'SOC integration after playbooks ready'],

    // Cloud: Assessment -> Policy -> Pilot
    [randomUUID(), 'task', taskId('cm1'), 'task', taskId('cm2'), 'FS', 0, 'Policy design after assessment'],
    [randomUUID(), 'task', taskId('cm2'), 'task', taskId('cm3'), 'FS', 0, 'Pilot after policies defined'],

    // Identity: ZT Assessment -> CA Policies -> Segmentation
    [randomUUID(), 'task', taskId('iz1'), 'task', taskId('iz2'), 'FS', 0, 'CA policies after ZT assessment'],
    [randomUUID(), 'task', taskId('iz2'), 'task', taskId('iz3'), 'FS', 0, 'Segmentation after conditional access'],
    // MFA: Pilot -> Rollout
    [randomUUID(), 'task', taskId('iz4'), 'task', taskId('iz5'), 'FS', 0, 'Enterprise rollout after successful pilot'],

    // Virtual Desktop: Discovery -> Design -> Pilot -> Production
    [randomUUID(), 'task', taskId('vd1'), 'task', taskId('vd2'), 'FS', 0, 'Design after discovery'],
    [randomUUID(), 'task', taskId('vd2'), 'task', taskId('vd3'), 'FS', 0, 'Pilot after design'],
    [randomUUID(), 'task', taskId('vd3'), 'task', taskId('vd4'), 'FS', 0, 'Production after pilot'],

    // AI: Assessment -> Feature Store -> MLOps
    [randomUUID(), 'task', taskId('ai1'), 'task', taskId('ai2'), 'FS', 0, 'Feature store design after data assessment'],
    [randomUUID(), 'task', taskId('ai2'), 'task', taskId('ai3'), 'FS', 0, 'MLOps build after feature store'],

    // Cross-project: Identity ZT Segmentation blocks Cloud Migration Pilot
    [randomUUID(), 'task', taskId('iz3'), 'task', taskId('cm3'), 'FS', 5, 'Cloud pilot requires ZT segmentation'],

    // UX: Interviews -> Journey Maps; Tokens -> Components
    [randomUUID(), 'task', taskId('ux1'), 'task', taskId('ux2'), 'FS', 0, 'Journey mapping after interviews'],
    [randomUUID(), 'task', taskId('ux3'), 'task', taskId('ux4'), 'FS', 0, 'Component library after tokens defined'],

    // Org: Stakeholders -> Impact -> Comms
    [randomUUID(), 'task', taskId('ot1'), 'task', taskId('ot2'), 'FS', 0, 'Impact assessment after stakeholder analysis'],
    [randomUUID(), 'task', taskId('ot2'), 'task', taskId('ot3'), 'FS', 0, 'Comms plan after impact assessed'],
    [randomUUID(), 'task', taskId('ot4'), 'task', taskId('ot5'), 'FS', 0, 'LMS deploy after training needs known'],
  ];

  for (const d of dependencies) insertDep.run(...d);
  console.log(`Seeding dependencies... done (${dependencies.length})`);

  // ==========================================================
  // 5. FINANCIAL RESOURCES
  // ==========================================================
  const insertResource = db.prepare(`
    INSERT INTO financial_resources (id, name, email, work_area, activity_type_cap, activity_type_opx, contract_type, employee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const resources = [
    [resourceId('sarah'), 'Sarah Johnson', 'sarah.johnson@company.co.nz', 'BTE Tribe', 'N3_CAP', 'N3_OPX', 'FTE', 'EMP001'],
    [resourceId('mike'), 'Mike Chen', 'mike.chen@company.co.nz', 'BTE Tribe', 'N4_CAP', 'N4_OPX', 'FTE', 'EMP002'],
    [resourceId('emma'), 'Emma Wilson', 'emma.wilson@company.co.nz', 'BTE Tribe', 'N2_CAP', 'N2_OPX', 'FTE', 'EMP003'],
    [resourceId('david'), 'David Brown', 'david.brown@company.co.nz', 'EUC', 'N3_CAP', 'N3_OPX', 'FTE', 'EMP004'],
    [resourceId('lisa'), 'Lisa Martinez', 'lisa.martinez@company.co.nz', 'EUC', 'N5_CAP', 'N5_OPX', 'SOW', 'EMP005'],
    [resourceId('alex'), 'Alex Taylor', 'alex.taylor@company.co.nz', 'Security', 'N4_CAP', 'N4_OPX', 'FTE', 'EMP006'],
    [resourceId('chris'), 'Chris Lee', 'chris.lee@company.co.nz', 'Identity', 'N3_CAP', 'N3_OPX', 'FTE', 'EMP007'],
    [resourceId('jordan'), 'Jordan Park', 'jordan.park@external.com', 'AI Innovation', 'N4_CAP', 'N4_OPX', 'External Squad', 'EMP008'],
    [resourceId('sam'), 'Sam Rivera', 'sam.rivera@vendor.co.nz', 'Virtual Desktop', 'N3_CAP', 'N3_OPX', 'SOW', 'EMP009'],
    [resourceId('morgan'), 'Morgan Kelly', 'morgan.kelly@company.co.nz', 'Org & People', 'N2_CAP', 'N2_OPX', 'FTE', 'EMP010'],
  ];

  for (const r of resources) insertResource.run(...r);
  console.log(`Seeding financial resources... done (${resources.length})`);

  // ==========================================================
  // 6. RAW TIMESHEETS
  // ==========================================================
  const insertTimesheet = db.prepare(`
    INSERT INTO raw_timesheets (stream, month, name, personnel_number, date, activity_type, wbse, hours)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const timesheets = [
    ['BTE Tribe', 'Jan-2025', 'Sarah Johnson', 'EMP001', '06-01-2025', 'N3_CAP', 'IT\\BTE Tribe\\Integration', 7.5],
    ['BTE Tribe', 'Jan-2025', 'Sarah Johnson', 'EMP001', '07-01-2025', 'N3_CAP', 'IT\\BTE Tribe\\Integration', 8.0],
    ['BTE Tribe', 'Jan-2025', 'Mike Chen', 'EMP002', '06-01-2025', 'N4_OPX', 'IT\\BTE Tribe\\Platform', 8.0],
    ['BTE Tribe', 'Jan-2025', 'Mike Chen', 'EMP002', '07-01-2025', 'N4_OPX', 'IT\\BTE Tribe\\Platform', 7.5],
    ['BTE Tribe', 'Jan-2025', 'Emma Wilson', 'EMP003', '06-01-2025', 'N2_CAP', 'IT\\BTE Tribe\\Security', 6.0],
    ['BTE Tribe', 'Jan-2025', 'Emma Wilson', 'EMP003', '07-01-2025', 'N2_CAP', 'IT\\BTE Tribe\\Security', 8.0],
    ['BTE Tribe', 'Feb-2025', 'Sarah Johnson', 'EMP001', '03-02-2025', 'N3_CAP', 'IT\\BTE Tribe\\Integration', 8.0],
    ['BTE Tribe', 'Feb-2025', 'Sarah Johnson', 'EMP001', '04-02-2025', 'N3_CAP', 'IT\\BTE Tribe\\Integration', 7.0],
    ['BTE Tribe', 'Feb-2025', 'Mike Chen', 'EMP002', '03-02-2025', 'N4_OPX', 'IT\\BTE Tribe\\Platform', 8.0],
    ['BTE Tribe', 'Feb-2025', 'Mike Chen', 'EMP002', '04-02-2025', 'N4_OPX', 'IT\\BTE Tribe\\Platform', 8.0],
    ['EUC', 'Jan-2025', 'David Brown', 'EMP004', '06-01-2025', 'N3_CAP', 'IT\\EUC\\Device Mgmt', 7.5],
    ['EUC', 'Jan-2025', 'David Brown', 'EMP004', '07-01-2025', 'N3_CAP', 'IT\\EUC\\Device Mgmt', 8.0],
    ['EUC', 'Jan-2025', 'Lisa Martinez', 'EMP005', '06-01-2025', 'N5_OPX', 'IT\\EUC\\Support', 4.0],
    ['EUC', 'Jan-2025', 'Lisa Martinez', 'EMP005', '07-01-2025', 'N5_OPX', 'IT\\EUC\\Support', 6.0],
    ['Security', 'Jan-2025', 'Alex Taylor', 'EMP006', '06-01-2025', 'N4_CAP', 'IT\\Security\\SecOps', 8.0],
    ['Security', 'Jan-2025', 'Alex Taylor', 'EMP006', '07-01-2025', 'N4_CAP', 'IT\\Security\\SecOps', 8.0],
    ['Security', 'Feb-2025', 'Alex Taylor', 'EMP006', '03-02-2025', 'N4_CAP', 'IT\\Security\\SecOps', 7.5],
    ['Security', 'Feb-2025', 'Alex Taylor', 'EMP006', '04-02-2025', 'N4_CAP', 'IT\\Security\\SecOps', 8.0],
    ['Identity', 'Jan-2025', 'Chris Lee', 'EMP007', '06-01-2025', 'N3_OPX', 'IT\\Identity\\Zero Trust', 8.0],
    ['Identity', 'Jan-2025', 'Chris Lee', 'EMP007', '07-01-2025', 'N3_OPX', 'IT\\Identity\\Zero Trust', 7.0],
  ];

  for (const t of timesheets) insertTimesheet.run(...t);
  console.log(`Seeding raw timesheets... done (${timesheets.length})`);

  // ==========================================================
  // 7. RAW ACTUALS
  // ==========================================================
  const insertActual = db.prepare(`
    INSERT INTO raw_actuals (month, posting_date, cost_element, wbs_element, value_nzd, personnel_number, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const actuals = [
    ['Jan-2025', '06-01-2025', '1100', 'IT\\BTE Tribe\\Integration', 12500.00, 'EMP001', 'labour'],
    ['Jan-2025', '06-01-2025', '1100', 'IT\\BTE Tribe\\Platform', 14200.00, 'EMP002', 'labour'],
    ['Jan-2025', '08-01-2025', '1100', 'IT\\BTE Tribe\\Security', 9800.00, 'EMP003', 'labour'],
    ['Jan-2025', '10-01-2025', '1150', 'IT\\BTE Tribe\\Platform', 3200.00, '0', 'labour'],
    ['Jan-2025', '15-01-2025', '1100', 'IT\\EUC\\Device Mgmt', 11500.00, 'EMP004', 'labour'],
    ['Jan-2025', '15-01-2025', '1100', 'IT\\EUC\\Support', 4500.00, 'EMP005', 'labour'],
    ['Jan-2025', '20-01-2025', '1160', 'IT\\EUC\\Device Mgmt', 45000.00, '0', 'labour'],
    ['Feb-2025', '03-02-2025', '1100', 'IT\\BTE Tribe\\Integration', 13200.00, 'EMP001', 'labour'],
    ['Feb-2025', '03-02-2025', '1100', 'IT\\BTE Tribe\\Platform', 14800.00, 'EMP002', 'labour'],
    ['Feb-2025', '05-02-2025', '1100', 'IT\\Security\\SecOps', 15600.00, 'EMP006', 'labour'],
    ['Feb-2025', '10-02-2025', '1150', 'IT\\Security\\SecOps', 8500.00, '0', 'labour'],
    ['Feb-2025', '12-02-2025', '1100', 'IT\\Identity\\Zero Trust', 12000.00, 'EMP007', 'labour'],
    ['Mar-2025', '03-03-2025', '1100', 'IT\\BTE Tribe\\Integration', 12800.00, 'EMP001', 'labour'],
    ['Mar-2025', '05-03-2025', '1160', 'IT\\EUC\\Device Mgmt', 22000.00, '0', 'labour'],
    ['Mar-2025', '10-03-2025', '1100', 'IT\\Security\\SecOps', 15200.00, 'EMP006', 'labour'],
  ];

  for (const a of actuals) insertActual.run(...a);
  console.log(`Seeding raw actuals... done (${actuals.length})`);

  // ==========================================================
  // 8. RAW LABOUR RATES
  // ==========================================================
  const insertLabourRate = db.prepare(`
    INSERT INTO raw_labour_rates (band, activity_type, fiscal_year, hourly_rate, daily_rate, uplift_amount, uplift_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const labourRates = [
    ['N1', 'N1_CAP', 'FY2025', 85.00, 680.00, 0.00, 0],
    ['N1', 'N1_OPX', 'FY2025', 85.00, 680.00, 0.00, 0],
    ['N2', 'N2_CAP', 'FY2025', 105.00, 840.00, 0.00, 0],
    ['N2', 'N2_OPX', 'FY2025', 105.00, 840.00, 0.00, 0],
    ['N3', 'N3_CAP', 'FY2025', 130.00, 1040.00, 0.00, 0],
    ['N3', 'N3_OPX', 'FY2025', 130.00, 1040.00, 0.00, 0],
    ['N4', 'N4_CAP', 'FY2025', 160.00, 1280.00, 0.00, 0],
    ['N4', 'N4_OPX', 'FY2025', 160.00, 1280.00, 0.00, 0],
    ['N5', 'N5_CAP', 'FY2025', 195.00, 1560.00, 0.00, 0],
    ['N5', 'N5_OPX', 'FY2025', 195.00, 1560.00, 0.00, 0],
    ['N6', 'N6_CAP', 'FY2025', 240.00, 1920.00, 0.00, 0],
    ['N6', 'N6_OPX', 'FY2025', 240.00, 1920.00, 0.00, 0],
    ['External', 'EXT_CAP', 'FY2025', 220.00, 1760.00, 25.00, 11.36],
    ['External', 'EXT_OPX', 'FY2025', 220.00, 1760.00, 25.00, 11.36],
  ];

  for (const l of labourRates) insertLabourRate.run(...l);
  console.log(`Seeding labour rates... done (${labourRates.length})`);

  // ==========================================================
  // 9. ADMIN USER
  // ==========================================================
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, name, role, password_hash, assigned_project_ids, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const adminId = randomUUID();
  const allProjectIds = JSON.stringify(Object.values(projectIds));

  insertUser.run(adminId, 'admin@kogvantage.local', 'Admin', 'admin', adminPasswordHash, allProjectIds, 1);
  console.log('Seeding admin user... done (1)');

  // ==========================================================
  // 10. APP SETTINGS
  // ==========================================================
  const upsertSetting = db.prepare(`
    INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)
  `);

  upsertSetting.run('onboarding_complete', 'true');
  upsertSetting.run('org_name', 'KogNet');
  upsertSetting.run('theme', 'dark');
  console.log('Seeding app settings... done (3)');

  // ==========================================================
  // 11. CALENDAR (FY2025 + FY2026)
  // ==========================================================
  const insertCalYear = db.prepare(`
    INSERT OR IGNORE INTO calendar_years (year, total_working_days, total_weekend_days, total_holidays, work_hours_per_day)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertCalYear.run(2025, 250, 104, 11, 8.0);
  insertCalYear.run(2026, 251, 104, 10, 8.0);

  const insertCalMonth = db.prepare(`
    INSERT OR IGNORE INTO calendar_months (id, year, month, working_days, weekend_days, public_holidays, work_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const monthData2025 = [
    [23, 8, 0], [20, 8, 0], [21, 10, 0], [21, 8, 2], [22, 9, 0], [21, 8, 1],
    [23, 8, 0], [21, 10, 0], [22, 8, 0], [22, 8, 1], [20, 10, 0], [22, 8, 1],
  ];
  const monthData2026 = [
    [22, 9, 0], [20, 8, 0], [22, 8, 0], [21, 8, 2], [21, 10, 0], [22, 8, 1],
    [23, 8, 0], [21, 10, 0], [22, 8, 0], [22, 9, 0], [21, 9, 0], [22, 8, 1],
  ];

  for (let m = 1; m <= 12; m++) {
    const [wd, wed, ph] = monthData2025[m - 1];
    insertCalMonth.run(`2025-${String(m).padStart(2, '0')}`, 2025, m, wd, wed, ph, wd * 8);
  }
  for (let m = 1; m <= 12; m++) {
    const [wd, wed, ph] = monthData2026[m - 1];
    insertCalMonth.run(`2026-${String(m).padStart(2, '0')}`, 2026, m, wd, wed, ph, wd * 8);
  }

  const insertHoliday = db.prepare(`
    INSERT OR IGNORE INTO public_holidays (id, name, date, is_recurring, recurrence_type)
    VALUES (?, ?, ?, ?, ?)
  `);

  const holidays = [
    ['New Year Day', '01-01-2025', 1, 'yearly'],
    ['Day After New Year', '02-01-2025', 1, 'yearly'],
    ['Waitangi Day', '06-02-2025', 1, 'yearly'],
    ['Good Friday', '18-04-2025', 0, null],
    ['Easter Monday', '21-04-2025', 0, null],
    ['ANZAC Day', '25-04-2025', 1, 'yearly'],
    ['King Birthday', '02-06-2025', 0, null],
    ['Matariki', '20-06-2025', 0, null],
    ['Labour Day', '27-10-2025', 0, null],
    ['Christmas Day', '25-12-2025', 1, 'yearly'],
    ['Boxing Day', '26-12-2025', 1, 'yearly'],
  ];

  for (const h of holidays) {
    insertHoliday.run(randomUUID(), ...h);
  }
  console.log(`Seeding calendar... done (2 years, 24 months, ${holidays.length} holidays)`);

  // ==========================================================
  // 12. PROJECT FINANCIAL DETAIL
  // ==========================================================
  const insertPFD = db.prepare(`
    INSERT INTO project_financial_detail (id, project_id, sentinel_number, delivery_goal, wbse, original_budget, forecast_budget, actual_cost, variance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const pfDetails = [
    [randomUUID(), projectIds.platformMod, 'SNT-2025-001', 'Modernize core platform by Q2 2026', 'IT\\BTE Tribe\\Integration', 2500000, 2450000, 820000, -50000],
    [randomUUID(), projectIds.securityEnh, 'SNT-2025-002', 'Achieve SOC2 compliance by Q1 2026', 'IT\\Security\\SecOps', 1800000, 1850000, 540000, 50000],
    [randomUUID(), projectIds.cloudMig, 'SNT-2025-003', 'Cloud-first by end of 2026', 'IT\\EUC\\Device Mgmt', 3200000, 3200000, 0, 0],
    [randomUUID(), projectIds.identityZT, 'SNT-2025-004', 'Zero trust architecture live Q1 2026', 'IT\\Identity\\Zero Trust', 1200000, 1180000, 480000, -20000],
    [randomUUID(), projectIds.virtualDesk, 'SNT-2025-005', 'AVD migration complete Q2 2026', 'IT\\VDI\\Modernize', 950000, 970000, 310000, 20000],
    [randomUUID(), projectIds.aiInnovation, 'SNT-2025-006', 'ML pipeline operational by Q3 2026', 'IT\\AI\\Pipeline', 2100000, 2100000, 0, 0],
    [randomUUID(), projectIds.uxRedesign, 'SNT-2025-007', 'Design system shipped Q1 2026', 'IT\\BTE Tribe\\UX', 750000, 780000, 195000, 30000],
    [randomUUID(), projectIds.orgTransform, 'SNT-2025-008', 'Change program active by Q3 2025', 'IT\\Org\\Change', 500000, 500000, 0, 0],
  ];

  for (const p of pfDetails) insertPFD.run(...p);
  console.log(`Seeding project financial details... done (${pfDetails.length})`);

  // ==========================================================
  // 13. VARIANCE THRESHOLDS (global defaults)
  // ==========================================================
  const insertThreshold = db.prepare(`
    INSERT INTO variance_thresholds (id, entity_type, entity_id, hours_variance_percent, cost_variance_percent, schedule_variance_days)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertThreshold.run(randomUUID(), 'global', null, 10, 10, 5);
  console.log('Seeding variance thresholds... done (1)');
});

// ============================================================
// Execute
// ============================================================
try {
  seedAll();

  // Print summary
  const counts = {
    projects: (db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number }).c,
    epics: (db.prepare('SELECT COUNT(*) as c FROM epics').get() as { c: number }).c,
    tasks: (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }).c,
    dependencies: (db.prepare('SELECT COUNT(*) as c FROM dependencies').get() as { c: number }).c,
    resources: (db.prepare('SELECT COUNT(*) as c FROM financial_resources').get() as { c: number }).c,
    timesheets: (db.prepare('SELECT COUNT(*) as c FROM raw_timesheets').get() as { c: number }).c,
    actuals: (db.prepare('SELECT COUNT(*) as c FROM raw_actuals').get() as { c: number }).c,
    labourRates: (db.prepare('SELECT COUNT(*) as c FROM raw_labour_rates').get() as { c: number }).c,
    users: (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c,
    holidays: (db.prepare('SELECT COUNT(*) as c FROM public_holidays').get() as { c: number }).c,
    financialDetails: (db.prepare('SELECT COUNT(*) as c FROM project_financial_detail').get() as { c: number }).c,
  };

  console.log('\n========================================');
  console.log('  Seed complete! Summary:');
  console.log('========================================');
  console.log(`  Projects:            ${counts.projects}`);
  console.log(`  Epics:               ${counts.epics}`);
  console.log(`  Tasks:               ${counts.tasks}`);
  console.log(`  Dependencies:        ${counts.dependencies}`);
  console.log(`  Financial Resources: ${counts.resources}`);
  console.log(`  Raw Timesheets:      ${counts.timesheets}`);
  console.log(`  Raw Actuals:         ${counts.actuals}`);
  console.log(`  Labour Rates:        ${counts.labourRates}`);
  console.log(`  Users:               ${counts.users}`);
  console.log(`  Public Holidays:     ${counts.holidays}`);
  console.log(`  Financial Details:   ${counts.financialDetails}`);
  console.log('========================================');
  console.log('  Admin login: admin@kogvantage.local / admin123');
  console.log('========================================\n');
} catch (err) {
  console.error('Seed failed:', err);
  process.exit(1);
} finally {
  closeDb();
}
