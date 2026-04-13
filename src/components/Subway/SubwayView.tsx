'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Calendar, Settings, Trash2, Moon, Sun, Monitor, AlertCircle } from 'lucide-react';
import {
  CONFIG,
  parseDate,
  getDaysDiff,
  addMonths,
  type SubwayRoute,
  type SubwayStop,
  type SubwayLane,
  type StationType,
  type SubwayColors,
  type Layout,
  type CalculatedRoute,
  type CalculatedLane,
  type HoveredStop,
  type SelectedEntity,
  type ActiveStation,
} from '@/constants/subway';
import { ShapeComponents } from './StationMarker';
import SubwayCanvas from './SubwayCanvas';
import SubwayLegend from './SubwayLegend';
import StationTooltip from './StationTooltip';
import StationEditModal from './StationEditModal';
import AddStationModal from './AddStationModal';

// --- SubwayView Props ---

export interface SubwayViewProps {
  routes: SubwayRoute[];
  stationTypes: StationType[];
  onStopUpdate: (
    routeId: string,
    laneId: string,
    stopId: string,
    updates: Partial<SubwayStop>
  ) => void;
  onStopAdd: (
    routeId: string,
    laneId: string,
    stop: Omit<SubwayStop, 'id'>
  ) => void;
  onRouteAdd: (route: { categoryLabel: string; color: string }) => void;
  onRouteDelete: (routeId: string) => void;
  onTypeAdd: (type: { label: string; shape: string }) => void;
  onTypeDelete: (typeId: string) => void;
}

// --- Component ---

