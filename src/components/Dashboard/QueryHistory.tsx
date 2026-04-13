'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  RefreshCw,
  Trash2,
  MessageSquare,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HistoryEntry {
  query: string;
  answer: string;
  timestamp: Date;
}

interface QueryHistoryProps {
  history: HistoryEntry[];
  onAskAgain: (q: string) => void;
  onClear: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-NZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Single history entry
// ---------------------------------------------------------------------------

function HistoryItem({
  entry,
  onAskAgain,
}: {
  entry: HistoryEntry;
  onAskAgain: (q: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.item}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={styles.itemHeader}
        aria-expanded={expanded}
      >
        <span style={styles.expandIcon}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <MessageSquare size={14} style={{ color: 'var(--color-primary, #6366f1)', flexShrink: 0 }} />
        <span style={styles.queryText}>{entry.query}</span>
        <span style={styles.timestamp}>
          <Clock size={12} />
          {formatTime(entry.timestamp)}
        </span>
      </button>

      {expanded && (
        <div style={styles.itemBody}>
          <p style={styles.answerText}>{entry.answer}</p>
          <button
            onClick={() => onAskAgain(entry.query)}
            style={styles.askAgainButton}
          >
            <RefreshCw size={12} />
            <span>Ask again</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function QueryHistory({
  history,
  onAskAgain,
  onClear,
}: QueryHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Query History</h3>
        <span style={styles.count}>{history.length}</span>
        <div style={{ flex: 1 }} />
        <button onClick={onClear} style={styles.clearButton}>
          <Trash2 size={14} />
          <span>Clear history</span>
        </button>
      </div>

      <div style={styles.list}>
        {history
          .slice()
          .reverse()
          .map((entry, i) => (
            <HistoryItem
              key={`${entry.timestamp.getTime()}-${i}`}
              entry={entry}
              onAskAgain={onAskAgain}
            />
          ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text, #0f172a)',
  },

  count: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    borderRadius: '10px',
    background: 'var(--color-primary, #6366f1)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 600,
  },

  clearButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--color-text-secondary, #64748b)',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'color 0.15s',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  item: {
    border: '1px solid var(--color-border, #e2e8f0)',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'var(--color-surface, #ffffff)',
  },

  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
    fontSize: '13px',
    color: 'var(--color-text, #0f172a)',
  },

  expandIcon: {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--color-text-secondary, #64748b)',
    flexShrink: 0,
  },

  queryText: {
    flex: 1,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  timestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: 'var(--color-text-secondary, #64748b)',
    flexShrink: 0,
  },

  itemBody: {
    padding: '0 12px 12px 40px',
    borderTop: '1px solid var(--color-border, #e2e8f0)',
  },

  answerText: {
    margin: '12px 0',
    fontSize: '13px',
    lineHeight: 1.6,
    color: 'var(--color-text, #0f172a)',
    whiteSpace: 'pre-wrap' as const,
  },

  askAgainButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    border: '1px solid var(--color-primary, #6366f1)',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--color-primary, #6366f1)',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
};
