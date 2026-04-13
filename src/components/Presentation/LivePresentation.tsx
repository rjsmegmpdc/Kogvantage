'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import PresentationControls from './PresentationControls';

// =====================================================================
// Types
// =====================================================================

export interface PresentationSlide {
  type: 'title' | 'kpi' | 'chart' | 'table' | 'summary';
  title: string;
  subtitle?: string;
  data?: any;
  chartType?: 'bar' | 'pie' | 'line' | 'gauge';
}

export interface PresentationTemplate {
  colorPalette: string[];
  fontPrimary: string;
  fontHeading: string;
  logoPath?: string;
}

interface LivePresentationProps {
  slides: PresentationSlide[];
  template?: PresentationTemplate;
  onClose: () => void;
  onExport: () => void;
}

// =====================================================================
// Default palette
// =====================================================================

const DEFAULT_PALETTE = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const BG_COLOR = '#0f172a';
const SURFACE_COLOR = 'rgba(30, 41, 59, 0.85)';
const TEXT_COLOR = '#e2e8f0';
const TEXT_MUTED = '#94a3b8';
const AUTO_ADVANCE_DEFAULT = 15;

// =====================================================================
// Slide sub-components
// =====================================================================

function TitleSlide({
  slide,
  palette,
  template,
}: {
  slide: PresentationSlide;
  palette: string[];
  template?: PresentationTemplate;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        gap: 24,
      }}
    >
      {template?.logoPath && (
        <img
          src={template.logoPath}
          alt="Logo"
          style={{ height: 56, objectFit: 'contain', marginBottom: 8 }}
        />
      )}
      <h1
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: '#fff',
          fontFamily: template?.fontHeading || 'inherit',
          lineHeight: 1.2,
          maxWidth: '80%',
        }}
      >
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p
          style={{
            fontSize: 22,
            color: palette[0],
            fontFamily: template?.fontPrimary || 'inherit',
            fontWeight: 500,
          }}
        >
          {slide.subtitle}
        </p>
      )}
      {slide.data?.date && (
        <p style={{ fontSize: 16, color: TEXT_MUTED, marginTop: 8 }}>
          {slide.data.date}
        </p>
      )}
    </div>
  );
}

