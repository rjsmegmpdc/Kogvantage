'use client';

import { useState } from 'react';
import {
  Settings,
  Shield,
  Plug,
  FileText,
  Database,
  Sun,
  Moon,
  Monitor,
  Save,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Plus,
  Search,
  Eye,
  Users,
  Lock,
  Unlock,
  Globe,
  Calendar,
  DollarSign,
  Building2,
} from 'lucide-react';
import CodewordManager from '../Security/CodewordManager';
import type { CodewordEntry } from '../Security/CodewordManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingsViewProps {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
}

type TabId = 'general' | 'security' | 'integrations' | 'templates' | 'data';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  fields: { key: string; label: string; type: 'text' | 'password' | 'select'; placeholder?: string; options?: string[] }[];
}

interface TemplateItem {
  id: string;
  name: string;
  type: 'governance' | 'financial' | 'risk' | 'status';
  lastModified: string;
  size: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={16} /> },
  { id: 'templates', label: 'Templates', icon: <FileText size={16} /> },
  { id: 'data', label: 'Data', icon: <Database size={16} /> },
];

const RBAC_ROLES = [
  { role: 'Admin', permissions: ['Full access', 'Manage users', 'System settings', 'All data', 'Codeword admin', 'Audit logs'] },
  { role: 'Portfolio Manager', permissions: ['View all projects', 'Edit portfolio', 'Financial overview', 'Reports', 'Approve gates', 'Manage templates'] },
  { role: 'Project Manager', permissions: ['Manage own projects', 'Edit tasks', 'View financials', 'Submit reports', 'Request approvals', 'Import data'] },
  { role: 'Team Lead', permissions: ['View team projects', 'Edit assigned tasks', 'View budgets', 'Submit timesheets', 'View reports', 'Limited codewords'] },
  { role: 'Member', permissions: ['View assigned tasks', 'Update status', 'Submit timesheets', 'View own data', 'Basic reports', 'No codewords'] },
  { role: 'Viewer', permissions: ['Read-only access', 'View dashboards', 'View reports', 'No editing', 'No financial data', 'No codewords'] },
];

const INTEGRATIONS: Integration[] = [
  {
    id: 'ado',
    name: 'Azure DevOps',
    description: 'Sync work items, boards, and pipelines',
    icon: <Globe size={20} />,
    status: 'disconnected',
    fields: [
      { key: 'url', label: 'Organisation URL', type: 'text', placeholder: 'https://dev.azure.com/your-org' },
      { key: 'token', label: 'Personal Access Token', type: 'password', placeholder: 'Enter PAT' },
      { key: 'schedule', label: 'Sync Schedule', type: 'select', options: ['Every 15 min', 'Every hour', 'Every 6 hours', 'Daily'] },
    ],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Import issues, epics, and sprints',
    icon: <Globe size={20} />,
    status: 'disconnected',
    fields: [
      { key: 'url', label: 'Jira Cloud URL', type: 'text', placeholder: 'https://your-domain.atlassian.net' },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'user@company.com' },
      { key: 'token', label: 'API Token', type: 'password', placeholder: 'Enter API token' },
      { key: 'schedule', label: 'Sync Schedule', type: 'select', options: ['Every 15 min', 'Every hour', 'Every 6 hours', 'Daily'] },
    ],
  },
  {
    id: 'servicenow',
    name: 'ServiceNow',
    description: 'Sync incidents, requests, and changes',
    icon: <Globe size={20} />,
    status: 'disconnected',
    fields: [
      { key: 'url', label: 'Instance URL', type: 'text', placeholder: 'https://your-instance.service-now.com' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'admin' },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Enter password' },
      { key: 'schedule', label: 'Sync Schedule', type: 'select', options: ['Every hour', 'Every 6 hours', 'Daily'] },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link repositories, issues, and pull requests',
    icon: <Globe size={20} />,
    status: 'disconnected',
    fields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...' },
      { key: 'org', label: 'Organisation', type: 'text', placeholder: 'your-org' },
      { key: 'schedule', label: 'Sync Schedule', type: 'select', options: ['Every 15 min', 'Every hour', 'Every 6 hours', 'Daily'] },
    ],
  },
  {
    id: 'sap',
    name: 'SAP',
    description: 'Import financial data and cost centres',
    icon: <DollarSign size={20} />,
    status: 'disconnected',
    fields: [
      { key: 'url', label: 'SAP Gateway URL', type: 'text', placeholder: 'https://sap-gateway.company.com' },
      { key: 'client', label: 'Client ID', type: 'text', placeholder: '100' },
      { key: 'token', label: 'OAuth Token', type: 'password', placeholder: 'Enter token' },
      { key: 'schedule', label: 'Sync Schedule', type: 'select', options: ['Every hour', 'Every 6 hours', 'Daily', 'Weekly'] },
    ],
  },
];