const SubwayView: React.FC<SubwayViewProps> = ({
  routes,
  stationTypes,
  onStopUpdate,
  onStopAdd,
  onRouteAdd,
  onRouteDelete,
  onTypeAdd,
  onTypeDelete,
}) => {
  // UI State
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [hoveredLaneId, setHoveredLaneId] = useState<string | null>(null);
  const [hoveredStop, setHoveredStop] = useState<HoveredStop | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(stationTypes.map((i) => i.id))
  );
  const [isCentered, setIsCentered] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'route' | 'type';
    id: string;
  } | null>(null);
  const [activeStation, setActiveStation] = useState<ActiveStation | null>(null);

  // Selection State
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  // Drag Scroll State
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const mouseDownPos = useRef({ x: 0, y: 0 });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Settings State
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');

  // Settings Form States
  const [newRoute, setNewRoute] = useState({ label: '', color: '#3b82f6' });
  const [newType, setNewType] = useState({ id: '', label: '', shape: 'Circle' });

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Theme Logic ---
  useEffect(() => {
    const applyTheme = () => {
      let effectiveTheme: 'light' | 'dark' = themeMode === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : themeMode;

      setActiveTheme(effectiveTheme);

      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    };

    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (themeMode === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [themeMode]);

  const colors = useMemo<SubwayColors>(() => {
    const isDark = activeTheme === 'dark';
    return {
      bg: isDark ? '#020617' : '#ffffff',
      text: isDark ? '#f8fafc' : '#0f172a',
      textMuted: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? '#1e293b' : '#f1f5f9',
      gridYear: isDark ? '#334155' : '#cbd5e1',
      stroke: isDark ? '#f8fafc' : '#ffffff',
      panel: isDark ? '#0f172a' : '#ffffff',
      border: isDark ? '#1e293b' : '#e2e8f0',
      todayLine: '#ef4444',
    };
  }, [activeTheme]);

  // --- Calculations ---
  const { minDate, maxDate, totalDays, todayX } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let minT = today.getTime();
    let maxT = today.getTime();

    routes.forEach((route) => {
      route.lanes.forEach((lane) => {
        if (lane.mergeDate) {
          const md = parseDate(lane.mergeDate).getTime();
          if (md > maxT) maxT = md;
          if (md < minT) minT = md;
        }
        lane.stops.forEach((stop) => {
          const sd = parseDate(stop.startDate).getTime();
          if (sd < minT) minT = sd;
          if (sd > maxT) maxT = sd;
          if (stop.endDate) {
            const ed = parseDate(stop.endDate).getTime();
            if (ed > maxT) maxT = ed;
          }
        });
      });
    });

    const minD = addMonths(new Date(minT), -CONFIG.BUFFER_MONTHS);
    const maxD = addMonths(new Date(maxT), CONFIG.BUFFER_MONTHS);
    const diffDays = getDaysDiff(maxD, minD);
    const todayDiff = getDaysDiff(today, minD);
    const tX = CONFIG.PADDING_X + todayDiff * CONFIG.PX_PER_DAY;

    return { minDate: minD, maxDate: maxD, totalDays: diffDays, todayX: tX };
  }, [routes]);

  const getX = useCallback(
    (dateStr: string): number => {
      if (!dateStr) return 0;
      const date = parseDate(dateStr);
      const diff = getDaysDiff(date, minDate);
      return CONFIG.PADDING_X + diff * CONFIG.PX_PER_DAY;
    },
    [minDate]
  );

  const layout = useMemo<Layout>(() => {
    let currentY = 60;
    const calculatedRoutes: CalculatedRoute[] = [];

    routes.forEach((route) => {
      const routeY = currentY;
      const calculatedLanes: CalculatedLane[] = route.lanes.map((lane, index) => {
        const isTrunk = lane.type === 'trunk';
        const laneY = routeY + (isTrunk ? 0 : index * CONFIG.LANE_OFFSET);
        return { ...lane, y: laneY, isTrunk, routeColor: route.color };
      });
      const routeHeight = Math.max(
        CONFIG.TRACK_HEIGHT,
        route.lanes.length * CONFIG.LANE_OFFSET
      );
      calculatedRoutes.push({
        ...route,
        y: routeY,
        height: routeHeight,
        lanes: calculatedLanes,
      });
      currentY += routeHeight + 60;
    });

    return { routes: calculatedRoutes, totalHeight: currentY };
  }, [routes]);

  const timeAxis = useMemo<Date[]>(() => {
    const ticks: Date[] = [];
    const current = new Date(minDate);
    current.setDate(1);
    while (current <= maxDate) {
      ticks.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return ticks;
  }, [minDate, maxDate]);

  // --- Dimming Logic ---
  const targetRouteId = useMemo<string | null>(() => {
    if (hoveredRouteId) return hoveredRouteId;
    if (hoveredLaneId) {
      return routes.find((r) => r.lanes.some((l) => l.id === hoveredLaneId))?.id ?? null;
    }
    if (selectedEntity?.type === 'route') return selectedEntity.id;
    if (selectedEntity?.type === 'lane') {
      return routes.find((r) => r.lanes.some((l) => l.id === selectedEntity.id))?.id ?? null;
    }
    return null;
  }, [selectedEntity, hoveredRouteId, hoveredLaneId, routes]);

  const targetLaneId = useMemo<string | null>(() => {
    if (hoveredLaneId) return hoveredLaneId;
    if (selectedEntity?.type === 'lane') return selectedEntity.id;
    return null;
  }, [selectedEntity, hoveredLaneId]);

  // --- Scroll to Today on first mount ---
  useEffect(() => {
    if (containerRef.current && !isCentered && todayX > 0) {
      const container = containerRef.current;
      const scrollPos = todayX - container.clientWidth / 2;
      requestAnimationFrame(() => {
        container.scrollTo({ left: scrollPos, behavior: 'auto' });
        setIsCentered(true);
      });
    }
  }, [todayX, isCentered, layout.totalHeight]);

  // --- Drag & Click Handlers ---
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft ?? 0));
    setScrollLeftState(containerRef.current?.scrollLeft ?? 0);
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseLeave = () => {
    if (isDragging) setIsDragging(false);
    setHoveredRouteId(null);
    setHoveredLaneId(null);
  };

  const onMouseUp = () => {
    if (isDragging) setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current?.offsetLeft ?? 0);
    const walk = x - startX;
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollLeftState - walk;
    }
  };

  const onContainerClick = (e: React.MouseEvent) => {
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    if (dx < 5 && dy < 5) {
      setSelectedEntity(null);
      setHoveredRouteId(null);
      setHoveredLaneId(null);
    }
  };

  const handleRouteClick = (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    if (dx > 5 || dy > 5) return;

    if (selectedEntity?.id === routeId) {
      setSelectedEntity(null);
    } else {
      setSelectedEntity({ type: 'route', id: routeId });
    }
  };

  const handleLaneClick = (e: React.MouseEvent, laneId: string) => {
    e.stopPropagation();
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    if (dx > 5 || dy > 5) return;

    if (selectedEntity?.id === laneId) {
      setSelectedEntity(null);
    } else {
      setSelectedEntity({ type: 'lane', id: laneId });
    }
  };

  const handleStationDoubleClick = (
    e: React.MouseEvent,
    stop: SubwayStop,
    lane: CalculatedLane,
    route: CalculatedRoute
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveStation({ stop, lane, route });
  };

  // --- Data Update Handlers ---
  const handleSaveStation = (updatedStop: SubwayStop) => {
    onStopUpdate(
      activeStation!.route.id,
      activeStation!.lane.id,
      updatedStop.id,
      updatedStop
    );
    setActiveStation(null);
  };

  const handleStopAdd = (
    routeId: string,
    laneId: string,
    stop: Omit<SubwayStop, 'id'>
  ) => {
    onStopAdd(routeId, laneId, stop);
  };

  // --- Filter toggle ---
  const toggleFilter = (typeId: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(typeId)) newFilters.delete(typeId);
    else newFilters.add(typeId);
    setActiveFilters(newFilters);
  };

  // --- Settings actions ---
  const handleAddRoute = () => {
    if (!newRoute.label) return;
    onRouteAdd({ categoryLabel: newRoute.label, color: newRoute.color });
    setNewRoute({ label: '', color: '#3b82f6' });
  };

  const confirmDeleteRoute = (routeId: string) => {
    onRouteDelete(routeId);
    setDeleteConfirm(null);
  };

  const handleAddType = () => {
    if (!newType.label) return;
    onTypeAdd({ label: newType.label, shape: newType.shape });
    const id = newType.label.toLowerCase().replace(/\s+/g, '');
    setActiveFilters(new Set([...activeFilters, id]));
    setNewType({ id: '', label: '', shape: 'Circle' });
  };

  const confirmDeleteType = (typeId: string) => {
    onTypeDelete(typeId);
    setDeleteConfirm(null);
  };

  // --- Stop hover handler (needs bounding rect) ---
  const handleStopMouseEnter = (
    e: React.MouseEvent,
    stop: SubwayStop,
    lane: CalculatedLane,
    route: CalculatedRoute
  ) => {
    if (isDragging) return;
    const rect = (e.target as SVGElement).getBoundingClientRect();
    setHoveredStop({
      x: rect.left,
      y: rect.top,
      data: stop,
      parentLane: lane,
      parentRoute: route,
    });
  };

  return (
    <div
      className="flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Header */}
      <header
        className="flex-none px-6 py-3 border-b z-20 flex items-center justify-between shadow-sm h-16 transition-colors duration-300"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight leading-tight">
              Infrastructure Roadmap
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">
              2024-2025
            </span>
          </div>

          <div
            className="h-8 w-px mx-2 hidden md:block"
            style={{ backgroundColor: colors.border }}
          />

          {/* Interactive Legend */}
          <SubwayLegend
            stationTypes={stationTypes}
            activeFilters={activeFilters}
            activeTheme={activeTheme}
            colors={colors}
            onToggleFilter={toggleFilter}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (containerRef.current) {
                const scrollPos =
                  todayX - containerRef.current.clientWidth / 2;
                containerRef.current.scrollTo({
                  left: scrollPos,
                  behavior: 'smooth',
                });
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors opacity-70 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Calendar size={14} />
            <span className="hidden sm:inline">Today</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-md transition-colors opacity-70 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Hero Chart Area */}
      <main
        className="flex-1 overflow-x-auto overflow-y-auto relative cursor-grab active:cursor-grabbing custom-scrollbar transition-colors duration-300"
        style={{
          backgroundColor: activeTheme === 'dark' ? '#0f172a' : '#f8fafc',
        }}
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onClick={onContainerClick}
      >
        <div className="min-w-max p-8 pb-20 relative h-full">
          <SubwayCanvas
            layout={layout}
            totalDays={totalDays}
            todayX={todayX}
            minDate={minDate}
            maxDate={maxDate}
            timeAxis={timeAxis}
            colors={colors}
            activeTheme={activeTheme}
            stationTypes={stationTypes}
            activeFilters={activeFilters}
            hoveredRouteId={hoveredRouteId}
            hoveredLaneId={hoveredLaneId}
            hoveredStop={hoveredStop}
            targetRouteId={targetRouteId}
            targetLaneId={targetLaneId}
            isDragging={isDragging}
            getX={getX}
            onRouteMouseEnter={setHoveredRouteId}
            onRouteMouseLeave={() => setHoveredRouteId(null)}
            onRouteClick={handleRouteClick}
            onLaneMouseEnter={(_e, laneId) => setHoveredLaneId(laneId)}
            onLaneMouseLeave={() => setHoveredLaneId(null)}
            onLaneClick={handleLaneClick}
            onStopMouseEnter={handleStopMouseEnter}
            onStopMouseLeave={() => setHoveredStop(null)}
            onStopDoubleClick={handleStationDoubleClick}
          />
        </div>
      </main>

      {/* Station Detail Modal (Double Click) */}
      {activeStation && (
        <StationEditModal
          activeStation={activeStation}
          stationTypes={stationTypes}
          colors={colors}
          onClose={() => setActiveStation(null)}
          onSave={handleSaveStation}
        />
      )}

      {/* Add Station Modal */}
      {isAddModalOpen && (
        <AddStationModal
          routes={routes}
          stationTypes={stationTypes}
          activeTheme={activeTheme}
          colors={colors}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleStopAdd}
        />
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
          <div
            className="rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border flex flex-col max-h-[85vh]"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            <div
              className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50"
              style={{ borderColor: colors.border }}
            >
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings size={20} /> Settings
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                style={{ color: colors.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Theme Settings */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-4">
                  Appearance
                </h4>
                <div
                  className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg inline-flex"
                  style={{ border: `1px solid ${colors.border}` }}
                >
                  {(
                    [
                      { id: 'light' as const, icon: Sun, label: 'Light' },
                      { id: 'dark' as const, icon: Moon, label: 'Dark' },
                      { id: 'system' as const, icon: Monitor, label: 'System' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setThemeMode(mode.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        themeMode === mode.id
                          ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <mode.icon size={14} /> {mode.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Route Management */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-4">
                  Routes List
                </h4>
                <div className="space-y-3 mb-4">
                  {routes.map((route) => {
                    const isDeleting =
                      deleteConfirm?.type === 'route' &&
                      deleteConfirm?.id === route.id;
                    return (
                      <div
                        key={route.id}
                        className="flex items-center justify-between p-3 border rounded-lg transition-colors"
                        style={{
                          borderColor: colors.border,
                          backgroundColor: isDeleting
                            ? activeTheme === 'dark'
                              ? '#450a0a'
                              : '#fef2f2'
                            : 'transparent',
                        }}
                      >
                        {isDeleting ? (
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
                              <AlertCircle size={16} />
                              <span>Delete &quot;{route.categoryLabel}&quot;?</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmDeleteRoute(route.id)}
                                className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1.5 rounded text-xs font-medium hover:bg-black/10 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <span
                                className="w-4 h-4 rounded-full shadow-sm"
                                style={{ backgroundColor: route.color }}
                              />
                              <span className="font-medium text-sm">
                                {route.categoryLabel}
                              </span>
                              <span className="text-xs opacity-50">
                                (
                                {route.lanes.reduce(
                                  (acc, l) => acc + l.stops.length,
                                  0
                                )}{' '}
                                stops)
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setDeleteConfirm({ type: 'route', id: route.id })
                              }
                              className="opacity-50 hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 p-2 rounded transition-all"
                              title="Delete Route"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Route Form */}
                <div
                  className="flex gap-2 items-end p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border"
                  style={{ borderColor: colors.border }}
                >
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1 opacity-70">
                      New Route Name
                    </label>
                    <input
                      className="w-full p-2 border rounded text-sm bg-transparent"
                      style={{ borderColor: colors.border }}
                      placeholder="e.g. Data Science"
                      value={newRoute.label}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, label: e.target.value })
                      }
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-semibold mb-1 opacity-70">
                      Color
                    </label>
                    <input
                      type="color"
                      className="w-full h-9 p-0 border-0 rounded cursor-pointer"
                      value={newRoute.color}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, color: e.target.value })
                      }
                    />
                  </div>
                  <button
                    onClick={handleAddRoute}
                    disabled={!newRoute.label}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 h-9"
                  >
                    Add
                  </button>
                </div>
              </section>

              {/* Station Type Management */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-4">
                  Event Types (Legend)
                </h4>
                <div className="space-y-2 mb-4">
                  {stationTypes.map((type) => {
                    const Shape =
                      ShapeComponents[type.shape] || ShapeComponents.Circle;
                    const isDeleting =
                      deleteConfirm?.type === 'type' &&
                      deleteConfirm?.id === type.id;

                    return (
                      <div
                        key={type.id}
                        className="flex items-center justify-between p-2 border-b last:border-0"
                        style={{ borderColor: colors.border }}
                      >
                        {isDeleting ? (
                          <div className="flex items-center justify-between w-full gap-2 py-1">
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              Delete &quot;{type.label}&quot;?
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmDeleteType(type.id)}
                                className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="text-slate-400">
                                <svg width="16" height="16">
                                  <Shape
                                    cx={8}
                                    cy={8}
                                    color="currentColor"
                                    active={false}
                                  />
                                </svg>
                              </div>
                              <span className="text-sm">{type.label}</span>
                            </div>
                            <button
                              onClick={() =>
                                setDeleteConfirm({ type: 'type', id: type.id })
                              }
                              className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Type Form */}
                <div
                  className="flex gap-2 items-end p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border"
                  style={{ borderColor: colors.border }}
                >
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1 opacity-70">
                      New Type Name
                    </label>
                    <input
                      className="w-full p-2 border rounded text-sm bg-transparent"
                      style={{ borderColor: colors.border }}
                      placeholder="e.g. Legal Review"
                      value={newType.label}
                      onChange={(e) =>
                        setNewType({ ...newType, label: e.target.value })
                      }
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-semibold mb-1 opacity-70">
                      Shape
                    </label>
                    <select
                      className="w-full p-2 border rounded text-sm bg-transparent"
                      style={{ borderColor: colors.border }}
                      value={newType.shape}
                      onChange={(e) =>
                        setNewType({ ...newType, shape: e.target.value })
                      }
                    >
                      {Object.keys(ShapeComponents).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddType}
                    disabled={!newType.label}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 h-9"
                  >
                    Add
                  </button>
                </div>
              </section>
            </div>

            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-sm font-medium rounded hover:opacity-80 transition-colors"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {hoveredStop && !isDragging && !activeStation && (
        <StationTooltip
          hoveredStop={hoveredStop}
          activeTheme={activeTheme}
          colors={colors}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${activeTheme === 'dark' ? '#334155' : '#cbd5e1'}; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${activeTheme === 'dark' ? '#475569' : '#94a3b8'}; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default SubwayView;
