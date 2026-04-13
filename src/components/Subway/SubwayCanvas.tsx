'use client';

import React from 'react';
import { ShapeComponents } from './StationMarker';
import {
  CONFIG,
  parseDate,
  type Layout,
  type CalculatedRoute,
  type CalculatedLane,
  type SubwayStop,
  type SubwayLane,
  type SubwayRoute,
  type StationType,
  type HoveredStop,
  type SubwayColors,
} from '@/constants/subway';

interface SubwayCanvasProps {
  layout: Layout;
  totalDays: number;
  todayX: number;
  minDate: Date;
  maxDate: Date;
  timeAxis: Date[];
  colors: SubwayColors;
  activeTheme: string;
  stationTypes: StationType[];
  activeFilters: Set<string>;
  hoveredRouteId: string | null;
  hoveredLaneId: string | null;
  hoveredStop: HoveredStop | null;
  targetRouteId: string | null;
  targetLaneId: string | null;
  isDragging: boolean;
  getX: (dateStr: string) => number;
  onRouteMouseEnter: (routeId: string) => void;
  onRouteMouseLeave: () => void;
  onRouteClick: (e: React.MouseEvent, routeId: string) => void;
  onLaneMouseEnter: (e: React.MouseEvent, laneId: string) => void;
  onLaneMouseLeave: (e: React.MouseEvent) => void;
  onLaneClick: (e: React.MouseEvent, laneId: string) => void;
  onStopMouseEnter: (
    e: React.MouseEvent,
    stop: SubwayStop,
    lane: CalculatedLane,
    route: CalculatedRoute
  ) => void;
  onStopMouseLeave: () => void;
  onStopDoubleClick: (
    e: React.MouseEvent,
    stop: SubwayStop,
    lane: CalculatedLane,
    route: CalculatedRoute
  ) => void;
}

