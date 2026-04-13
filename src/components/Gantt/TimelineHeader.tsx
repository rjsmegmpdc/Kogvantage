'use client';

import React from 'react';
import { addDays, format } from 'date-fns';
import { type ZoomLevel, ZOOM_CONFIG } from '@/constants/gantt';

interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  zoomLevel: ZoomLevel;
  pixelsPerDay: number;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({ startDate, endDate, zoomLevel, pixelsPerDay }) => {
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const width = totalDays * pixelsPerDay;

  const renderCells = () => {
    // Bottom Tier (Days/Weeks/Months)
    const bottomCells = [];
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i);
      let showLabel = false;

      if (zoomLevel === 'Day') showLabel = true;
      if (zoomLevel === 'Week' && i % 7 === 0) showLabel = true;
      if (zoomLevel === 'Month' && date.getDate() === 1) showLabel = true;

      if (showLabel) {
        bottomCells.push(
          <div
            key={i}
            className="absolute border-l border-[var(--color-border,hsl(var(--border)))] h-6 text-xs text-[var(--color-muted,hsl(var(--muted-foreground)))] flex items-center pl-1 truncate"
            style={{ left: i * pixelsPerDay, width: (zoomLevel === 'Week' ? 7 : 1) * pixelsPerDay }}
          >
            {format(date, ZOOM_CONFIG[zoomLevel].subHeaderFormat)}
          </div>
        );
      } else if (zoomLevel === 'Day' || (zoomLevel === 'Week' && i % 1 === 0)) {
        bottomCells.push(
          <div
            key={`tick-${i}`}
            className="absolute border-l border-[var(--color-border,hsl(var(--border)))] h-2 bottom-0 opacity-20"
            style={{ left: i * pixelsPerDay }}
          />
        );
      }
    }

    return (
      <div className="relative h-12 bg-[var(--color-surface,hsl(var(--card)))] border-b border-[var(--color-border,hsl(var(--border)))] select-none" style={{ width }}>
        {/* Top Tier (Months/Years) */}
        <div className="h-6 border-b border-[var(--color-border,hsl(var(--border)))] relative overflow-hidden">
          {Array.from({ length: Math.ceil(totalDays / 30) }).map((_, idx) => {
            const date = addDays(startDate, idx * 30);
            return (
              <div
                key={idx}
                className="absolute top-0 h-full px-2 text-xs font-semibold text-[var(--color-muted,hsl(var(--muted-foreground)))] flex items-center border-l border-[var(--color-border,hsl(var(--border)))]"
                style={{ left: idx * 30 * pixelsPerDay }}
              >
                {format(date, ZOOM_CONFIG[zoomLevel].headerFormat)}
              </div>
            );
          })}
        </div>
        {/* Bottom Tier (Days/Weeks) */}
        <div className="h-6 relative">
          {bottomCells}
        </div>
      </div>
    );
  };

  return renderCells();
};
