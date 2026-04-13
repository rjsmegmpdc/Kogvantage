'use client';

import React from 'react';
import { type GanttTask, type GanttProject } from '@/constants/gantt';
import { differenceInCalendarDays, format } from 'date-fns';

interface TaskBarsProps {
  projects: GanttProject[];
  startDate: Date;
  pixelsPerDay: number;
  rowHeight: number;
  headerHeight: number;
  onProjectSelect: (id: string) => void;
  onTaskMouseDown: (e: React.MouseEvent, task: GanttTask, project: GanttProject, action: 'move' | 'resize-left' | 'resize-right') => void;
}

export const TaskBars: React.FC<TaskBarsProps> = ({
  projects,
  startDate,
  pixelsPerDay,
  rowHeight,
  headerHeight,
  onProjectSelect,
  onTaskMouseDown,
}) => {
  const getX = (date: Date) => {
    const diff = differenceInCalendarDays(date, startDate);
    return diff * pixelsPerDay;
  };

  const getWidth = (start: Date, end: Date) => {
    const diff = differenceInCalendarDays(end, start);
    return Math.max(diff * pixelsPerDay, 2);
  };

  let currentRow = 0;

  return (
    <svg className="absolute top-0 left-0 w-full h-full" style={{ top: headerHeight, zIndex: 10 }}>
      {projects.map((project) => {
        const projectY = currentRow * rowHeight;
        const projStart = getX(project.startDate);
        const projWidth = getWidth(project.startDate, project.endDate);

        // Calculate the total height of this project block (Project header + tasks)
        const projectBlockHeight = (1 + project.tasks.length) * rowHeight;

        const projectRow = (
          <g
            key={`group-${project.id}`}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onProjectSelect(project.id);
            }}
            className="group/proj cursor-pointer"
          >
            {/* Extended Invisible Hit Area for the entire project block */}
            <rect
              x={-5000}
              y={projectY}
              width="25000"
              height={projectBlockHeight}
              fill="white"
              fillOpacity="0"
              pointerEvents="all"
              className="group-hover/proj:fill-white/[0.02] transition-colors"
            />

            {/* Project Summary Header Row */}
            <g className="project-header">
              {/* Visual Bracket */}
              <path
                d={`M${projStart},${projectY + 28} h${projWidth} v-8 h-2 v6 h-${projWidth - 4} v-6 h-2 v8 z`}
                fill="var(--color-secondary, hsl(var(--secondary)))"
                className="opacity-40 pointer-events-none"
              />

              {/* Project Label */}
              <text
                x={projStart + 4}
                y={projectY + 20}
                fill="var(--color-text, hsl(var(--foreground)))"
                fontSize="11"
                fontWeight="700"
                className="pointer-events-none uppercase tracking-wider opacity-90 select-none"
              >
                {project.name}
              </text>

              {/* Metadata on Hover */}
              <text
                x={projStart + projWidth + 8}
                y={projectY + 20}
                fill="var(--color-muted, hsl(var(--muted-foreground)))"
                fontSize="9"
                className="opacity-0 group-hover/proj:opacity-100 transition-opacity pointer-events-none select-none"
              >
                {format(project.startDate, 'MMM d')} - {format(project.endDate, 'MMM d')} | Health: {project.health}%
              </text>

              {/* Status Indicator Dot */}
              <circle
                cx={projStart - 12}
                cy={projectY + 18}
                r="4"
                fill={
                  project.status === 'At Risk'
                    ? 'var(--color-danger, hsl(var(--destructive)))'
                    : project.status === 'Active'
                      ? 'var(--color-success, #22c55e)'
                      : 'var(--color-muted, hsl(var(--muted-foreground)))'
                }
                className="pointer-events-none"
              />
            </g>

            {/* Task Bars within the project block */}
            {(() => {
              let taskRowOffset = 1;
              return project.tasks.map((task) => {
                const taskX = getX(task.startDate);
                const taskW = getWidth(task.startDate, task.endDate);
                const taskY = projectY + taskRowOffset * rowHeight + 10;
                const barHeight = rowHeight - 20;

                const barColor =
                  project.status === 'At Risk'
                    ? '#ef4444'
                    : project.status === 'Completed'
                      ? '#22c55e'
                      : '#3b82f6';

                taskRowOffset++;

                return (
                  <g key={task.id} className="group/task">
                    <rect
                      x={taskX}
                      y={taskY}
                      width={taskW}
                      height={barHeight}
                      rx={4}
                      fill={barColor}
                      className="cursor-move hover:brightness-110 transition-all shadow-lg"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onTaskMouseDown(e, task, project, 'move');
                      }}
                    />
                    {/* Progress Overlay */}
                    <rect
                      x={taskX}
                      y={taskY}
                      width={taskW * (task.percentComplete / 100)}
                      height={barHeight}
                      rx={4}
                      fill="rgba(0,0,0,0.15)"
                      className="pointer-events-none"
                    />

                    {/* Resize Handles */}
                    <rect
                      x={taskX}
                      y={taskY}
                      width={8}
                      height={barHeight}
                      fill="white"
                      fillOpacity="0"
                      pointerEvents="all"
                      className="cursor-ew-resize hover:fill-white/20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onTaskMouseDown(e, task, project, 'resize-left');
                      }}
                    />
                    <rect
                      x={taskX + taskW - 8}
                      y={taskY}
                      width={8}
                      height={barHeight}
                      fill="white"
                      fillOpacity="0"
                      pointerEvents="all"
                      className="cursor-ew-resize hover:fill-white/20"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onTaskMouseDown(e, task, project, 'resize-right');
                      }}
                    />

                    <text
                      x={taskX + 8}
                      y={taskY + barHeight / 2 + 4}
                      fill="white"
                      fontSize="9"
                      fontWeight="600"
                      className="pointer-events-none truncate select-none shadow-sm"
                    >
                      {taskW > 40 ? task.name : ''}
                    </text>
                  </g>
                );
              });
            })()}
          </g>
        );

        currentRow += 1 + project.tasks.length;
        return projectRow;
      })}

      {/* Today Marker */}
      <line x1={getX(new Date())} y1={0} x2={getX(new Date())} y2="100%" stroke="#eab308" strokeWidth="2" strokeDasharray="6 3" />
      <rect x={getX(new Date()) - 20} y={0} width={40} height={14} fill="#eab308" rx={2} />
      <text x={getX(new Date())} y={10} fill="#0f172a" fontSize="8" fontWeight="900" textAnchor="middle">
        TODAY
      </text>
    </svg>
  );
};