const SubwayCanvas: React.FC<SubwayCanvasProps> = ({
  layout,
  totalDays,
  todayX,
  minDate,
  maxDate,
  timeAxis,
  colors,
  activeTheme,
  stationTypes,
  activeFilters,
  hoveredStop,
  targetRouteId,
  targetLaneId,
  isDragging,
  getX,
  onRouteMouseEnter,
  onRouteMouseLeave,
  onRouteClick,
  onLaneMouseEnter,
  onLaneMouseLeave,
  onLaneClick,
  onStopMouseEnter,
  onStopMouseLeave,
  onStopDoubleClick,
}) => {
  const svgWidth = Math.max(
    typeof window !== 'undefined' ? window.innerWidth : 1280,
    CONFIG.PADDING_X * 2 + totalDays * CONFIG.PX_PER_DAY
  );
  const svgHeight = Math.max(
    (typeof window !== 'undefined' ? window.innerHeight : 800) - 100,
    layout.totalHeight + 50
  );

  return (
    <svg width={svgWidth} height={svgHeight} className="block">
      {/* Grid & Axis */}
      <g className="select-none pointer-events-none">
        <line
          x1={todayX}
          x2={todayX}
          y1={0}
          y2={layout.totalHeight + 50}
          stroke={colors.todayLine}
          strokeWidth="1"
          strokeDasharray="4 4"
          className="opacity-50"
        />
        <text
          x={todayX}
          y={20}
          textAnchor="middle"
          fill={colors.todayLine}
          className="text-[10px] font-bold uppercase tracking-widest"
        >
          Today
        </text>

        {timeAxis.map((date, i) => {
          const x = getX(date.toISOString().slice(0, 10));
          const isYear = date.getMonth() === 0;
          return (
            <g key={`tick-${i}`} transform={`translate(${x}, 0)`}>
              <line
                y1="30"
                y2={layout.totalHeight + 40}
                stroke={isYear ? colors.gridYear : colors.grid}
                strokeWidth={isYear ? 2 : 1}
                strokeDasharray={isYear ? '' : '4 4'}
              />
              <text
                y={25}
                textAnchor="middle"
                fill={isYear ? colors.text : colors.textMuted}
                className={`text-[10px] ${isYear ? 'font-bold text-xs' : ''}`}
              >
                {date.toLocaleDateString('en-US', {
                  month: 'short',
                  year: isYear ? 'numeric' : undefined,
                })}
              </text>
            </g>
          );
        })}
      </g>

      {/* Routes */}
      {layout.routes.map((route) => {
        const isDimmed = targetRouteId != null && targetRouteId !== route.id;

        return (
          <g
            key={route.id}
            className={`transition-opacity duration-300 ${isDimmed ? 'opacity-20' : 'opacity-100'}`}
            onMouseEnter={() => !isDragging && onRouteMouseEnter(route.id)}
            onMouseLeave={() => onRouteMouseLeave()}
            onClick={(e) => onRouteClick(e, route.id)}
            style={{ cursor: 'pointer' }}
          >
            {/* Hit Area for Group Hover Consistency */}
            <rect
              x={0}
              y={route.y - 30}
              width={svgWidth}
              height={route.height + 20}
              fill="transparent"
            />

            {/* Category Label */}
            <foreignObject
              x={20}
              y={route.y - 16}
              width="200"
              height="30"
              className="pointer-events-none"
            >
              <div className="sticky left-4 inline-block">
                <div
                  className="backdrop-blur px-2 py-0.5 rounded border text-[11px] font-bold shadow-sm"
                  style={{
                    backgroundColor:
                      activeTheme === 'dark'
                        ? 'rgba(15,23,42,0.8)'
                        : 'rgba(255,255,255,0.9)',
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  {route.categoryLabel}
                </div>
              </div>
            </foreignObject>

            {/* Lanes */}
            {route.lanes.map((lane) => {
              const isLaneDimmed =
                targetLaneId != null && targetLaneId !== lane.id;
              const opacityClass = isLaneDimmed ? 'opacity-40' : 'opacity-100';

              const startX =
                getX(
                  lane.stops
                    .reduce((min: Date, s) => {
                      const d = parseDate(s.startDate);
                      return d < min ? d : min;
                    }, new Date('2099-01-01'))
                    .toISOString()
                    .split('T')[0]
                ) - 80;
              const endX = lane.mergeDate
                ? getX(lane.mergeDate)
                : getX(maxDate.toISOString().split('T')[0]);

              let pathD = '';
              if (lane.isTrunk) {
                pathD = `M ${minDate ? 0 : startX},${lane.y} L ${endX},${lane.y}`;
              } else {
                const trunkLane = route.lanes.find((l) => l.isTrunk);
                const trunkY = trunkLane ? trunkLane.y : lane.y;
                const cX = endX - CONFIG.CURVE_INTENSITY;
                pathD = `M ${startX},${lane.y} L ${endX - CONFIG.CURVE_INTENSITY * 1.5},${lane.y} C ${cX},${lane.y} ${cX},${trunkY} ${endX},${trunkY}`;
              }

              return (
                <g
                  key={lane.id}
                  className={`transition-opacity duration-300 ${opacityClass}`}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    if (!isDragging) onLaneMouseEnter(e, lane.id);
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    onLaneMouseLeave(e);
                  }}
                  onClick={(e) => onLaneClick(e, lane.id)}
                >
                  {!lane.isTrunk && lane.label && (
                    <text
                      x={startX}
                      y={lane.y - 8}
                      className="text-[9px] font-bold tracking-wider uppercase"
                      fill={colors.textMuted}
                    >
                      {lane.label}
                    </text>
                  )}

                  <path
                    d={pathD}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm hover:stroke-[8] transition-all"
                  />

                  {!lane.isTrunk && lane.mergeDate && (
                    <circle
                      cx={endX}
                      cy={
                        (route.lanes.find((l) => l.isTrunk) ?? lane).y
                      }
                      r="3"
                      fill={colors.bg}
                      stroke={route.color}
                      strokeWidth="2"
                    />
                  )}

                  {/* Stops */}
                  {lane.stops.map((stop) => {
                    if (!activeFilters.has(stop.type)) return null;
                    const cx = getX(stop.startDate);
                    const cy = lane.y;
                    const typeDef = stationTypes.find(
                      (t) => t.id === stop.type
                    );
                    const ShapeComponent = typeDef
                      ? ShapeComponents[typeDef.shape] ||
                        ShapeComponents.Circle
                      : ShapeComponents.Circle;

                    let durationWidth = 0;
                    if (stop.endDate)
                      durationWidth = getX(stop.endDate) - cx;
                    const isActive =
                      hoveredStop != null &&
                      hoveredStop.data.id === stop.id;

                    return (
                      <g
                        key={stop.id}
                        className="cursor-pointer group"
                        onMouseEnter={(e) => {
                          if (isDragging) return;
                          const rect = (
                            e.target as SVGElement
                          ).getBoundingClientRect();
                          onStopMouseEnter(
                            e,
                            stop,
                            lane,
                            route
                          );
                        }}
                        onMouseLeave={() => onStopMouseLeave()}
                        onDoubleClick={(e) =>
                          onStopDoubleClick(e, stop, lane, route)
                        }
                      >
                        {stop.endDate && (
                          <rect
                            x={cx}
                            y={cy - 6}
                            width={durationWidth}
                            height={12}
                            rx={6}
                            fill={route.color}
                            className="opacity-30"
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={20}
                          fill="transparent"
                        />
                        <g style={{ color: colors.stroke }}>
                          <ShapeComponent
                            cx={cx}
                            cy={cy}
                            color={route.color}
                            active={isActive}
                            dimmed={false}
                          />
                        </g>
                        {stop.labelTop && (
                          <text
                            x={cx}
                            y={cy - 20}
                            textAnchor="middle"
                            fill={
                              isActive
                                ? colors.text
                                : colors.textMuted
                            }
                            className={`text-[9px] font-medium transition-all ${isActive ? 'scale-110 font-bold -translate-y-1' : ''}`}
                          >
                            {stop.labelTop}
                          </text>
                        )}
                        {stop.labelBottom && (
                          <text
                            x={cx}
                            y={cy + 24}
                            textAnchor="middle"
                            fill={
                              isActive
                                ? colors.text
                                : colors.textMuted
                            }
                            className={`text-[9px] font-medium transition-all ${isActive ? 'scale-110 font-bold translate-y-1' : ''}`}
                          >
                            {stop.labelBottom}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

export default SubwayCanvas;