const SAMPLE_TEMPLATES: TemplateItem[] = [
  { id: '1', name: 'Gate Review Template', type: 'governance', lastModified: '2026-03-28', size: '24 KB' },
  { id: '2', name: 'Monthly Status Report', type: 'status', lastModified: '2026-04-01', size: '18 KB' },
  { id: '3', name: 'Risk Register Template', type: 'risk', lastModified: '2026-02-15', size: '32 KB' },
  { id: '4', name: 'Budget Forecast Template', type: 'financial', lastModified: '2026-03-10', size: '28 KB' },
];

const TEMPLATE_TYPE_COLORS: Record<string, string> = {
  governance: '#8b5cf6',
  financial: '#22c55e',
  risk: '#ef4444',
  status: '#3b82f6',
};

const DATE_FORMATS = ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];
const CURRENCIES = ['NZD', 'AUD', 'USD', 'GBP', 'EUR', 'CAD'];
const FISCAL_YEARS = ['January', 'April', 'July', 'October'];

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
  display: 'block',
};

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: 20,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      )}
    </div>
  );
}

function ThemeButton({
  theme,
  currentTheme,
  icon,
  label,
  onClick,
}: {
  theme: string;
  currentTheme: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const active = currentTheme === theme;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl transition-all"
      style={{
        backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface-raised)',
        color: active ? '#fff' : 'var(--color-text-secondary)',
        border: `2px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
        minWidth: 100,
      }}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function StatusDot({ status }: { status: 'connected' | 'disconnected' | 'error' }) {
  const colors = {
    connected: 'var(--color-success)',
    disconnected: 'var(--color-text-muted)',
    error: 'var(--color-danger)',
  };
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full"
      style={{ backgroundColor: colors[status] }}
    />
  );
}

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {title}
          </h4>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-danger)' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: General
// ---------------------------------------------------------------------------

function GeneralTab({
  settings,
  onSettingChange,
  onThemeChange,
}: {
  settings: Record<string, string>;
  onSettingChange: (key: string, value: string) => void;
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
}) {
  const currentTheme = (settings.theme as 'dark' | 'light' | 'system') || 'dark';
  const autoSave = settings.autoSave !== 'false';

  return (
    <div className="space-y-6">
      {/* Organisation */}
      <div style={sectionCardStyle}>
        <SectionHeader title="Organisation" description="Basic organisation information." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Organisation Name</label>
            <input
              type="text"
              value={settings.orgName || ''}
              onChange={(e) => onSettingChange('orgName', e.target.value)}
              placeholder="Acme Corporation"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Currency</label>
            <select
              value={settings.currency || 'NZD'}
              onChange={(e) => onSettingChange('currency', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fiscal Year Start</label>
            <select
              value={settings.fiscalYear || 'July'}
              onChange={(e) => onSettingChange('fiscalYear', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {FISCAL_YEARS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date Format</label>
            <select
              value={settings.dateFormat || 'DD-MM-YYYY'}
              onChange={(e) => onSettingChange('dateFormat', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {DATE_FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div style={sectionCardStyle}>
        <SectionHeader title="Appearance" description="Choose your preferred theme." />
        <div className="flex gap-3">
          <ThemeButton
            theme="dark"
            currentTheme={currentTheme}
            icon={<Moon size={20} />}
            label="Dark"
            onClick={() => onThemeChange('dark')}
          />
          <ThemeButton
            theme="light"
            currentTheme={currentTheme}
            icon={<Sun size={20} />}
            label="Light"
            onClick={() => onThemeChange('light')}
          />
          <ThemeButton
            theme="system"
            currentTheme={currentTheme}
            icon={<Monitor size={20} />}
            label="System"
            onClick={() => onThemeChange('system')}
          />
        </div>
      </div>

      {/* Preferences */}
      <div style={sectionCardStyle}>
        <SectionHeader title="Preferences" />
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Auto-save
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Automatically save changes as you edit.
            </p>
          </div>
          <button
            onClick={() => onSettingChange('autoSave', autoSave ? 'false' : 'true')}
            className="relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200"
            style={{
              width: 40,
              height: 22,
              backgroundColor: autoSave ? 'var(--color-primary)' : 'var(--color-surface-overlay)',
            }}
          >
            <span
              className="inline-block rounded-full bg-white shadow transition-transform duration-200"
              style={{ width: 18, height: 18, marginTop: 2, transform: `translateX(${autoSave ? 20 : 2}px)` }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Security
// ---------------------------------------------------------------------------

function SecurityTab() {
  const [codewords, setCodewords] = useState<CodewordEntry[]>([]);

  const handleAdd = (entry: Omit<CodewordEntry, 'id'>) => {
    const newEntry: CodewordEntry = { ...entry, id: `cw-${Date.now()}` };
    setCodewords((prev) => [...prev, newEntry]);
  };

  const handleUpdate = (id: string, updates: Partial<CodewordEntry>) => {
    setCodewords((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDelete = (id: string) => {
    setCodewords((prev) => prev.filter((c) => c.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setCodewords((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
  };

  return (
    <div className="space-y-6">
      {/* Codeword Manager */}
      <div style={sectionCardStyle}>
        <CodewordManager
          codewords={codewords}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          currentUserRole="admin"
        />
      </div>

      {/* RBAC Summary */}
      <div style={sectionCardStyle}>
        <SectionHeader
          title="Role-Based Access Control"
          description="Summary of permissions for each role."
        />
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          {/* RBAC Header */}
          <div
            className="grid gap-4 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              gridTemplateColumns: '160px 1fr',
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-muted)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span>Role</span>
            <span>Permissions</span>
          </div>

          {/* RBAC Rows */}
          {RBAC_ROLES.map((item, idx) => (
            <div
              key={item.role}
              className="grid gap-4 px-4 py-3 items-center"
              style={{
                gridTemplateColumns: '160px 1fr',
                backgroundColor: 'var(--color-surface)',
                borderBottom: idx < RBAC_ROLES.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: 'var(--color-primary-light)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {item.role}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 rounded text-[11px] font-medium"
                    style={{
                      backgroundColor: 'var(--color-surface-raised)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Integrations
// ---------------------------------------------------------------------------

function IntegrationsTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [integrations] = useState<Integration[]>(INTEGRATIONS);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="External Integrations"
        description="Connect Kogvantage with your existing tools and services."
      />

      {integrations.map((integration) => {
        const isExpanded = expandedId === integration.id;
        return (
          <div
            key={integration.id}
            className="rounded-xl overflow-hidden transition-all"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Card header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : integration.id)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {integration.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {integration.name}
                  </span>
                  <StatusDot status={integration.status} />
                  <span
                    className="text-[11px] font-medium capitalize"
                    style={{
                      color:
                        integration.status === 'connected'
                          ? 'var(--color-success)'
                          : integration.status === 'error'
                          ? 'var(--color-danger)'
                          : 'var(--color-text-muted)',
                    }}
                  >
                    {integration.status}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {integration.description}
                </p>
              </div>

              {integration.lastSync && (
                <div className="flex items-center gap-1 shrink-0">
                  <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {integration.lastSync}
                  </span>
                </div>
              )}

              <div
                className="shrink-0 transition-transform duration-200"
                style={{
                  color: 'var(--color-text-muted)',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              >
                <ChevronRight size={16} />
              </div>
            </button>

            {/* Expanded config */}
            {isExpanded && (
              <div
                className="px-5 pb-5 pt-2"
                style={{ borderTop: '1px solid var(--color-border)' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integration.fields.map((field) => (
                    <div key={field.key}>
                      <label style={labelStyle}>{field.label}</label>
                      {field.type === 'select' ? (
                        <select style={{ ...inputStyle, cursor: 'pointer' }}>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          style={inputStyle}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Plug size={14} />
                    Connect
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--color-surface-raised)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <RefreshCw size={14} />
                    Test Connection
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Templates
// ---------------------------------------------------------------------------

function TemplatesTab() {
  const [templates] = useState<TemplateItem[]>(SAMPLE_TEMPLATES);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Governance Templates"
          description="Upload and manage templates for governance reviews, reports, and analysis."
        />
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white shrink-0"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Upload size={14} />
          Upload Template
        </button>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex items-center gap-4 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <FileText size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                {template.name}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {template.lastModified} &middot; {template.size}
              </p>
            </div>

            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0"
              style={{
                backgroundColor: `${TEMPLATE_TYPE_COLORS[template.type]}20`,
                color: TEMPLATE_TYPE_COLORS[template.type],
                border: `1px solid ${TEMPLATE_TYPE_COLORS[template.type]}40`,
              }}
            >
              {template.type}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Search size={12} />
                Analyze
              </button>
              <button
                className="p-1.5 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  color: 'var(--color-danger)',
                }}
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Data
// ---------------------------------------------------------------------------

function DataTab() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const csvTemplates = [
    { name: 'Projects', filename: 'projects-template.csv' },
    { name: 'Tasks', filename: 'tasks-template.csv' },
    { name: 'Resources', filename: 'resources-template.csv' },
    { name: 'Financials', filename: 'financials-template.csv' },
    { name: 'Timesheets', filename: 'timesheets-template.csv' },
  ];

  return (
    <div className="space-y-6">
      {/* CSV Templates */}
      <div style={sectionCardStyle}>
        <SectionHeader
          title="CSV Import Templates"
          description="Download templates to prepare your data for import."
        />
        <div className="flex flex-wrap gap-2">
          {csvTemplates.map((t) => (
            <button
              key={t.filename}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Download size={14} />
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Backup & Restore */}
      <div style={sectionCardStyle}>
        <SectionHeader
          title="Backup & Restore"
          description="Create backups or restore from a previous snapshot."
        />
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Download size={14} />
            Create Backup
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Upload size={14} />
            Restore from Backup
          </button>
        </div>
      </div>

      {/* Import / Export */}
      <div style={sectionCardStyle}>
        <SectionHeader
          title="Import & Export"
          description="Bulk import data from CSV or export your entire dataset."
        />
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-success)' }}
          >
            <Upload size={14} />
            Import Data
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Download size={14} />
            Export All Data
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-danger)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
        }}
      >
        <SectionHeader
          title="Danger Zone"
          description="These actions are irreversible. Proceed with caution."
        />
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-danger)' }}
        >
          <Trash2 size={14} />
          Reset All Data
        </button>
      </div>

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset All Data"
          message="This will permanently delete all projects, tasks, financial data, and settings. This action cannot be undone. Are you sure?"
          onConfirm={() => setShowResetConfirm(false)}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SettingsView({ settings, onSettingChange, onThemeChange }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const renderTab = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab settings={settings} onSettingChange={onSettingChange} onThemeChange={onThemeChange} />;
      case 'security':
        return <SecurityTab />;
      case 'integrations':
        return <IntegrationsTab />;
      case 'templates':
        return <TemplatesTab />;
      case 'data':
        return <DataTab />;
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Page header */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <Settings size={22} style={{ color: 'var(--color-primary)' }} />
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Settings
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Configure your Kogvantage workspace
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex items-center gap-1 px-6 pt-3 pb-0 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap"
              style={{
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>
    </div>
  );
}
