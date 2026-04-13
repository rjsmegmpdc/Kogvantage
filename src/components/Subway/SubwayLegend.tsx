'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { ShapeComponents } from './StationMarker';
import type { StationType, SubwayColors } from '@/constants/subway';

interface SubwayLegendProps {
  stationTypes: StationType[];
  activeFilters: Set<string>;
  activeTheme: string;
  colors: SubwayColors;
  onToggleFilter: (typeId: string) => void;
}

const SubwayLegend: React.FC<SubwayLegendProps> = ({
  stationTypes,
  activeFilters,
  activeTheme,
  colors,
  onToggleFilter,
}) => {
  return (
    <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar max-w-xl">
      {stationTypes.map((item) => {
        const isActive = activeFilters.has(item.id);
        const Shape = ShapeComponents[item.shape] || ShapeComponents.Circle;
        return (
          <button
            key={item.id}
            onClick={() => onToggleFilter(item.id)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-normal transition-all border whitespace-normal text-left leading-tight outline-none focus:ring-2 ring-blue-500/20 max-w-[100px]"
            style={{
              backgroundColor: isActive
                ? activeTheme === 'dark'
                  ? '#1e293b'
                  : '#f1f5f9'
                : 'transparent',
              borderColor: isActive ? colors.border : 'transparent',
              color: isActive ? colors.text : colors.textMuted,
            }}
          >
            {isActive && (
              <Check
                size={10}
                strokeWidth={3}
                className="text-current flex-shrink-0"
              />
            )}
            <svg
              width="10"
              height="10"
              className="overflow-visible flex-shrink-0"
              style={{
                color: isActive ? colors.text : colors.textMuted,
              }}
            >
              <Shape cx={5} cy={5} color="currentColor" active={false} />
            </svg>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SubwayLegend;
