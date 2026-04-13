'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Tag, Info, Save, ChevronRight } from 'lucide-react';
import type { ActiveStation, SubwayStop, StationType, SubwayColors } from '@/constants/subway';

interface StationEditModalProps {
  activeStation: ActiveStation;
  stationTypes: StationType[];
  colors: SubwayColors;
  onClose: () => void;
  onSave: (updatedStop: SubwayStop) => void;
}

const StationEditModal: React.FC<StationEditModalProps> = ({
  activeStation,
  stationTypes,
  colors,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<SubwayStop>({ ...activeStation.stop });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-md overflow-hidden border relative bg-white dark:bg-slate-900 transition-all scale-100 flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.border,
          color: colors.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Stripe */}
        <div
          className="h-2 w-full flex-none"
          style={{ backgroundColor: activeStation.route.color }}
        />

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                  style={{
                    borderColor: activeStation.route.color,
                    color: activeStation.route.color,
                  }}
                >
                  {activeStation.route.categoryLabel}
                </span>
                <span className="text-xs opacity-60 flex items-center gap-1">
                  <ChevronRight size={10} />
                  {activeStation.lane.label || 'Trunk'}
                </span>
              </div>
              <h2 className="text-xl font-bold leading-tight">Edit Station</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-5">
            {/* Labels */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1.5">
                  Label Top
                </label>
                <input
                  name="labelTop"
                  value={formData.labelTop || ''}
                  onChange={handleChange}
                  className="w-full p-2 rounded border bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  style={{ borderColor: colors.border }}
                  placeholder="e.g. Milestone A"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1.5">
                  Label Bottom
                </label>
                <input
                  name="labelBottom"
                  value={formData.labelBottom || ''}
                  onChange={handleChange}
                  className="w-full p-2 rounded border bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  style={{ borderColor: colors.border }}
                  placeholder="e.g. v1.0 Release"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 rounded border bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                style={{ borderColor: colors.border }}
                placeholder="Enter details..."
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={12} /> Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate || ''}
                  onChange={handleChange}
                  className="w-full p-2 rounded border bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  style={{ borderColor: colors.border }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1.5 flex items-center gap-1.5">
                  <Clock size={12} /> End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate || ''}
                  onChange={handleChange}
                  className="w-full p-2 rounded border bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  style={{ borderColor: colors.border }}
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1.5 flex items-center gap-1.5">
                  <Tag size={12} /> Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 rounded border bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none capitalize"
                  style={{ borderColor: colors.border }}
                >
                  {stationTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1.5 flex items-center gap-1.5">
                  <Info size={12} /> Status
                </label>
                <select
                  name="status"
                  value={formData.status || 'notStarted'}
                  onChange={handleChange}
                  className="w-full p-2 rounded border bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none capitalize"
                  style={{ borderColor: colors.border }}
                >
                  <option value="notStarted">Not Started</option>
                  <option value="inProgress">In Progress</option>
                  <option value="atRisk">At Risk</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t flex justify-end gap-3 flex-none"
          style={{ borderColor: colors.border }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-sm font-medium transition-colors text-slate-500 dark:text-slate-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow-sm transition-all"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationEditModal;
