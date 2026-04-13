'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Clock,
  DollarSign,
  Users,
  Briefcase,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  FileUp,
  X,
} from 'lucide-react';
import type { ImportResult, ImportError } from '@/server/services/coordinator/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImportTab = 'timesheets' | 'actuals' | 'labour-rates' | 'resources';

interface TabDefinition {
  id: ImportTab;
  label: string;
  icon: React.ReactNode;
  formatDescription: string;
  templateFilename: string;
  expectedColumns: string[];
}

export interface DataImportProps {
  /** Called when the user uploads a file for a specific tab */
  onImport?: (tab: ImportTab, file: File) => Promise<ImportResult>;
  /** Called when the user clicks "AI Import" for universal ingestion */
  onAIImport?: (file: File) => Promise<ImportResult>;
  /** Called to download a template file */
  onDownloadTemplate?: (tab: ImportTab) => void;
  /** Whether an import is in progress */
  isImporting?: boolean;
  /** Most recent import result */
  lastResult?: ImportResult | null;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS: TabDefinition[] = [
  {
    id: 'timesheets',
    label: 'Timesheets',
    icon: <Clock size={16} />,
    formatDescription:
      'SAP timesheet extract with employee hours per activity type. Each row represents a single time entry with personnel number, WBSE, activity type, and hours.',
    templateFilename: 'timesheets_template.csv',
    expectedColumns: [
      'Stream', 'Month', 'Name of Employee', 'Personnel Number',
      'Date', 'Activity Type', 'General Receiver (WBSE)', 'Number/Unit (Hours)',
    ],
  },
  {
    id: 'actuals',
    label: 'Actuals',
    icon: <DollarSign size={16} />,
    formatDescription:
      'SAP cost actuals export showing posted costs per WBS element. Includes cost element, posting date, and NZD values for both labour and non-labour items.',
    templateFilename: 'actuals_template.csv',
    expectedColumns: [
      'Month', 'Posting Date', 'Cost Element', 'WBS Element',
      'Value in Obj Crcy (NZD)', 'Personnel Number', 'Document Number',
    ],
  },
  {
    id: 'labour-rates',
    label: 'Labour Rates',
    icon: <Briefcase size={16} />,
    formatDescription:
      'Band-level hourly and daily labour rates per activity type and fiscal year. Used to calculate forecast costs from timesheet hours.',
    templateFilename: 'labour_rates_template.csv',
    expectedColumns: [
      'Band', 'Activity Type', 'Fiscal Year', 'Hourly Rate (NZD)', 'Daily Rate (NZD)',
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: <Users size={16} />,
    formatDescription:
      'Resource register linking personnel to contract type, activity types, and optional ADO identity. Maps SAP employee IDs to roadmap resources.',
    templateFilename: 'resources_template.csv',
    expectedColumns: [
      'Resource Name', 'Email', 'Work Area', 'Contract Type',
      'Employee ID', 'Activity Type (CAP)', 'Activity Type (OPX)',
    ],
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  activeFile: File | null;
  onClearFile: () => void;
  disabled?: boolean;
}

function DropZone({ onFileDrop, activeFile, onClearFile, disabled }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items?.length) setIsDragOver(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFileDrop(file);
    },
    [onFileDrop, disabled],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileDrop(file);
    e.target.value = '';
  };

  if (activeFile) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
        }}
      >
        <FileSpreadsheet size={20} style={{ color: 'var(--color-success)' }} />
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium block truncate"
            style={{ color: 'var(--color-text)' }}
          >
            {activeFile.name}
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {(activeFile.size / 1024).toFixed(1)} KB
          </span>
        </div>
        <button
          onClick={onClearFile}
          className="p-1 rounded-md transition-colors hover:bg-white/10"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.tsv"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <div
        className="flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-xl cursor-pointer transition-all duration-150"
        style={{
          border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
          backgroundColor: isDragOver
            ? 'var(--color-primary)08'
            : 'var(--color-surface-raised)',
          opacity: disabled ? 0.5 : 1,
        }}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full"
          style={{
            backgroundColor: 'var(--color-primary)15',
            color: 'var(--color-primary-light)',
          }}
        >
          <FileUp size={22} />
        </div>
        <div className="text-center">
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Drag and drop a file here, or{' '}
            <span style={{ color: 'var(--color-primary-light)' }}>browse</span>
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Supports CSV, XLSX, XLS, TSV
          </p>
        </div>
      </div>
    </>
  );
}

