'use client';

import type { SubwayRoute, StationType } from '@/constants/subway';

/**
 * Default station types matching the Subway-Roadmap originals.
 */
export const DEFAULT_STATION_TYPES: StationType[] = [
  { id: 'majorMilestone', label: 'Major Milestone', shape: 'Circle' },
  { id: 'minorMilestone', label: 'Minor Milestone', shape: 'SmallCircle' },
  { id: 'issueResolution', label: 'Resolution', shape: 'Diamond' },
  { id: 'workEnvironment', label: 'Environment', shape: 'Square' },
  { id: 'humanEvent', label: 'Team', shape: 'Person' },
  { id: 'companyEvent', label: 'Company', shape: 'Star' },
];

/**
 * Generates mock subway data matching the original 7 IT infrastructure routes.
 * In production, this will be replaced by tRPC queries to SQLite via the subwayAdapter.
 */
export function generateMockSubwayData(): SubwayRoute[] {
  return [
    {
      id: 'os-lifecycle',
      categoryLabel: 'OS Lifecycle',
      color: '#3b82f6',
      lanes: [
        {
          id: 'win11',
          type: 'trunk',
          mergeDate: null,
          label: 'Windows 11 Roadmap',
          stops: [
            {
              id: 'win11-25h2',
              startDate: '2025-06-01',
              endDate: '2025-09-30',
              type: 'majorMilestone',
              labelTop: '25H2 GA',
              labelBottom: 'Feature Update',
              description: 'Windows 11 25H2 General Availability rollout',
              status: 'inProgress',
            },
            {
              id: 'win12-preview',
              startDate: '2026-01-15',
              endDate: null,
              type: 'minorMilestone',
              labelTop: 'Win 12 Preview',
              labelBottom: 'Insider Channel',
              description: 'Windows 12 Preview build for testing',
              status: 'notStarted',
            },
          ],
        },
        {
          id: 'macos',
          type: 'sublane',
          mergeDate: '2026-06-01',
          label: 'macOS Program',
          stops: [
            {
              id: 'macos-support',
              startDate: '2025-04-01',
              endDate: '2025-12-31',
              type: 'workEnvironment',
              labelTop: 'macOS Support',
              labelBottom: 'Fleet Expansion',
              description: 'Expand macOS fleet support program',
              status: 'inProgress',
            },
          ],
        },
      ],
    },
    {
      id: 'euc',
      categoryLabel: 'End User Computing',
      color: '#8b5cf6',
      lanes: [
        {
          id: 'device-mgmt',
          type: 'trunk',
          mergeDate: null,
          label: 'Device Management',
          stops: [
            {
              id: 'autopilot2',
              startDate: '2025-07-01',
              endDate: null,
              type: 'majorMilestone',
              labelTop: 'Autopilot 2.0',
              labelBottom: 'Deployment',
              description: 'Windows Autopilot v2 rollout for new device provisioning',
              status: 'notStarted',
            },
            {
              id: 'laptop-refresh',
              startDate: '2025-10-01',
              endDate: '2026-03-31',
              type: 'workEnvironment',
              labelTop: 'Laptop Refresh',
              labelBottom: 'FY26 Cycle',
              description: 'Annual laptop refresh for 500+ devices',
              status: 'notStarted',
            },
          ],
        },
      ],
    },
    {
      id: 'identity',
      categoryLabel: 'Identity & Access',
      color: '#06b6d4',
      lanes: [
        {
          id: 'zero-trust',
          type: 'trunk',
          mergeDate: null,
          label: 'Zero Trust Access',
          stops: [
            {
              id: 'passwordless',
              startDate: '2025-08-01',
              endDate: null,
              type: 'majorMilestone',
              labelTop: 'Passwordless',
              labelBottom: 'Default Policy',
              description: 'Enable passwordless authentication as default for all users',
              status: 'notStarted',
            },
          ],
        },
        {
          id: 'governance',
          type: 'sublane',
          mergeDate: '2025-11-30',
          label: 'Governance',
          stops: [
            {
              id: 'access-review',
              startDate: '2025-09-01',
              endDate: '2025-11-15',
              type: 'humanEvent',
              labelTop: 'Q4 Access Review',
              labelBottom: 'All Systems',
              description: 'Quarterly access review covering all production systems',
              status: 'notStarted',
            },
          ],
        },
      ],
    },
    {
      id: 'virtual-desktop',
      categoryLabel: 'Virtual Desktop',
      color: '#ec4899',
      lanes: [
        {
          id: 'cloud-pc',
          type: 'trunk',
          mergeDate: null,
          label: 'Cloud PC',
          stops: [
            {
              id: 'offline-mode',
              startDate: '2025-05-15',
              endDate: null,
              type: 'majorMilestone',
              labelTop: 'Offline Mode',
              labelBottom: 'W365',
              description: 'Windows 365 offline mode for field workers',
              status: 'inProgress',
            },
            {
              id: 'gpu-sku',
              startDate: '2025-11-01',
              endDate: '2026-02-28',
              type: 'workEnvironment',
              labelTop: 'GPU SKU Rollout',
              labelBottom: 'Engineering',
              description: 'GPU-enabled Cloud PC SKUs for engineering teams',
              status: 'notStarted',
            },
          ],
        },
      ],
    },
    {
      id: 'security',
      categoryLabel: 'Security',
      color: '#ef4444',
      lanes: [
        {
          id: 'secops',
          type: 'trunk',
          mergeDate: null,
          label: 'SecOps',
          stops: [
            {
              id: 'copilot-live',
              startDate: '2025-06-15',
              endDate: null,
              type: 'majorMilestone',
              labelTop: 'Copilot Live',
              labelBottom: 'Security Operations',
              description: 'Microsoft Security Copilot go-live for SOC team',
              status: 'inProgress',
            },
            {
              id: 'dlp-review',
              startDate: '2025-09-01',
              endDate: '2025-10-31',
              type: 'issueResolution',
              labelTop: 'DLP Policy Review',
              labelBottom: 'Annual Audit',
              description: 'Annual DLP policy review and update cycle',
              status: 'notStarted',
            },
          ],
        },
      ],
    },
    {
      id: 'ai-innovation',
      categoryLabel: 'AI Innovation',
      color: '#10b981',
      lanes: [
        {
          id: 'agentic-ai',
          type: 'trunk',
          mergeDate: null,
          label: 'Agentic AI',
          stops: [
            {
              id: 'hr-agent',
              startDate: '2025-07-01',
              endDate: '2025-12-31',
              type: 'companyEvent',
              labelTop: 'HR Agent Pilot',
              labelBottom: 'Copilot Studio',
              description: 'Pilot AI agent for HR self-service via Copilot Studio',
              status: 'notStarted',
            },
            {
              id: 'finance-recon',
              startDate: '2026-01-15',
              endDate: '2026-06-30',
              type: 'majorMilestone',
              labelTop: 'Finance Recon',
              labelBottom: 'Automation',
              description: 'Automated financial reconciliation using AI agents',
              status: 'notStarted',
            },
          ],
        },
        {
          id: 'ai-infra',
          type: 'sublane',
          mergeDate: '2026-05-01',
          label: 'Infrastructure',
          stops: [
            {
              id: 'onprem-llm',
              startDate: '2025-09-01',
              endDate: '2026-03-31',
              type: 'workEnvironment',
              labelTop: 'On-Prem LLM POC',
              labelBottom: 'Data Sovereign',
              description: 'Proof of concept for on-premise LLM hosting',
              status: 'notStarted',
            },
          ],
        },
      ],
    },
    {
      id: 'org-people',
      categoryLabel: 'Org & People',
      color: '#64748b',
      lanes: [
        {
          id: 'key-dates',
          type: 'trunk',
          mergeDate: null,
          label: 'Key Dates',
          stops: [
            {
              id: 'holiday-freeze',
              startDate: '2025-12-20',
              endDate: '2026-01-05',
              type: 'companyEvent',
              labelTop: 'Holiday Freeze',
              labelBottom: 'Change Moratorium',
              description: 'No production deployments during holiday period',
              status: 'notStarted',
            },
            {
              id: 'fy26-kickoff',
              startDate: '2025-07-01',
              endDate: null,
              type: 'companyEvent',
              labelTop: 'FY26 Kickoff',
              labelBottom: 'All Hands',
              description: 'Fiscal year 2026 kickoff event and strategic planning',
              status: 'notStarted',
            },
          ],
        },
      ],
    },
  ];
}
