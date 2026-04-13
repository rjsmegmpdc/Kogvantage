'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { type GanttProject, type GanttTask, type ZoomLevel, ZOOM_CONFIG, GANTT_ROW_HEIGHT } from '@/constants/gantt';
import { TimelineHeader } from './TimelineHeader';
import { TaskBars } from './TaskBars';
import { DependencyLines } from './DependencyLines';
import { addYears, subMonths, differenceInCalendarDays, addDays, startOfDay } from 'date-fns';

export interface GanttViewProps {
  projects: GanttProject[];
  onTaskUpdate: (projectId: string, taskId: string, updates: Partial<GanttTask>) => void;
  zoomLevel: ZoomLevel;
  onZoomChange: (zoom: string) => void;
}

interface DragState {
  type: 'move' | 'resize-left' | 'resize-right';
  task: GanttTask;
  project: GanttProject;
  initialX: number;
  initialStartDate: Date;
  initialEndDate: Date;
}

export const GanttView: React.FC<GanttViewProps> = ({ projects, onTaskUpdate, zoomLevel, onZoomChange }) => {
  const [viewStart] = useState(() => startOfDay(subMonths(new Date(), 12)));
  const [viewEnd] = useState(() => addYears(new Date(), 5));

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const startPanX = useRef(0);
  const startPanY = useRef(0);
  const scrollLeftStart = useRef(0);
  const scrollTopStart = useRef(0);

  const [dragState, setDragState] = useState<DragState | null>(null);

  const pixelsPerDay = ZOOM_CONFIG[zoomLevel].pixelsPerDay;
  const ROW_HEIGHT = GANTT_ROW_HEIGHT;

  const totalRows = useMemo(() => projects.reduce((acc, p) => acc + 1 + p.tasks.length, 0), [projects]);
  const totalHeight = totalRows * ROW_HEIGHT;

  const handleTaskMouseDown = useCallback(
    (e: React.MouseEvent, task: GanttTask, project: GanttProject, action: 'move' | 'resize-left' | 'resize-right') => {
      setDragState({
        type: action,
        task,
        project,
        initialX: e.clientX,
        initialStartDate: new Date(task.startDate),
        initialEndDate: new Date(task.endDate),
      });
    },
    []
  );

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const deltaPixels = e.clientX - dragState.initialX;
      const deltaDays = Math.round(deltaPixels / pixelsPerDay);

      if (deltaDays === 0 && dragState.type !== 'move') return;

      let newStart = startOfDay(new Date(dragState.initialStartDate));
      let newEnd = startOfDay(new Date(dragState.initialEndDate));

      if (dragState.type === 'move') {
        newStart = addDays(dragState.initialStartDate, deltaDays);
        newEnd = addDays(dragState.initialEndDate, deltaDays);
      } else if (dragState.type === 'resize-left') {
        newStart = addDays(dragState.initialStartDate, deltaDays);
        if (newStart >= newEnd) newStart = addDays(newEnd, -1);
      } else if (dragState.type === 'resize-right') {
        newEnd = addDays(dragState.initialEndDate, deltaDays);
        if (newEnd <= newStart) newEnd = addDays(newStart, 1);
      }

      onTaskUpdate(dragState.project.id, dragState.task.id, {
        startDate: newStart,
        endDate: newEnd,
      });
    };

    const handleWindowMouseUp = () => {
      if (dragState) setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, pixelsPerDay, onTaskUpdate]);

  // Right-click pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 && scrollContainerRef.current) {
      e.preventDefault();
      isPanning.current = true;
      startPanX.current = e.pageX;
      startPanY.current = e.pageY;
      scrollLeftStart.current = scrollContainerRef.current.scrollLeft;
      scrollTopStart.current = scrollContainerRef.current.scrollTop;
      scrollContainerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current && scrollContainerRef.current) {
      const dx = e.pageX - startPanX.current;
      const dy = e.pageY - startPanY.current;
      scrollContainerRef.current.scrollLeft = scrollLeftStart.current - dx;
      scrollContainerRef.current.scrollTop = scrollTopStart.current - dy;
    }
  };

  const handleMouseUp = () => {
    if (isPanning.current && scrollContainerRef.current) {
      isPanning.current = false;
      scrollContainerRef.current.style.cursor = 'default';
    }
  };

  // Scroll to today on mount / zoom change
  useEffect(() => {
    if (scrollContainerRef.current) {
      const today = new Date();
      const daysFromStart = differenceInCalendarDays(today, viewStart);
      const todayX = daysFromStart * pixelsPerDay;
      scrollContainerRef.current.scrollLeft = todayX - scrollContainerRef.current.clientWidth / 2;
    }
  }, [pixelsPerDay, viewStart]);

  // No-op project select for now (double-click on project header)
  const handleProjectSelect = useCallback((_id: string) => {
    // Will be wired to navigation / detail panel later
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--color-background,hsl(var(--background)))] overflow-hidden">
      <div
        className="flex-1 overflow-auto relative select-none outline-none"
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="relative min-w-full" style={{ width: 'max-content' }}>
          <div className="sticky top-0 z-20 shadow-md">
            <TimelineHeader
              startDate={viewStart}
              endDate={viewEnd}
              zoomLevel={zoomLevel}
              pixelsPerDay={pixelsPerDay}
            />
          </div>

          <div className="relative" style={{ height: totalHeight }}>
            {/* Grid Stripes */}
            {Array.from({ length: totalRows }).map((_, i) => (
              <div
                key={i}
                className="w-full border-b border-[var(--color-border,hsl(var(--border)))]/40"
                style={{
                  height: ROW_HEIGHT,
                  backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                }}
              />
            ))}

            <DependencyLines
              projects={projects}
              startDate={viewStart}
              pixelsPerDay={pixelsPerDay}
              rowHeight={ROW_HEIGHT}
              headerHeight={0}
            />

            <TaskBars
              projects={projects}
              startDate={viewStart}
              pixelsPerDay={pixelsPerDay}
              rowHeight={ROW_HEIGHT}
              headerHeight={0}
              onProjectSelect={handleProjectSelect}
              onTaskMouseDown={handleTaskMouseDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
