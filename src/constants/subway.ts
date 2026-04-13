// --- Subway Roadmap Configuration Constants ---

export const CONFIG = {
  TRACK_HEIGHT: 70,
  LANE_OFFSET: 40,
  PX_PER_DAY: 6,
  PADDING_X: 100,
  CURVE_INTENSITY: 60,
  BUFFER_MONTHS: 6,
} as const;

// --- Data Type Interfaces ---

export interface SubwayStop {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  type: string; // references station type id
  labelTop?: string;
  labelBottom?: string;
  description?: string;
  status?: string;
}

export interface SubwayLane {
  id: string;
  type: 'trunk' | 'sublane';
  mergeDate: string | null; // YYYY-MM-DD
  label: string;
  stops: SubwayStop[];
}

export interface SubwayRoute {
  id: string;
  categoryLabel: string;
  color: string; // hex
  lanes: SubwayLane[];
}

export interface StationType {
  id: string;
  label: string;
  shape: ShapeName;
}

export type ShapeName = 'Circle' | 'SmallCircle' | 'Diamond' | 'Square' | 'Person' | 'Star';

// --- Layout Calculation Types ---

export interface CalculatedLane extends SubwayLane {
  y: number;
  isTrunk: boolean;
  routeColor: string;
}

export interface CalculatedRoute extends Omit<SubwayRoute, 'lanes'> {
  y: number;
  height: number;
  lanes: CalculatedLane[];
}

export interface Layout {
  routes: CalculatedRoute[];
  totalHeight: number;
}

export interface HoveredStop {
  x: number;
  y: number;
  data: SubwayStop;
  parentLane: SubwayLane | CalculatedLane;
  parentRoute: SubwayRoute | CalculatedRoute;
}

export interface SelectedEntity {
  type: 'route' | 'lane';
  id: string;
}

export interface ActiveStation {
  stop: SubwayStop;
  lane: SubwayLane | CalculatedLane;
  route: SubwayRoute | CalculatedRoute;
}

export interface SubwayColors {
  bg: string;
  text: string;
  textMuted: string;
  grid: string;
  gridYear: string;
  stroke: string;
  panel: string;
  border: string;
  todayLine: string;
}

// --- Helper Functions ---

export const parseDate = (dateStr: string): Date => new Date(dateStr);

export const getDaysDiff = (d1: Date, d2: Date): number =>
  (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);

export const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};
