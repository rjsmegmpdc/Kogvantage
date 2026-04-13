'use client';

import { useState, useCallback, useRef } from 'react';
import {
  UserCircle,
  Building2,
  Plug,
  Upload,
  FileText,
  ShieldCheck,
  LayoutDashboard,
  Bot,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  BarChart3,
  Train,
  Lock,
  CalendarClock,
  Sparkles,
  X,
  FileSpreadsheet,
  Info,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface OnboardingConfig {
  role: string;
  orgName: string;
  brandColor: string;
  currency: string;
  fiscalYearStart: number;
  dateFormat: string;
  defaultView: 'GANTT' | 'SUBWAY';
  codewordsEnabled: boolean;
  dateShiftDays: number;
}

export interface OnboardingWizardProps {
  onComplete: (config: OnboardingConfig) => void;
  onSkip: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEP_META = [
  { title: 'Welcome', icon: UserCircle },
  { title: 'Organization', icon: Building2 },
  { title: 'Data Sources', icon: Plug },
  { title: 'Import Data', icon: Upload },
  { title: 'Templates', icon: FileText },
  { title: 'Security', icon: ShieldCheck },
  { title: 'Default View', icon: LayoutDashboard },
  { title: 'AI Assistant', icon: Bot },
] as const;

const TOTAL_STEPS = STEP_META.length;

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Full platform access including system settings, user management, and all data.' },
  { value: 'portfolio_manager', label: 'Portfolio Manager', desc: 'Oversee all projects, budgets, and strategic alignment across the portfolio.' },
  { value: 'project_manager', label: 'Project Manager', desc: 'Manage individual projects, timelines, tasks, and team assignments.' },
  { value: 'financial_controller', label: 'Financial Controller', desc: 'View and manage budgets, forecasts, variance analysis, and financial reports.' },
  { value: 'stakeholder', label: 'Stakeholder', desc: 'Read-only access to dashboards, reports, and high-level portfolio status.' },
  { value: 'viewer', label: 'Viewer', desc: 'Basic read-only access to published views and shared reports.' },
] as const;

const CURRENCIES = ['NZD', 'USD', 'AUD', 'GBP', 'EUR'] as const;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const DATE_FORMATS = ['DD-MM-YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;

const INTEGRATIONS = [
  { id: 'azure', name: 'Azure DevOps', icon: '🔷', comingSoon: true },
  { id: 'jira', name: 'Jira', icon: '🟦', comingSoon: true },
  { id: 'servicenow', name: 'ServiceNow', icon: '🟩', comingSoon: true },
  { id: 'sap', name: 'SAP', icon: '🔶', comingSoon: true },
  { id: 'github', name: 'GitHub', icon: '⚫', comingSoon: true },
  { id: 'smartsheet', name: 'Smartsheet', icon: '📊', comingSoon: true },
  { id: 'csv', name: 'CSV Files', icon: '📄', comingSoon: false },
  { id: 'other', name: 'Other', icon: '🔌', comingSoon: true },
] as const;

const ACCEPTED_DATA_TYPES = '.csv,.xlsx,.zip,.json,.pdf,.png,.jpg,.jpeg,.gif,.webp';
const ACCEPTED_TEMPLATE_TYPES = '.pptx,.docx,.xlsx';

const SAMPLE_PROMPTS = [
  'Analyze my risks',
  'Generate a report',
  "What's over budget?",
  'Show project timeline',
  'Compare actuals to forecast',
];

/* ------------------------------------------------------------------ */
/*  Shared inline-style helpers                                        */
/* ------------------------------------------------------------------ */

const surface = (level: 'base' | 'raised' | 'overlay' = 'base') => {
  const map = { base: 'var(--color-surface)', raised: 'var(--color-surface-raised)', overlay: 'var(--color-surface-overlay)' };
  return map[level];
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<OnboardingConfig>({
    role: '',
    orgName: '',
    brandColor: '#2563eb',
    currency: 'NZD',
    fiscalYearStart: 7,
    dateFormat: 'DD-MM-YYYY',
    defaultView: 'GANTT',
    codewordsEnabled: false,
    dateShiftDays: 0,
  });

  // Integration "connected" state (local UI only)
  const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set(['csv']));
  const [comingSoonTooltip, setComingSoonTooltip] = useState<string | null>(null);

  // File lists
  const [dataFiles, setDataFiles] = useState<File[]>([]);
  const [templateFiles, setTemplateFiles] = useState<File[]>([]);

  // Refs for hidden file inputs
  const dataInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  /* ---- helpers ---- */

  const patch = useCallback(
    (partial: Partial<OnboardingConfig>) => setConfig((prev) => ({ ...prev, ...partial })),
    [],
  );

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => onComplete(config);

  const handleDataDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) setDataFiles((prev) => [...prev, ...files]);
  };

  const handleTemplateDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length) setTemplateFiles((prev) => [...prev, ...files]);
  };

  const removeDataFile = (idx: number) => setDataFiles((prev) => prev.filter((_, i) => i !== idx));
  const removeTemplateFile = (idx: number) => setTemplateFiles((prev) => prev.filter((_, i) => i !== idx));

  /* ---- step renderers ---- */

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepWelcome config={config} patch={patch} />;
      case 1:
        return <StepOrgProfile config={config} patch={patch} />;
      case 2:
        return (
          <StepDataSources
            connected={connectedSources}
            onConnect={(id) => {
              const integ = INTEGRATIONS.find((i) => i.id === id);
              if (integ?.comingSoon) {
                setComingSoonTooltip(id);
                setTimeout(() => setComingSoonTooltip(null), 2000);
              } else {
                setConnectedSources((prev) => new Set(prev).add(id));
              }
            }}
            comingSoonTooltip={comingSoonTooltip}
          />
        );
      case 3:
        return (
          <StepImportData
            files={dataFiles}
            onDrop={handleDataDrop}
            onRemove={removeDataFile}
            inputRef={dataInputRef}
            onFileSelect={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) setDataFiles((prev) => [...prev, ...files]);
            }}
          />
        );
      case 4:
        return (
          <StepTemplates
            files={templateFiles}
            onDrop={handleTemplateDrop}
            onRemove={removeTemplateFile}
            inputRef={templateInputRef}
            onFileSelect={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) setTemplateFiles((prev) => [...prev, ...files]);
            }}
          />
        );
      case 5:
        return <StepSecurity config={config} patch={patch} />;
      case 6:
        return <StepDefaultView config={config} patch={patch} />;
      case 7:
        return <StepAIAssistant />;
      default:
        return null;
    }
  };

  /* ---- main layout ---- */

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '42rem',
          maxHeight: '90vh',
          margin: '0 1rem',
          borderRadius: '1rem',
          border: '1px solid var(--color-border)',
          backgroundColor: surface('base'),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* ---- Skip button ---- */}
        <button
          onClick={onSkip}
          aria-label="Skip onboarding"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: 'var(--color-text-muted)',
            transition: 'color 0.15s, background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = surface('raised');
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <X size={16} />
        </button>

        {/* ---- Progress bar ---- */}
        <div style={{ padding: '1.25rem 1.5rem 0' }}>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: surface('raised'),
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
                backgroundColor: 'var(--color-primary)',
                borderRadius: 2,
                transition: 'width 0.35s ease',
              }}
            />
          </div>

          {/* Step indicator dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.75rem',
            }}
          >
            {STEP_META.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: isActive
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    backgroundColor: isDone
                      ? 'var(--color-primary)'
                      : isActive
                        ? 'var(--color-primary)18'
                        : 'transparent',
                    color: isDone
                      ? 'white'
                      : isActive
                        ? 'var(--color-primary-light)'
                        : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: 0,
                  }}
                >
                  {isDone ? <Check size={14} /> : <Icon size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Step content (scrollable) ---- */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
          }}
        >
          {renderStep()}
        </div>

        {/* ---- Navigation footer ---- */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={prev}
            disabled={step === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: step === 0 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.5 : 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {step + 1} / {TOTAL_STEPS}
          </span>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={next}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={finish}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: 'var(--color-success)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Sparkles size={16} /> Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 1 — Welcome & Role                                            */
/* ================================================================== */

function StepWelcome({
  config,
  patch,
}: {
  config: OnboardingConfig;
  patch: (p: Partial<OnboardingConfig>) => void;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: '1rem',
          backgroundColor: 'var(--color-primary)18',
          marginBottom: '1rem',
        }}
      >
        <Sparkles size={28} style={{ color: 'var(--color-primary-light)' }} />
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
        Welcome to Kogvantage
      </h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
        AI-powered portfolio intelligence. Let&apos;s set up your workspace in a few quick steps.
      </p>

      <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
          What best describes your role?
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {ROLES.map((r) => {
            const selected = config.role === r.value;
            return (
              <button
                key={r.value}
                onClick={() => patch({ role: r.value })}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: selected ? 'var(--color-primary)12' : surface('raised'),
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: selected ? 'none' : '2px solid var(--color-border-hover)',
                    backgroundColor: selected ? 'var(--color-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {selected && <Check size={11} color="white" />}
                </div>
                <div>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                    {r.label}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    {r.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 2 — Organization Profile                                      */
/* ================================================================== */

function StepOrgProfile({
  config,
  patch,
}: {
  config: OnboardingConfig;
  patch: (p: Partial<OnboardingConfig>) => void;
}) {
  const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    marginBottom: '0.375rem',
    letterSpacing: '0.01em',
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--color-border)',
    backgroundColor: surface('raised'),
    color: 'var(--color-text)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
        Organization Profile
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Tell us about your organization so we can tailor your experience.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Org name */}
        <div>
          <label style={fieldLabel}>Organization Name</label>
          <input
            type="text"
            placeholder="Acme Corp"
            value={config.orgName}
            onChange={(e) => patch({ orgName: e.target.value })}
            style={inputBase}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Brand color */}
        <div>
          <label style={fieldLabel}>Primary Brand Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="color"
              value={config.brandColor}
              onChange={(e) => patch({ brandColor: e.target.value })}
              style={{
                width: 40,
                height: 40,
                borderRadius: '0.5rem',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                padding: 2,
                backgroundColor: 'transparent',
              }}
            />
            <input
              type="text"
              value={config.brandColor}
              onChange={(e) => patch({ brandColor: e.target.value })}
              style={{ ...inputBase, width: 140, fontFamily: 'JetBrains Mono, monospace' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '0.5rem',
                backgroundColor: config.brandColor,
              }}
            />
          </div>
        </div>

        {/* Currency / Fiscal year / Date format — 3-col row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={fieldLabel}>Currency</label>
            <select
              value={config.currency}
              onChange={(e) => patch({ currency: e.target.value })}
              style={{ ...inputBase, cursor: 'pointer' }}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Fiscal Year Start</label>
            <select
              value={config.fiscalYearStart}
              onChange={(e) => patch({ fiscalYearStart: Number(e.target.value) })}
              style={{ ...inputBase, cursor: 'pointer' }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Date Format</label>
            <select
              value={config.dateFormat}
              onChange={(e) => patch({ dateFormat: e.target.value })}
              style={{ ...inputBase, cursor: 'pointer' }}
            >
              {DATE_FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 3 — Connect Data Sources                                      */
/* ================================================================== */

function StepDataSources({
  connected,
  onConnect,
  comingSoonTooltip,
}: {
  connected: Set<string>;
  onConnect: (id: string) => void;
  comingSoonTooltip: string | null;
}) {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
        Connect Data Sources
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Link your existing tools so Kogvantage can pull project data automatically.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {INTEGRATIONS.map((integ) => {
          const isConnected = connected.has(integ.id);
          const showTooltip = comingSoonTooltip === integ.id;
          return (
            <div
              key={integ.id}
              style={{
                position: 'relative',
                padding: '1rem',
                borderRadius: '0.625rem',
                border: isConnected
                  ? '1px solid var(--color-success)'
                  : '1px solid var(--color-border)',
                backgroundColor: isConnected ? 'rgba(34,197,94,0.06)' : surface('raised'),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'border-color 0.2s, background-color 0.2s',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{integ.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>
                {integ.name}
              </span>

              {isConnected ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-success)',
                  }}
                >
                  <CheckCircle2 size={14} /> Connected
                </span>
              ) : (
                <button
                  onClick={() => onConnect(integ.id)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--color-primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  Connect
                </button>
              )}

              {/* Coming soon tooltip */}
              {showTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%) translateY(100%)',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    backgroundColor: surface('overlay'),
                    color: 'var(--color-text)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  Coming soon
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 4 — Import Initial Data                                       */
/* ================================================================== */

function StepImportData({
  files,
  onDrop,
  onRemove,
  inputRef,
  onFileSelect,
}: {
  files: File[];
  onDrop: (e: React.DragEvent) => void;
  onRemove: (i: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
        Import Initial Data
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Bring your existing project data into Kogvantage.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { onDrop(e); setDragOver(false); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border-hover)'}`,
          borderRadius: '0.75rem',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragOver ? 'var(--color-primary)08' : surface('raised'),
          transition: 'all 0.2s',
        }}
      >
        <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)', margin: '0 0 0.375rem' }}>
          Drop your data pack here
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.6 }}>
          CSV, XLSX, ZIP, JSON, PDF, or images.
          <br />
          Our AI will identify what&apos;s inside, map columns, and flag anything missing.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_DATA_TYPES}
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: surface('raised'),
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                <FileSpreadsheet size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {f.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {(f.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}

          <button
            style={{
              alignSelf: 'flex-start',
              marginTop: '0.5rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Import {files.length} file{files.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      <p
        style={{
          textAlign: 'center',
          marginTop: '1rem',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
        }}
      >
        Or{' '}
        <span style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--color-primary-light)' }}>
          skip for now
        </span>
      </p>
    </div>
  );
}

/* ================================================================== */
/*  Step 5 — Governance Templates                                      */
/* ================================================================== */

function StepTemplates({
  files,
  onDrop,
  onRemove,
  inputRef,
  onFileSelect,
}: {
  files: File[];
  onDrop: (e: React.DragEvent) => void;
  onRemove: (i: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const typeBadge = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const colors: Record<string, string> = {
      pptx: 'var(--color-warning)',
      docx: 'var(--color-info)',
      xlsx: 'var(--color-success)',
    };
    return (
      <span
        style={{
          padding: '1px 6px',
          borderRadius: 4,
          fontSize: '0.65rem',
          fontWeight: 700,
          color: 'white',
          backgroundColor: colors[ext] || 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {ext}
      </span>
    );
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
        Governance Templates
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Upload your existing report templates &mdash; AI will learn your format, colors, and language style.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { onDrop(e); setDragOver(false); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border-hover)'}`,
          borderRadius: '0.75rem',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragOver ? 'var(--color-primary)08' : surface('raised'),
          transition: 'all 0.2s',
        }}
      >
        <FileText size={28} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
          Upload report templates
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
          PPTX, DOCX, or XLSX files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TEMPLATE_TYPES}
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: surface('raised'),
                fontSize: '0.8rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)' }}>
                {typeBadge(f.name)}
                {f.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Or{' '}
        <span style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--color-primary-light)' }}>
          skip for now
        </span>
      </p>
    </div>
  );
}

/* ================================================================== */
/*  Step 6 — Security Setup                                            */
/* ================================================================== */

function StepSecurity({
  config,
  patch,
}: {
  config: OnboardingConfig;
  patch: (p: Partial<OnboardingConfig>) => void;
}) {
  const toggleStyle: React.CSSProperties = {
    position: 'relative',
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    padding: 0,
    flexShrink: 0,
  };

  const dotStyle = (on: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 3,
    left: on ? 23 : 3,
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: 'white',
    transition: 'left 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  });

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
        Security Setup
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Configure data protection features for sensitive portfolio information.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Codeword toggle */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.625rem',
            border: '1px solid var(--color-border)',
            backgroundColor: surface('raised'),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={16} style={{ color: 'var(--color-primary-light)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                Enable codeword protection
              </span>
            </div>
            <button
              onClick={() => patch({ codewordsEnabled: !config.codewordsEnabled })}
              style={{
                ...toggleStyle,
                backgroundColor: config.codewordsEnabled ? 'var(--color-primary)' : surface('overlay'),
              }}
            >
              <div style={dotStyle(config.codewordsEnabled)} />
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            Replace sensitive project names with codewords in exports and shared views. Only authorized users see real names.
          </p>

          {config.codewordsEnabled && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: surface('base'),
                border: '1px solid var(--color-border)',
              }}
            >
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 0.5rem' }}>
                Sample mapping
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                {[
                  ['Project Alpha', 'PHOENIX'],
                  ['Budget Overhaul', 'AURORA'],
                  ['Cloud Migration', 'TITAN'],
                ].map(([real, code]) => (
                  <div key={code} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{real}</span>
                    <span style={{ color: 'var(--color-primary-light)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                      {code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date shifting toggle */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.625rem',
            border: '1px solid var(--color-border)',
            backgroundColor: surface('raised'),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarClock size={16} style={{ color: 'var(--color-primary-light)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                Enable date shifting
              </span>
            </div>
            <button
              onClick={() => patch({ dateShiftDays: config.dateShiftDays > 0 ? 0 : 7 })}
              style={{
                ...toggleStyle,
                backgroundColor: config.dateShiftDays > 0 ? 'var(--color-primary)' : surface('overlay'),
              }}
            >
              <div style={dotStyle(config.dateShiftDays > 0)} />
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            Shift all dates by a fixed offset in exports to protect timeline details.
          </p>

          {config.dateShiftDays > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Offset (days):
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={config.dateShiftDays}
                onChange={(e) => patch({ dateShiftDays: Math.max(1, Number(e.target.value)) })}
                style={{
                  width: 72,
                  padding: '0.3rem 0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--color-border)',
                  backgroundColor: surface('base'),
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
            </div>
          )}
        </div>

        {/* Note */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-info)10', border: '1px solid var(--color-info)30' }}>
          <Info size={14} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            You can configure detailed security settings later in Settings &rarr; Security &amp; Compliance.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 7 — Choose Default View                                       */
/* ================================================================== */

function StepDefaultView({
  config,
  patch,
}: {
  config: OnboardingConfig;
  patch: (p: Partial<OnboardingConfig>) => void;
}) {
  const views = [
    {
      key: 'GANTT' as const,
      label: 'Gantt View',
      Icon: BarChart3,
      desc: 'Classic timeline bars showing project schedules, dependencies, and critical path. Best for detailed scheduling, resource planning, and tracking milestones across multiple work-streams.',
    },
    {
      key: 'SUBWAY' as const,
      label: 'Subway Map',
      Icon: Train,
      desc: 'Visual metro-style map where routes are projects and stations are milestones. Ideal for executive presentations, stakeholder communication, and showing interconnected portfolio progress.',
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
        Choose Your Default View
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Pick the view you&apos;ll see when you open Kogvantage. You can switch anytime.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {views.map(({ key, label, Icon, desc }) => {
          const selected = config.defaultView === key;
          return (
            <button
              key={key}
              onClick={() => patch({ defaultView: key })}
              style={{
                padding: '1.5rem 1.25rem',
                borderRadius: '0.75rem',
                border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: selected ? 'var(--color-primary)10' : surface('raised'),
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '0.75rem',
                  backgroundColor: selected ? 'var(--color-primary)20' : surface('overlay'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <Icon
                  size={28}
                  style={{
                    color: selected ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                  }}
                />
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: selected ? 'var(--color-text)' : 'var(--color-text-secondary)',
                }}
              >
                {label}
              </span>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {desc}
              </p>
              {selected && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-primary-light)',
                  }}
                >
                  <CheckCircle2 size={14} /> Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 8 — Meet Your AI Assistant                                    */
/* ================================================================== */

function StepAIAssistant() {
  const chatBubble = (
    role: 'user' | 'assistant',
    text: string,
  ) => {
    const isUser = role === 'user';
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          gap: '0.5rem',
          alignItems: 'flex-end',
        }}
      >
        {!isUser && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bot size={14} style={{ color: 'var(--color-primary-light)' }} />
          </div>
        )}
        <div
          style={{
            maxWidth: '75%',
            padding: '0.625rem 0.875rem',
            borderRadius: isUser ? '0.75rem 0.75rem 0.25rem 0.75rem' : '0.75rem 0.75rem 0.75rem 0.25rem',
            backgroundColor: isUser ? 'var(--color-primary)' : surface('raised'),
            color: isUser ? 'white' : 'var(--color-text-secondary)',
            fontSize: '0.82rem',
            lineHeight: 1.5,
          }}
        >
          {text}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            borderRadius: '1rem',
            backgroundColor: 'var(--color-primary)18',
            marginBottom: '0.75rem',
          }}
        >
          <Bot size={26} style={{ color: 'var(--color-primary-light)' }} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 0.25rem' }}>
          Meet Your AI Assistant
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Powered by Claude Sonnet. Ask anything about your portfolio.
        </p>
      </div>

      {/* Chat preview */}
      <div
        style={{
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid var(--color-border)',
          backgroundColor: surface('base'),
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {chatBubble('user', 'Which projects are at risk of missing their deadlines?')}
        {chatBubble(
          'assistant',
          'I found 3 projects with upcoming deadlines at risk. Project Alpha is 12 days behind schedule on the Cloud Migration epic, and two others have unresolved dependency blockers. Shall I generate a detailed risk report?',
        )}
        {chatBubble('user', 'Yes, include budget impact too.')}
        {chatBubble(
          'assistant',
          'Done! I\'ve generated a risk report with budget impact analysis. The combined exposure across the three projects is approximately $142K above forecast. Opening the report now.',
        )}
      </div>

      {/* Prompt chips */}
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
        Try asking:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {SAMPLE_PROMPTS.map((prompt) => (
          <span
            key={prompt}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.375rem 0.75rem',
              borderRadius: '2rem',
              border: '1px solid var(--color-border)',
              backgroundColor: surface('raised'),
              color: 'var(--color-text-secondary)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={12} style={{ color: 'var(--color-primary-light)' }} />
            {prompt}
          </span>
        ))}
      </div>
    </div>
  );
}
