'use client';

import React from 'react';
import type { HoveredStop, SubwayColors } from '@/constants/subway';

interface StationTooltipProps {
  hoveredStop: HoveredStop;
  activeTheme: string;
  colors: SubwayColors;
}

const StationTooltip: React.FC<StationTooltipProps> = ({
  hoveredStop,
  activeTheme,
  colors,
}) => {
  const { x, y, data: stopData, parentLane, parentRoute } = hoveredStop;
  const isRightSide = x > (typeof window !== 'undefined' ? window.innerWidth : 1024) - 300;

  return (
    <div
      className="fixed z-50 p-3 rounded-lg shadow-xl backdrop-blur-md border pointer-events-none transition-opacity"
      style={{
        left: isRightSide ? 'auto' : x + 20,
        right: isRightSide
          ? (typeof window !== 'undefined' ? window.innerWidth : 1024) - x + 20
          : 'auto',
        top: y - 10,
        backgroundColor:
          activeTheme === 'dark'
            ? 'rgba(15, 23, 42, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
        borderColor: colors.border,
        color: colors.text,
        maxWidth: '300px',
      }}
    >
      <div
        className="flex items-center gap-2 mb-2 pb-2 border-b"
        style={{ borderColor: colors.border }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: parentRoute.color }}
        />
        <span className="font-bold uppercase tracking-wider text-xs opacity-70">
          {parentLane.label || parentRoute.categoryLabel}
        </span>
      </div>
      <h4 className="font-bold text-sm mb-1">
        {stopData.labelTop || stopData.labelBottom || 'Event'}
      </h4>
      {stopData.description && (
        <p className="text-xs opacity-80 mb-2 leading-relaxed">
          {stopData.description}
        </p>
      )}
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs opacity-70 mt-2">
        <span>Start:</span>
        <span className="opacity-100">{stopData.startDate}</span>
        {stopData.endDate && (
          <>
            <span>End:</span>
            <span className="opacity-100">{stopData.endDate}</span>
          </>
        )}
        {stopData.status && (
          <>
            <span>Status:</span>
            <span className="opacity-100 capitalize">{stopData.status}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default StationTooltip;
