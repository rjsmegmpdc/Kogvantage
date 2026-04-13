'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Train,
  DollarSign,
  Users,
  Shield,
  FileText,
  Settings,
  Bot,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { GanttView } from '@/components/Gantt/GanttView';
import SubwayView from '@/components/Subway/SubwayView';
import { generateMockGanttData } from '@/lib/adapters/ganttAdapter';
import { generateMockSubwayData, DEFAULT_STATION_TYPES } from '@/lib/adapters/subwayAdapter';
import type { ZoomLevel } from '@/constants/gantt';
import AssistantPanel from '@/components/AI/AssistantPanel';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { usePortfolioMutations } from '@/hooks/usePortfolioMutations';
import CoordinatorDashboard from '@/components/Financial/CoordinatorDashboard';
import DataImport from '@/components/Financial/DataImport';
import VarianceAlerts from '@/components/Financial/VarianceAlerts';
import ReportingView from '@/components/Modules/ReportingView';
import OnboardingWizard from '@/components/Onboarding/OnboardingWizard';
import SettingsView from '@/components/Modules/SettingsView';
import DataPackUploader from '@/components/Ingestion/DataPackUploader';
import StakeholderDashboard from '@/components/Dashboard/StakeholderDashboard';
import LivePresentation from '@/components/Presentation/LivePresentation';
import type { PresentationSlide } from '@/components/Presentation/LivePresentation';
import ComparisonView from '@/components/Dashboard/ComparisonView';
import type { ComparisonResult } from '@/components/Dashboard/ComparisonView';

type ViewMode =
  | 'GANTT'
  | 'SUBWAY'
  | 'COORDINATOR'
  | 'RESOURCES'
  | 'GOVERNANCE'
  | 'REPORTING'
  | 'SETTINGS';