function KPISlide({ slide, palette }: { slide: PresentationSlide; palette: string[] }) {
  const kpis: { label: string; value: string | number; color?: string }[] =
    slide.data?.kpis || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '40px 60px',
      }}
    >
      <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 40 }}>
        {slide.title}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          flex: 1,
          alignContent: 'center',
        }}
      >
        {kpis.map((kpi, i) => (
          <div
            key={i}
            style={{
              background: SURFACE_COLOR,
              borderRadius: 16,
              padding: '32px 28px',
              borderLeft: `4px solid ${kpi.color || palette[i % palette.length]}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14, color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>
              {kpi.label}
            </span>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSlide({ slide, palette }: { slide: PresentationSlide; palette: string[] }) {
  const chartType = slide.chartType || 'bar';
  const items: { name: string; values: number[] }[] = slide.data?.items || [];
  const labels: string[] = slide.data?.labels || ['Value 1', 'Value 2'];
  const maxVal = Math.max(1, ...items.flatMap((it) => it.values));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '40px 60px',
      }}
    >
      <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p style={{ fontSize: 16, color: TEXT_MUTED, marginBottom: 32 }}>{slide.subtitle}</p>
      )}

      {chartType === 'bar' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            {labels.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: palette[i % palette.length] }} />
                <span style={{ fontSize: 13, color: TEXT_MUTED }}>{label}</span>
              </div>
            ))}
          </div>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span
                style={{
                  width: 140,
                  fontSize: 13,
                  color: TEXT_COLOR,
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name}
              </span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {item.values.map((val, vi) => (
                  <div
                    key={vi}
                    style={{
                      height: 20,
                      width: `${(val / maxVal) * 100}%`,
                      minWidth: val > 0 ? 4 : 0,
                      background: palette[vi % palette.length],
                      borderRadius: 4,
                      transition: 'width 0.6s ease',
                    }}
                  />
                ))}
              </div>
              <span style={{ width: 80, fontSize: 12, color: TEXT_MUTED, textAlign: 'right' }}>
                {item.values.map((v) => `$${(v / 1000).toFixed(0)}k`).join(' / ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {chartType === 'pie' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60 }}>
          {/* Simple donut via conic-gradient */}
          <PieChart items={items} palette={palette} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: palette[i % palette.length] }} />
                <span style={{ fontSize: 15, color: TEXT_COLOR }}>{item.name}</span>
                <span style={{ fontSize: 15, color: TEXT_MUTED, fontWeight: 600, marginLeft: 8 }}>
                  {item.values[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(chartType === 'line' || chartType === 'gauge') && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT_MUTED, fontSize: 18 }}>
          {chartType === 'gauge' ? 'Gauge visualisation' : 'Line chart visualisation'}
        </div>
      )}
    </div>
  );
}

function PieChart({ items, palette }: { items: { name: string; values: number[] }[]; palette: string[] }) {
  const total = items.reduce((s, it) => s + (it.values[0] || 0), 0);
  if (total === 0) {
    return <div style={{ width: 200, height: 200, borderRadius: '50%', background: SURFACE_COLOR }} />;
  }
  let accumulated = 0;
  const stops = items.map((item, i) => {
    const pct = (item.values[0] / total) * 100;
    const start = accumulated;
    accumulated += pct;
    return `${palette[i % palette.length]} ${start}% ${accumulated}%`;
  });

  return (
    <div
      style={{
        width: 220,
        height: 220,
        borderRadius: '50%',
        background: `conic-gradient(${stops.join(', ')})`,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: BG_COLOR,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {total}
      </div>
    </div>
  );
}

function TableSlide({ slide }: { slide: PresentationSlide }) {
  const headers: string[] = slide.data?.headers || [];
  const rows: (string | number)[][] = slide.data?.rows || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '40px 60px',
      }}
    >
      <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 32 }}>
        {slide.title}
      </h2>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: TEXT_MUTED,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '12px 16px',
                      fontSize: 15,
                      color: TEXT_COLOR,
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummarySlide({ slide, palette }: { slide: PresentationSlide; palette: string[] }) {
  const points: string[] = slide.data?.points || [slide.subtitle || ''];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '60px 80px',
        textAlign: 'center',
        gap: 32,
      }}
    >
      <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>{slide.title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
        {points.map((p, i) => (
          <p
            key={i}
            style={{
              fontSize: 18,
              color: TEXT_COLOR,
              lineHeight: 1.6,
              paddingLeft: 20,
              borderLeft: `3px solid ${palette[i % palette.length]}`,
              textAlign: 'left',
            }}
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// Main component
// =====================================================================

export default function LivePresentation({
  slides,
  template,
  onClose,
  onExport,
}: LivePresentationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_ADVANCE_DEFAULT);
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const palette = template?.colorPalette?.length
    ? template.colorPalette
    : DEFAULT_PALETTE;

  const totalSlides = slides.length;

  // -- Navigation helpers --

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides) return;
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setSecondsRemaining(AUTO_ADVANCE_DEFAULT);
        setTransitioning(false);
      }, 250);
    },
    [totalSlides]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // -- Keyboard navigation --

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  // -- Auto-advance timer --

  useEffect(() => {
    if (!timerEnabled) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (currentIndex < totalSlides - 1) {
            goNext();
          } else {
            setTimerEnabled(false);
          }
          return AUTO_ADVANCE_DEFAULT;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEnabled, currentIndex, totalSlides, goNext]);

  // -- Render slide content --

  const slide = slides[currentIndex];

  const renderSlide = () => {
    if (!slide) return null;
    switch (slide.type) {
      case 'title':
        return <TitleSlide slide={slide} palette={palette} template={template} />;
      case 'kpi':
        return <KPISlide slide={slide} palette={palette} />;
      case 'chart':
        return <ChartSlide slide={slide} palette={palette} />;
      case 'table':
        return <TableSlide slide={slide} />;
      case 'summary':
        return <SummarySlide slide={slide} palette={palette} />;
      default:
        return <TitleSlide slide={slide} palette={palette} template={template} />;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: BG_COLOR,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: template?.fontPrimary || 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Exit button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          zIndex: 10002,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.06)',
          color: TEXT_COLOR,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        aria-label="Exit presentation"
      >
        <X size={14} />
        Exit
      </button>

      {/* Slide number badge */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 28,
          zIndex: 10002,
          fontSize: 13,
          fontWeight: 600,
          color: TEXT_MUTED,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {currentIndex + 1} / {totalSlides}
      </div>

      {/* 16:9 slide container */}
      <div
        style={{
          width: 'min(90vw, 1280px)',
          aspectRatio: '16 / 9',
          maxHeight: '85vh',
          background: 'linear-gradient(145deg, rgba(30,41,59,0.6), rgba(15,23,42,0.95))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
          position: 'relative',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        {renderSlide()}
      </div>

      {/* Controls */}
      <PresentationControls
        currentSlide={currentIndex + 1}
        totalSlides={totalSlides}
        onPrev={goPrev}
        onNext={goNext}
        onExport={onExport}
        timerEnabled={timerEnabled}
        onToggleTimer={() => {
          setTimerEnabled((prev) => !prev);
          setSecondsRemaining(AUTO_ADVANCE_DEFAULT);
        }}
        secondsRemaining={secondsRemaining}
      />
    </div>
  );
}
