'use client';

import React from 'react';
import { type GanttProject } from '@/constants/gantt';
import { differenceInCalendarDays } from 'date-fns';

interface DependencyLinesProps {
  projects: GanttProject[];
  startDate: Date;
  pixelsPerDay: number;
  rowHeight: number;
  headerHeight: number;
}

export const DependencyLines: React.FC<DependencyLinesProps> = ({ projects, startDate, pixelsPerDay, rowHeight, headerHeight }) => {
  const taskMap = new Map<string, { x: number; y: number; w: number }>();

  let currentRow = 0;
  projects.forEach(p => {
    currentRow++; // Project header
    p.tasks.forEach(t => {
      const x = differenceInCalendarDays(t.startDate, startDate) * pixelsPerDay;
      const w = differenceInCalendarDays(t.endDate, t.startDate) * pixelsPerDay;
      const y = headerHeight + (currentRow * rowHeight) + (rowHeight / 2);
      taskMap.set(t.id, { x, y, w });
      currentRow++;
    });
  });

  const lines: React.ReactElement[] = [];

  projects.forEach(p => {
    p.tasks.forEach(t => {
      if (t.dependencies) {
        t.dependencies.forEach(depId => {
          const source = taskMap.get(depId);
          const target = taskMap.get(t.id);

          if (source && target) {
            const startX = source.x + source.w;
            const startY = source.y;
            const endX = target.x;
            const endY = target.y;

            // Bezier Curve
            const controlPointX1 = startX + 20;
            const controlPointX2 = endX - 20;
            const d = `M ${startX} ${startY} C ${controlPointX1} ${startY}, ${controlPointX2} ${endY}, ${endX} ${endY}`;

            lines.push(
              <path
                key={`${depId}-${t.id}`}
                d={d}
                stroke="var(--color-muted, hsl(var(--muted-foreground)))"
                strokeWidth="1.5"
                fill="none"
                opacity="0.5"
                markerEnd="url(#arrowhead)"
              />
            );
          }
        });
      }
    });
  });

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="var(--color-muted, hsl(var(--muted-foreground)))" />
        </marker>
      </defs>
      {lines}
    </svg>
  );
};
