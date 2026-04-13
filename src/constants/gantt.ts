export type ZoomLevel = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year';

export const ZOOM_CONFIG: Record<ZoomLevel, { pixelsPerDay: number; headerFormat: string; subHeaderFormat: string }> = {
  Day: { pixelsPerDay: 40, headerFormat: 'MMMM yyyy', subHeaderFormat: 'd' },
  Week: { pixelsPerDay: 10, headerFormat: 'MMMM yyyy', subHeaderFormat: "'W'w" },
  Month: { pixelsPerDay: 2, headerFormat: 'yyyy', subHeaderFormat: 'MMM' },
  Quarter: { pixelsPerDay: 0.5, headerFormat: 'yyyy', subHeaderFormat: "'Q'Q" },
  Year: { pixelsPerDay: 0.1, headerFormat: 'yyyy', subHeaderFormat: 'yyyy' },
};

export const GANTT_ROW_HEIGHT = 44;

export interface GanttProject {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  health: number;
  tasks: GanttTask[];
}

export interface GanttTask {
  id: string;
  projectId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  percentComplete: number;
  dependencies: string[];
}
