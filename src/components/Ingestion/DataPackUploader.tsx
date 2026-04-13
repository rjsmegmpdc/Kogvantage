'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileUp,
  FileSpreadsheet,
  FileJson,
  FileText,
  Image,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import type { IngestResult } from '@/server/services/ingestion/UniversalIngestor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DataPackUploaderProps {
  onAnalyze: (
    files: { name: string; content: string; type: string }[],
  ) => Promise<IngestResult>;
  onImport: (result: IngestResult) => Promise<void>;
}

interface StagedFile {
  file: File;
  content: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

type DetectedType = IngestResult['files'][number]['detectedDataType'];

const TYPE_BADGES: Record<
  DetectedType,
  { label: string; bg: string; fg: string }
> = {
  timesheets:   { label: 'Timesheets',   bg: 'var(--color-blue-100, #dbeafe)',   fg: 'var(--color-blue-800, #1e40af)' },
  actuals:      { label: 'Actuals',      bg: 'var(--color-green-100, #dcfce7)',  fg: 'var(--color-green-800, #166534)' },
  labour_rates: { label: 'Labour Rates', bg: 'var(--color-purple-100, #f3e8ff)', fg: 'var(--color-purple-800, #6b21a8)' },
  resources:    { label: 'Resources',    bg: 'var(--color-amber-100, #fef3c7)',  fg: 'var(--color-amber-800, #92400e)' },
  projects:     { label: 'Projects',     bg: 'var(--color-teal-100, #ccfbf1)',   fg: 'var(--color-teal-800, #115e59)' },
  tasks:        { label: 'Tasks',        bg: 'var(--color-pink-100, #fce7f3)',   fg: 'var(--color-pink-800, #9d174d)' },
  unknown:      { label: 'Unknown',      bg: 'var(--color-gray-100, #f3f4f6)',   fg: 'var(--color-gray-600, #4b5563)' },
};

const FILE_ICONS: Record<string, typeof FileSpreadsheet> = {
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  json: FileJson,
  pdf: FileText,
  image: Image,
  unknown: HelpCircle,
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DataPackUploader({
  onAnalyze,
  onImport,
}: DataPackUploaderProps) {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Drag & drop handlers ----

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

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newStaged: StagedFile[] = [];

    for (const file of fileArray) {
      try {
        const content = await readFileAsText(file);
        newStaged.push({ file, content, type: file.type || '' });
      } catch {
        // Binary files (images, PDFs) — store empty content placeholder
        newStaged.push({ file, content: '', type: file.type || '' });
      }
    }

    setStagedFiles((prev) => [...prev, ...newStaged]);
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
      }
    },
    [addFiles],
  );

  const removeFile = useCallback((index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }, []);

  // ---- Analyze ----

  const handleAnalyze = useCallback(async () => {
    if (stagedFiles.length === 0) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const payload = stagedFiles.map((sf) => ({
        name: sf.file.name,
        content: sf.content,
        type: sf.type,
      }));
      const res = await onAnalyze(payload);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [stagedFiles, onAnalyze]);

  // ---- Import ----

  const handleImport = useCallback(async () => {
    if (!result) return;
    setIsImporting(true);
    setError(null);

    try {
      await onImport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }, [result, onImport]);

  // ---- Render ----

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        style={{
          height: '200px',
          border: `2px dashed ${isDragOver ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #d1d5db)'}`,
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          background: isDragOver
            ? 'var(--color-primary-50, #eff6ff)'
            : 'var(--color-surface, #ffffff)',
          transition: 'all 150ms ease',
        }}
      >
        <Upload
          size={40}
          style={{ color: 'var(--color-muted-foreground, #6b7280)' }}
        />
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-foreground, #111827)',
          }}
        >
          Drop your data pack here
        </span>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--color-muted-foreground, #6b7280)',
          }}
        >
          CSV, XLSX, JSON, PDF, images — AI will analyse everything
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
          accept=".csv,.xlsx,.xls,.json,.pdf,.png,.jpg,.jpeg,.gif,.webp"
        />
      </div>

      {/* Staged file list */}
      {stagedFiles.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '12px',
            borderRadius: '8px',
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e5e7eb)',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-muted-foreground, #6b7280)',
              marginBottom: '4px',
            }}
          >
            {stagedFiles.length} file{stagedFiles.length !== 1 ? 's' : ''} staged
          </span>

          {stagedFiles.map((sf, idx) => {
            // Find matching analysis if available
            const analysis = result?.files.find(
              (f) => f.fileName === sf.file.name,
            );
            const badge = analysis
              ? TYPE_BADGES[analysis.detectedDataType]
              : null;
            const IconComponent =
              FILE_ICONS[
                analysis?.fileType ||
                  sf.file.name.split('.').pop()?.toLowerCase() ||
                  'unknown'
              ] || FileUp;

            return (
              <div
                key={`${sf.file.name}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-muted, #f9fafb)',
                }}
              >
                <IconComponent
                  size={16}
                  style={{ color: 'var(--color-muted-foreground, #6b7280)', flexShrink: 0 }}
                />

                <span
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    color: 'var(--color-foreground, #111827)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sf.file.name}
                </span>

                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-muted-foreground, #9ca3af)',
                    flexShrink: 0,
                  }}
                >
                  {formatBytes(sf.file.size)}
                </span>

                {badge && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: badge.bg,
                      color: badge.fg,
                      flexShrink: 0,
                    }}
                  >
                    {badge.label}
                  </span>
                )}

                {analysis && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color:
                        analysis.confidence > 80
                          ? 'var(--color-green-600, #16a34a)'
                          : analysis.confidence > 50
                            ? 'var(--color-amber-600, #d97706)'
                            : 'var(--color-red-600, #dc2626)',
                      flexShrink: 0,
                    }}
                  >
                    {analysis.confidence}%
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    color: 'var(--color-muted-foreground, #9ca3af)',
                    flexShrink: 0,
                  }}
                  aria-label={`Remove ${sf.file.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      {stagedFiles.length > 0 && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || stagedFiles.length === 0}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              background: 'var(--color-primary, #3b82f6)',
              color: '#ffffff',
              opacity: isAnalyzing ? 0.6 : 1,
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analysing...
              </>
            ) : (
              <>
                <FileUp size={16} />
                Analyse
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!result || isImporting}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #d1d5db)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: !result || isImporting ? 'not-allowed' : 'pointer',
              background: result
                ? 'var(--color-green-600, #16a34a)'
                : 'var(--color-muted, #f3f4f6)',
              color: result ? '#ffffff' : 'var(--color-muted-foreground, #9ca3af)',
              opacity: isImporting ? 0.6 : 1,
            }}
          >
            {isImporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Import All
              </>
            )}
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--color-red-50, #fef2f2)',
            border: '1px solid var(--color-red-200, #fecaca)',
            color: 'var(--color-red-700, #b91c1c)',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Analysis results panel */}
      {result && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid var(--color-border, #e5e7eb)',
            background: 'var(--color-surface, #ffffff)',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-foreground, #111827)',
            }}
          >
            Analysis Summary — {result.importableRecords} of{' '}
            {result.totalRecords} records importable
          </div>

          {/* Found items */}
          {result.gapReport.found.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {result.gapReport.found.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--color-green-700, #15803d)',
                  }}
                >
                  <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Missing items */}
          {result.gapReport.missing.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {result.gapReport.missing.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--color-amber-700, #b45309)',
                  }}
                >
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {result.gapReport.warnings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {result.gapReport.warnings.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--color-red-600, #dc2626)',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
