'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Timer,
  TimerOff,
  Download,
} from 'lucide-react';

interface PresentationControlsProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onExport: () => void;
  timerEnabled: boolean;
  onToggleTimer: () => void;
  secondsRemaining: number;
}

export default function PresentationControls({
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
  onExport,
  timerEnabled,
  onToggleTimer,
  secondsRemaining,
}: PresentationControlsProps) {
  const [visible, setVisible] = useState(true);
  const [hideTimeout, setHideTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    setVisible(true);
    if (hideTimeout) clearTimeout(hideTimeout);
    const t = setTimeout(() => setVisible(false), 3000);
    setHideTimeout(t);
  }, [hideTimeout]);

  useEffect(() => {
    const handleMove = () => resetHideTimer();
    window.addEventListener('mousemove', handleMove);
    // Start the auto-hide timer on mount
    const initial = setTimeout(() => setVisible(false), 3000);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      clearTimeout(initial);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '12px 24px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Previous */}
      <button
        onClick={onPrev}
        disabled={currentSlide <= 1}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.06)',
          color: currentSlide <= 1 ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
          cursor: currentSlide <= 1 ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Slide counter */}
      <span
        style={{
          color: '#e2e8f0',
          fontSize: 14,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 60,
          textAlign: 'center',
        }}
      >
        {currentSlide} / {totalSlides}
      </span>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={currentSlide >= totalSlides}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.06)',
          color: currentSlide >= totalSlides ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
          cursor: currentSlide >= totalSlides ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />

      {/* Timer toggle */}
      <button
        onClick={onToggleTimer}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: timerEnabled ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
          color: '#e2e8f0',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        aria-label={timerEnabled ? 'Disable auto-advance' : 'Enable auto-advance'}
      >
        {timerEnabled ? <Timer size={14} /> : <TimerOff size={14} />}
        {timerEnabled ? `${secondsRemaining}s` : 'Auto'}
      </button>

      {/* Export PPTX */}
      <button
        onClick={onExport}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 8,
          border: 'none',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
      >
        <Download size={14} />
        Export PPTX
      </button>
    </div>
  );
}
