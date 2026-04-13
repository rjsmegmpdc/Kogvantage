'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIQueryBarProps {
  onSubmit: (query: string) => Promise<void>;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Suggested questions
// ---------------------------------------------------------------------------

const SUGGESTED_QUESTIONS = [
  "What's over budget?",
  'Show resource conflicts',
  'Projects at risk',
  'Budget forecast',
  'Variance analysis',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIQueryBar({ onSubmit, isLoading }: AIQueryBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;
    await onSubmit(trimmed);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = async (question: string) => {
    if (isLoading) return;
    setQuery(question);
    await onSubmit(question);
    setQuery('');
  };

  return (
    <div style={styles.container}>
      {/* Search bar */}
      <div style={styles.searchWrapper}>
        <div style={styles.iconWrapper}>
          {isLoading ? (
            <Loader2 size={20} style={styles.spinner} />
          ) : (
            <Search size={20} style={styles.searchIcon} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your portfolio..."
          disabled={isLoading}
          style={styles.input}
        />

        <button
          onClick={handleSubmit}
          disabled={!query.trim() || isLoading}
          style={{
            ...styles.submitButton,
            opacity: !query.trim() || isLoading ? 0.5 : 1,
            cursor: !query.trim() || isLoading ? 'not-allowed' : 'pointer',
          }}
          aria-label="Submit query"
        >
          <Sparkles size={18} />
          <span>Ask AI</span>
        </button>
      </div>

      {/* Suggested question chips */}
      <div style={styles.chipRow}>
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => handleChipClick(q)}
            disabled={isLoading}
            style={{
              ...styles.chip,
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles (CSS variables for theming)
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },

  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--color-surface, #ffffff)',
    border: '2px solid var(--color-border, #e2e8f0)',
    borderRadius: '12px',
    padding: '8px 12px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },

  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  searchIcon: {
    color: 'var(--color-text-secondary, #64748b)',
  },

  spinner: {
    color: 'var(--color-primary, #6366f1)',
    animation: 'spin 1s linear infinite',
  },

  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    lineHeight: '24px',
    padding: '8px 0',
    background: 'transparent',
    color: 'var(--color-text, #0f172a)',
    fontFamily: 'inherit',
  },

  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'var(--color-primary, #6366f1)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'opacity 0.2s',
    flexShrink: 0,
  },

  chipRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },

  chip: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid var(--color-border, #e2e8f0)',
    background: 'var(--color-surface, #ffffff)',
    color: 'var(--color-text-secondary, #64748b)',
    fontSize: '13px',
    fontFamily: 'inherit',
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  },
};
