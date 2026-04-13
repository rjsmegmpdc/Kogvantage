'use client';

import type { GanttProject, GanttTask } from '@/constants/gantt';

/**
 * Generates mock Gantt data for development.
 * In production, this will be replaced by tRPC queries to SQLite.
 */
export function generateMockGanttData(): GanttProject[] {
  const now = new Date();
  const projectNames = [
    'Platform Modernization',
    'Security Enhancement',
    'Cloud Migration',
    'UX Redesign',
    'API Gateway',
    'Data Pipeline',
    'Mobile App v2',
    'DevOps Automation',
  ];

  const statuses = ['Active', 'Active', 'Active', 'At Risk', 'Planned', 'Completed', 'Active', 'Planned'];
  const taskTemplates = [
    ['Discovery', 'Requirements', 'Design', 'Development', 'Testing', 'Deployment'],
    ['Assessment', 'Planning', 'Implementation', 'Validation'],
    ['Analysis', 'Architecture', 'Build', 'Migration', 'Verification'],
  ];

  return projectNames.map((name, i) => {
    const startOffset = -60 + i * 30;
    const projectStart = addDays(now, startOffset);
    const projectEnd = addDays(projectStart, 120 + Math.floor(Math.random() * 120));
    const tasks = taskTemplates[i % taskTemplates.length];
    const taskDuration = Math.floor(
      (projectEnd.getTime() - projectStart.getTime()) / (tasks.length * 86400000)
    );

    const ganttTasks: GanttTask[] = tasks.map((taskName, j) => {
      const taskStart = addDays(projectStart, j * taskDuration);
      const taskEnd = addDays(taskStart, taskDuration - 1);
      return {
        id: `task-${i}-${j}`,
        projectId: `project-${i}`,
        name: taskName,
        startDate: taskStart,
        endDate: taskEnd,
        percentComplete: Math.min(100, Math.max(0, Math.floor(Math.random() * 100))),
        dependencies: j > 0 ? [`task-${i}-${j - 1}`] : [],
      };
    });

    return {
      id: `project-${i}`,
      name,
      status: statuses[i],
      startDate: projectStart,
      endDate: projectEnd,
      budget: 500000 + Math.floor(Math.random() * 2000000),
      spent: Math.floor(Math.random() * 1500000),
      health: 40 + Math.floor(Math.random() * 60),
      tasks: ganttTasks,
    };
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