function ResultBanner({ result }: { result: ImportResult }) {
  const isSuccess = result.success && result.recordsFailed === 0;
  const isPartial = result.success && result.recordsFailed > 0;

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{
        backgroundColor: isSuccess
          ? 'var(--color-success)10'
          : isPartial
            ? 'var(--color-warning)10'
            : 'var(--color-danger)10',
        border: `1px solid ${
          isSuccess
            ? 'var(--color-success)30'
            : isPartial
              ? 'var(--color-warning)30'
              : 'var(--color-danger)30'
        }`,
      }}
    >
      {isSuccess ? (
        <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
      ) : isPartial ? (
        <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />
      ) : (
        <XCircle size={18} style={{ color: 'var(--color-danger)' }} />
      )}
      <div className="flex-1">
        <p
          className="text-sm font-medium"
          style={{
            color: isSuccess
              ? 'var(--color-success)'
              : isPartial
                ? 'var(--color-warning)'
                : 'var(--color-danger)',
          }}
        >
          {isSuccess
            ? 'Import completed successfully'
            : isPartial
              ? 'Import completed with errors'
              : 'Import failed'}
        </p>
        <div
          className="flex gap-4 mt-2 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span>Processed: {result.recordsProcessed}</span>
          <span>Imported: {result.recordsImported}</span>
          {result.recordsFailed > 0 && (
            <span style={{ color: 'var(--color-danger)' }}>
              Failed: {result.recordsFailed}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorTable({ errors }: { errors: ImportError[] }) {
  if (errors.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div
        className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          color: 'var(--color-text-muted)',
        }}
      >
        Import Errors ({errors.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <th
                className="text-left px-4 py-2 font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Row
              </th>
              <th
                className="text-left px-4 py-2 font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Field
              </th>
              <th
                className="text-left px-4 py-2 font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Value
              </th>
              <th
                className="text-left px-4 py-2 font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Error
              </th>
              <th
                className="text-left px-4 py-2 font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Severity
              </th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err, i) => (
              <tr
                key={i}
                style={{
                  backgroundColor:
                    i % 2 === 0
                      ? 'var(--color-surface)'
                      : 'var(--color-surface-raised)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <td
                  className="px-4 py-2 font-mono"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {err.row}
                </td>
                <td
                  className="px-4 py-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {err.field ?? '-'}
                </td>
                <td
                  className="px-4 py-2 font-mono max-w-[200px] truncate"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {err.value != null ? String(err.value) : '-'}
                </td>
                <td
                  className="px-4 py-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {err.message}
                </td>
                <td className="px-4 py-2">
                  <span
                    className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium uppercase"
                    style={{
                      color:
                        err.severity === 'error'
                          ? 'var(--color-danger)'
                          : 'var(--color-warning)',
                      backgroundColor:
                        err.severity === 'error'
                          ? 'var(--color-danger)15'
                          : 'var(--color-warning)15',
                    }}
                  >
                    {err.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DataImport({
  onImport,
  onAIImport,
  onDownloadTemplate,
  isImporting = false,
  lastResult = null,
}: DataImportProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>('timesheets');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const handleImport = async () => {
    if (!selectedFile || !onImport) return;
    await onImport(activeTab, selectedFile);
    setSelectedFile(null);
  };

  const handleAIImport = async () => {
    if (!selectedFile || !onAIImport) return;
    await onAIImport(selectedFile);
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: 'var(--color-text)' }}
        >
          Data Import
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Import financial data from SAP exports or use AI-powered ingestion
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedFile(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 flex-1 justify-center"
            style={{
              backgroundColor:
                activeTab === tab.id
                  ? 'var(--color-surface)'
                  : 'transparent',
              color:
                activeTab === tab.id
                  ? 'var(--color-text)'
                  : 'var(--color-text-muted)',
              boxShadow:
                activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="flex flex-col gap-5 p-5 rounded-xl"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Format description */}
        <div>
          <h2
            className="text-sm font-semibold mb-2"
            style={{ color: 'var(--color-text)' }}
          >
            Expected Format
          </h2>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {currentTab.formatDescription}
          </p>
        </div>

        {/* Expected columns */}
        <div>
          <h3
            className="text-xs font-medium mb-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Required columns
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {currentTab.expectedColumns.map((col) => (
              <span
                key={col}
                className="inline-flex px-2 py-1 rounded-md text-[11px] font-mono"
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Download template */}
        <button
          onClick={() => onDownloadTemplate?.(activeTab)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium self-start transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            color: 'var(--color-primary-light)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Download size={14} />
          Download {currentTab.label} template
        </button>

        {/* Drop zone */}
        <DropZone
          onFileDrop={setSelectedFile}
          activeFile={selectedFile}
          onClearFile={() => setSelectedFile(null)}
          disabled={isImporting}
        />

        {/* Action buttons */}
        {selectedFile && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
              }}
            >
              {isImporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {isImporting ? 'Importing...' : `Import ${currentTab.label}`}
            </button>

            <button
              onClick={handleAIImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-primary-light)',
                border: '1px solid var(--color-border)',
              }}
            >
              {isImporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              AI Import
            </button>

            <span
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              AI Import auto-detects columns and maps data intelligently
            </span>
          </div>
        )}
      </div>

      {/* Import results */}
      {lastResult && (
        <div className="flex flex-col gap-4">
          <ResultBanner result={lastResult} />
          <ErrorTable errors={lastResult.errors} />
        </div>
      )}
    </div>
  );
}
