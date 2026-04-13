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
import CoordinatorDashboard from '@/components/Financial/CoordinatorDashboard';
import DataImport from '@/components/Financial/DataImport';
import VarianceAlerts from '@/components/Financial/VarianceAlerts';
import OnboardingWizard from '@/components/Onboarding/OnboardingWizard';
import SettingsView from '@/components/Modules/SettingsView';

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

  // Mock data — will be replaced by tRPC queries
  const ganttProjects = useMemo(() => generateMockGanttData(), []);
  const subwayRoutes = useMemo(() => generateMockSubwayData(), []);
  const [stationTypes, setStationTypes] = useState(DEFAULT_STATION_TYPES);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
              onTaskUpdate={(projectId, taskId, updates) => {
                console.log('Task update:', { projectId, taskId, updates });
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
                summary={{
                  totalBudget: 8500000,
                  totalSpent: 3200000,
                  remaining: 5300000,
                  activeAlerts: 5,
                }}
                healthStatus="healthy"
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
              <DataImport
                onImport={async (type, file) => { console.log('Import:', type, file?.name); return { success: true, recordsProcessed: 0, recordsImported: 0, recordsFailed: 0, errors: [], warnings: [] }; }}
                onAIImport={async (file) => { console.log('AI Import:', file?.name); return { success: true, recordsProcessed: 0, recordsImported: 0, recordsFailed: 0, errors: [], warnings: [] }; }}
                onDownloadTemplate={(type) => console.log('Download template:', type)}
              />
            </div>
          )}

          {currentView === 'REPORTING' && (
            <div className="p-6 overflow-auto h-full">
              <VarianceAlerts
                alerts={[
                  { id: '1', alert_type: 'commitment', severity: 'critical', entity_type: 'resource', entity_id: 'r1', message: 'Sarah Johnson allocated 140% — over capacity by 32 hours this sprint', details: '{}', variance_amount: 32, variance_percent: 40, acknowledged: false, acknowledged_at: undefined, created_at: new Date(Date.now() - 3600000).toISOString() },
                  { id: '2', alert_type: 'cost', severity: 'high', entity_type: 'project', entity_id: 'p1', message: 'Platform Modernization actual costs exceed forecast by $127,000 NZD', details: '{}', variance_amount: 127000, variance_percent: 15.3, acknowledged: false, acknowledged_at: undefined, created_at: new Date(Date.now() - 7200000).toISOString() },
                  { id: '3', alert_type: 'schedule', severity: 'medium', entity_type: 'project', entity_id: 'p3', message: 'Cloud Migration behind schedule — 8 working days behind forecast', details: '{}', variance_amount: 8, variance_percent: 12, acknowledged: false, acknowledged_at: undefined, created_at: new Date(Date.now() - 86400000).toISOString() },
                  { id: '4', alert_type: 'effort', severity: 'low', entity_type: 'feature', entity_id: 'f1', message: 'API Gateway feature actual effort 5% above estimate', details: '{}', variance_amount: 12, variance_percent: 5, acknowledged: true, acknowledged_at: new Date().toISOString(), created_at: new Date(Date.now() - 172800000).toISOString() },
                ]}
                onAcknowledge={(id) => console.log('Acknowledge:', id)}
                onExplainWithAI={async (alert) => `This ${alert.alert_type} variance of ${(alert.variance_percent ?? 0).toFixed(1)}% is triggered because the actual values exceed the configured threshold. Recommended action: review the allocation and adjust the forecast.`}
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
    </div>
  );
}