const NAV_ITEMS: {
  id: ViewMode;
  label: string;
  icon: React.ReactNode;
  category: string;
}[] = [
  { id: 'GANTT', label: 'Gantt Roadmap', icon: <BarChart3 size={20} />, category: 'Roadmap' },
  { id: 'SUBWAY', label: 'Subway Map', icon: <Train size={20} />, category: 'Roadmap' },
  { id: 'COORDINATOR', label: 'Financials', icon: <DollarSign size={20} />, category: 'Finance' },
  { id: 'RESOURCES', label: 'Resources', icon: <Users size={20} />, category: 'Finance' },
  { id: 'GOVERNANCE', label: 'Governance', icon: <Shield size={20} />, category: 'Governance' },
  { id: 'REPORTING', label: 'Reports', icon: <FileText size={20} />, category: 'Governance' },
  { id: 'SETTINGS', label: 'Settings', icon: <Settings size={20} />, category: 'System' },
];

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<ViewMode>('GANTT');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('Month');

  // Real data from tRPC (falls back to mock if DB is empty)
  const portfolio = usePortfolioData();
  const mutations = usePortfolioMutations();
  const mockGantt = useMemo(() => generateMockGanttData(), []);
  const mockSubway = useMemo(() => generateMockSubwayData(), []);
  const ganttProjects = portfolio.ganttProjects.length > 0 ? portfolio.ganttProjects : mockGantt;
  const subwayRoutes = portfolio.subwayRoutes.length > 0 ? portfolio.subwayRoutes : mockSubway;
  const [stationTypes, setStationTypes] = useState(DEFAULT_STATION_TYPES);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [presentationSlides, setPresentationSlides] = useState<PresentationSlide[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [settings, setSettings] = useState<Record<string, string>>({
    theme: 'dark',
    org_name: 'My Organization',
    currency: 'NZD',
    fiscal_year_start: '7',
    date_format: 'DD-MM-YYYY',
    auto_save: 'true',
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r transition-all duration-300"
        style={{
          width: sidebarCollapsed ? '64px' : '240px',
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-white text-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            K
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                Kogvantage
              </h1>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                Portfolio Intelligence
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {['Roadmap', 'Finance', 'Governance', 'System'].map((category) => (
            <div key={category} className="mb-2">
              {!sidebarCollapsed && (
                <p
                  className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {category}
                </p>
              )}
              {NAV_ITEMS.filter((item) => item.category === category).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
                  style={{
                    color:
                      currentView === item.id
                        ? 'var(--color-primary-light)'
                        : 'var(--color-text-secondary)',
                    backgroundColor:
                      currentView === item.id ? 'var(--color-primary)15' : 'transparent',
                    borderRight:
                      currentView === item.id
                        ? '2px solid var(--color-primary)'
                        : '2px solid transparent',
                  }}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Portfolio Health */}
        {!sidebarCollapsed && (
          <div
            className="px-4 py-4 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Portfolio Health
            </p>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface-raised)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: '72%',
                    backgroundColor: 'var(--color-success)',
                  }}
                />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                72%
              </span>
            </div>
            <div className="flex justify-between mt-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              <span>0 Projects</span>
              <span>0 FTEs</span>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center justify-center py-3 border-t transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ChevronRight
            size={16}
            className="transition-transform"
            style={{
              color: 'var(--color-text-muted)',
              transform: sidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {NAV_ITEMS.find((i) => i.id === currentView)?.label}
            </h2>
            {(currentView === 'GANTT' || currentView === 'SUBWAY') && (
              <div
                className="flex items-center rounded-lg p-0.5"
                style={{ backgroundColor: 'var(--color-surface-raised)' }}
              >
                <button
                  onClick={() => setCurrentView('GANTT')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor:
                      currentView === 'GANTT' ? 'var(--color-primary)' : 'transparent',
                    color: currentView === 'GANTT' ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  <BarChart3 size={14} />
                  Gantt
                </button>
                <button
                  onClick={() => setCurrentView('SUBWAY')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor:
                      currentView === 'SUBWAY' ? 'var(--color-primary)' : 'transparent',
                    color: currentView === 'SUBWAY' ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  <Train size={14} />
                  Subway
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Settings size={14} />
              Setup
            </button>
            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: aiPanelOpen ? 'var(--color-primary)15' : 'var(--color-surface-raised)',
                color: aiPanelOpen ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
              }}
            >
              <Zap size={14} style={{ color: 'var(--color-warning)' }} />
              AI Assistant
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'GANTT' && (
            <GanttView
              projects={ganttProjects}
              zoomLevel={zoomLevel}
              onZoomChange={(z) => setZoomLevel(z as ZoomLevel)}
              onTaskUpdate={async (projectId, taskId, updates) => {
                await mutations.updateTask(projectId, taskId, updates);
                portfolio.refresh();
              }}
            />
          )}

          {currentView === 'SUBWAY' && (
            <SubwayView
              routes={subwayRoutes}
              stationTypes={stationTypes}
              onStopUpdate={(routeId, laneId, stopId, updates) => {
                console.log('Stop update:', { routeId, laneId, stopId, updates });
              }}
              onStopAdd={(routeId, laneId, stop) => {
                console.log('Stop add:', { routeId, laneId, stop });
              }}
              onRouteAdd={(route) => {
                console.log('Route add:', route);
              }}
              onRouteDelete={(routeId) => {
                console.log('Route delete:', routeId);
              }}
              onTypeAdd={(type) => {
                console.log('Type add:', type);
                setStationTypes((prev) => [
                  ...prev,
                  { ...type, id: type.label.toLowerCase().replace(/\s+/g, '') } as any,
                ]);
              }}
              onTypeDelete={(typeId) => {
                console.log('Type delete:', typeId);
                setStationTypes((prev) => prev.filter((t) => t.id !== typeId));
              }}
            />
          )}

          {currentView === 'COORDINATOR' && (
            <div className="p-6 overflow-auto h-full">
              <CoordinatorDashboard
                summary={portfolio.financialSummary}
                healthStatus={portfolio.financialSummary.activeAlerts > 3 ? 'at-risk' : 'healthy'}
                recentAlerts={[
                  { id: '1', severity: 'critical', message: 'Resource over-allocated: Sarah Johnson at 140%' },
                  { id: '2', severity: 'high', message: 'Project "Platform Modernization" 15% over budget' },
                  { id: '3', severity: 'medium', message: 'Schedule variance: Cloud Migration delayed 8 days' },
                ]}
                onNavigate={(target) => {
                  if (target === 'import') setCurrentView('COORDINATOR');
                  console.log('Navigate to:', target);
                }}
              />
            </div>
          )}

          {currentView === 'RESOURCES' && (
            <div className="p-6 overflow-auto h-full">
              <DataPackUploader
                onAnalyze={async (files) => {
                  console.log('Analyzing', files.length, 'files');
                  // Mock analysis result for now — will wire to tRPC ingestion.analyze
                  return {
                    files: files.map((f) => ({
                      fileName: f.name,
                      fileType: (f.name.endsWith('.csv') ? 'csv' : 'unknown') as any,
                      detectedDataType: 'unknown' as any,
                      rowCount: 0,
                      columns: [],
                      mappedColumns: {},
                      confidence: 50,
                      issues: [],
                    })),
                    gapReport: {
                      found: ['File analysis complete'],
                      missing: ['Connect to tRPC for full analysis'],
                      warnings: [],
                    },
                    totalRecords: 0,
                    importableRecords: 0,
                  };
                }}
                onImport={async (result) => {
                  console.log('Importing', result.files.length, 'files');
                }}
              />
            </div>
          )}

          {currentView === 'REPORTING' && (
            <div className="p-6 overflow-auto h-full">
              <StakeholderDashboard
                onPresent={async () => {
                  try {
                    const res = await fetch('/api/trpc/reports.snapshot', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ '0': { json: {} } }),
                    });
                    const json = await res.json();
                    const snapshot = json?.[0]?.result?.data?.json || json?.result?.data?.json || json?.result?.data;
                    if (snapshot) {
                      // Dynamically import PresentationBuilder (server module)
                      // We inline a lightweight version for the client
                      const slides = buildPresentationClient(snapshot);
                      setPresentationSlides(slides);
                    } else {
                      setPresentationSlides(buildPresentationClient(null));
                    }
                  } catch {
                    setPresentationSlides(buildPresentationClient(null));
                  }
                  setShowPresentation(true);
                }}
                onCompare={() => setShowComparison(true)}
                onGenerateReport={async (procedure) => {
                  try {
                    const res = await fetch(`/api/trpc/${procedure}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ '0': { json: {} } }),
                    });
                    const json = await res.json();
                    const result = json?.[0]?.result?.data?.json || json?.result?.data?.json || json?.result?.data;
                    if (result?.data) {
                      const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
                      const blob = new Blob([bytes], { type: result.mimeType });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = result.filename || 'report';
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  } catch (e) {
                    console.error('Report generation error:', e);
                  }
                }}
              />
            </div>
          )}

          {currentView === 'SETTINGS' && (
            <div className="p-6 overflow-auto h-full">
              <SettingsView
                settings={settings}
                onSettingChange={(key, value) => {
                  setSettings((prev) => ({ ...prev, [key]: value }));
                }}
                onThemeChange={(t) => {
                  setTheme(t);
                  document.documentElement.className = t === 'system' ? '' : t;
                }}
              />
            </div>
          )}

          {currentView === 'GOVERNANCE' && (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Bot size={64} strokeWidth={1} style={{ color: 'var(--color-primary)' }} />
              <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                Governance
              </h3>
              <p className="text-sm text-center max-w-md">
                Governance module is coming in Phase 8. Stage gates, compliance tracking,
                and decision logging are already in the database schema.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* AI Assistant Panel */}
      <AssistantPanel isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={(config) => {
            console.log('Onboarding complete:', config);
            setSettings((prev) => ({
              ...prev,
              org_name: config.orgName,
              currency: config.currency,
              fiscal_year_start: String(config.fiscalYearStart),
              date_format: config.dateFormat,
            }));
            if (config.defaultView === 'SUBWAY') setCurrentView('SUBWAY');
            setShowOnboarding(false);
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {/* Live Presentation overlay */}
      {showPresentation && presentationSlides.length > 0 && (
        <LivePresentation
          slides={presentationSlides}
          template={{
            colorPalette: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
            fontPrimary: 'system-ui, -apple-system, sans-serif',
            fontHeading: 'system-ui, -apple-system, sans-serif',
          }}
          onClose={() => setShowPresentation(false)}
          onExport={async () => {
            try {
              const res = await fetch('/api/trpc/reports.generateExecutive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ '0': { json: {} } }),
              });
              const json = await res.json();
              const result = json?.[0]?.result?.data?.json || json?.result?.data?.json || json?.result?.data;
              if (result?.data) {
                const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
                const blob = new Blob([bytes], { type: result.mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename || 'presentation.pptx';
                a.click();
                URL.revokeObjectURL(url);
              }
            } catch (e) {
              console.error('PPTX export error:', e);
            }
          }}
        />
      )}

      {/* Comparison overlay */}
      {showComparison && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowComparison(false);
          }}
        >
          <div
            style={{
              width: '90vw',
              maxWidth: 1100,
              maxHeight: '85vh',
              overflow: 'auto',
              borderRadius: 16,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
                Snapshot Comparison
              </h3>
              <button
                onClick={() => setShowComparison(false)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-raised)',
                  color: 'var(--color-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <ComparisonView
                snapshots={[]}
                onCompare={async (oldId: string, newId: string) => {
                  try {
                    const res = await fetch('/api/trpc/reports.compareSnapshots', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ '0': { json: { oldId, newId } } }),
                    });
                    const json = await res.json();
                    return json?.[0]?.result?.data?.json || json?.result?.data?.json;
                  } catch {
                    return {
                      oldLabel: oldId,
                      newLabel: newId,
                      oldDate: '',
                      newDate: '',
                      newProjects: [],
                      removedProjects: [],
                      projectChanges: [],
                      financialDelta: { budgetChange: 0, actualsChange: 0, varianceChange: 0, burnRateChange: 0 },
                      alertsDelta: { newAlerts: 0, resolvedAlerts: 0, totalChange: 0 },
                      resourceDelta: { added: 0, removed: 0, totalChange: 0 },
                    } as ComparisonResult;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Client-side presentation builder (mirrors PresentationBuilder.ts)
// =====================================================================

function buildPresentationClient(snapshot: any): PresentationSlide[] {
  const orgName = snapshot?.orgName || 'Kogvantage';
  const now = new Date().toLocaleDateString('en-NZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const generatedAt = snapshot?.generatedAt
    ? new Date(snapshot.generatedAt).toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' })
    : now;

  const projects: any[] = snapshot?.projects || [];
  const activeAlerts: any[] = snapshot?.activeAlerts || [];
  const byStatus: Record<string, number> = snapshot?.byStatus || {};

  return [
    {
      type: 'title',
      title: orgName,
      subtitle: 'Portfolio Status Report',
      data: { date: generatedAt },
    },
    {
      type: 'kpi',
      title: 'Key Performance Indicators',
      data: {
        kpis: [
          { label: 'Projects', value: snapshot?.totalProjects ?? projects.length },
          { label: 'Avg Health', value: `${snapshot?.averageHealth ?? 0}%`, color: (snapshot?.averageHealth ?? 0) >= 70 ? '#10b981' : '#f59e0b' },
          { label: 'Total Budget', value: `$${((snapshot?.totalBudget ?? 0) / 1000).toFixed(0)}k` },
          { label: 'Burn Rate', value: `$${((snapshot?.burnRate ?? 0) / 1000).toFixed(0)}k/mo` },
          { label: 'Active Alerts', value: activeAlerts.length, color: activeAlerts.length > 5 ? '#ef4444' : activeAlerts.length > 0 ? '#f59e0b' : '#10b981' },
          { label: 'Resources', value: snapshot?.totalResources ?? 0 },
        ],
      },
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
      type: 'table',
      title: 'Active Alerts',
      data: {
        headers: ['Severity', 'Type', 'Message'],
        rows: activeAlerts.length > 0
          ? activeAlerts.map((a: any) => [(a.severity || 'info').toUpperCase(), a.type || '-', a.message || '-'])
          : [['--', '--', 'No active alerts']],
      },
    },
    {
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
    },
  ];
}
