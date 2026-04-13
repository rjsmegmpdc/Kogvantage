'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ShapeComponents } from './StationMarker';
import type { SubwayRoute, SubwayStop, StationType, SubwayColors } from '@/constants/subway';

interface NewStopForm {
  routeId: string;
  laneId: string;
  type: string;
  startDate: string;
  endDate: string;
  labelTop: string;
  labelBottom: string;
  description: string;
  status: string;
}

interface AddStationModalProps {
  routes: SubwayRoute[];
  stationTypes: StationType[];
  activeTheme: string;
  colors: SubwayColors;
  onClose: () => void;
  onAdd: (routeId: string, laneId: string, stop: Omit<SubwayStop, 'id'>) => void;
}

const AddStationModal: React.FC<AddStationModalProps> = ({
  routes,
  stationTypes,
  activeTheme,
  colors,
  onClose,
  onAdd,
}) => {
  const [newStop, setNewStop] = useState<NewStopForm>({
    routeId: '',
    laneId: '',
    type: 'minorMilestone',
    startDate: '',
    endDate: '',
    labelTop: '',
    labelBottom: '',
    description: '',
    status: 'notStarted',
  });

  const handleAddStation = () => {
    if (!newStop.routeId || !newStop.laneId || !newStop.startDate) return;

    onAdd(newStop.routeId, newStop.laneId, {
      startDate: newStop.startDate,
      endDate: newStop.endDate || null,
      type: newStop.type,
      labelTop: newStop.labelTop,
      labelBottom: newStop.labelBottom,
      description: newStop.description,
      status: newStop.status,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
      <div
        className="rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.border,
          color: colors.text,
        }}
      >
        <div
          className="px-6 py-4 border-b flex justify-between items-center"
          style={{
            borderColor: colors.border,
            backgroundColor:
              activeTheme === 'dark' ? '#1e293b' : '#f8fafc',
          }}
        >
          <h3 className="font-bold text-lg">Add New Station</h3>
          <button onClick={onClose} style={{ color: colors.textMuted }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-70">
                Route
              </label>
              <select
                className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                style={{ borderColor: colors.border }}
                value={newStop.routeId}
                onChange={(e) =>
                  setNewStop({ ...newStop, routeId: e.target.value, laneId: '' })
                }
              >
                <option value="">Select Route...</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.categoryLabel}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-70">
                Lane
              </label>
              <select
                className="w-full p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                style={{ borderColor: colors.border }}
                value={newStop.laneId}
                onChange={(e) =>
                  setNewStop({ ...newStop, laneId: e.target.value })
                }
                disabled={!newStop.routeId}
              >
                <option value="">Select Lane...</option>
                {routes
                  .find((r) => r.id === newStop.routeId)
                  ?.lanes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label || 'Trunk'}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 opacity-70">
              Station Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {stationTypes.map((item) => {
                const Shape =
                  ShapeComponents[item.shape] || ShapeComponents.Circle;
                return (
                  <button
                    key={item.id}
                    onClick={() => setNewStop({ ...newStop, type: item.id })}
                    className="flex items-center justify-center gap-2 p-2 border rounded text-xs transition-colors"
                    style={{
                      backgroundColor:
                        newStop.type === item.id
                          ? activeTheme === 'dark'
                            ? '#1e293b'
                            : '#eff6ff'
                          : 'transparent',
                      borderColor:
                        newStop.type === item.id ? '#3b82f6' : colors.border,
                      color:
                        newStop.type === item.id ? '#3b82f6' : colors.textMuted,
                    }}
                  >
                    <div className="scale-75">
                      <svg width="24" height="24" className="overflow-visible">
                        <Shape
                          cx={12}
                          cy={12}
                          color="currentColor"
                          active={true}
                        />
                      </svg>
                    </div>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-70">
                Start Date *
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded text-sm outline-none focus:ring-2 bg-transparent"
                style={{ borderColor: colors.border }}
                value={newStop.startDate}
                onChange={(e) =>
                  setNewStop({ ...newStop, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-70">
                End Date
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded text-sm outline-none focus:ring-2 bg-transparent"
                style={{ borderColor: colors.border }}
                value={newStop.endDate}
                onChange={(e) =>
                  setNewStop({ ...newStop, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-70">
                Label Top
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded text-sm outline-none focus:ring-2 bg-transparent"
                style={{ borderColor: colors.border }}
                value={newStop.labelTop}
                onChange={(e) =>
                  setNewStop({ ...newStop, labelTop: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-70">
                Label Bottom
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded text-sm outline-none focus:ring-2 bg-transparent"
                style={{ borderColor: colors.border }}
                value={newStop.labelBottom}
                onChange={(e) =>
                  setNewStop({ ...newStop, labelBottom: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 opacity-70">
              Description
            </label>
            <textarea
              rows={2}
              className="w-full p-2 border rounded text-sm outline-none focus:ring-2 bg-transparent"
              style={{ borderColor: colors.border }}
              value={newStop.description}
              onChange={(e) =>
                setNewStop({ ...newStop, description: e.target.value })
              }
            />
          </div>
        </div>

        <div
          className="p-6 border-t flex justify-end gap-3"
          style={{
            borderColor: colors.border,
            backgroundColor:
              activeTheme === 'dark' ? '#1e293b' : '#f8fafc',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded hover:bg-opacity-80"
            style={{ color: colors.textMuted }}
          >
            Cancel
          </button>
          <button
            onClick={handleAddStation}
            disabled={
              !newStop.routeId || !newStop.laneId || !newStop.startDate
            }
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm disabled:opacity-50"
          >
            Add Station
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStationModal;
