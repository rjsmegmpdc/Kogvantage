'use client';

import { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  Hash,
  X,
  Shuffle,
  ChevronDown,
  Search,
  Filter,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CodewordEntry {
  id: string;
  category: 'project' | 'person' | 'date' | 'financial' | 'location' | 'custom';
  realValue: string;
  codeword: string;
  rolesWithAccess: string[];
  dateShiftDays: number;
  financialMaskType: 'exact' | 'range' | 'percentage' | 'hidden';
  isActive: boolean;
}

export interface CodewordManagerProps {
  codewords: CodewordEntry[];
  onAdd: (codeword: Omit<CodewordEntry, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<CodewordEntry>) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  currentUserRole: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_CATEGORIES = ['project', 'person', 'date', 'financial', 'location', 'custom'] as const;
type Category = (typeof ALL_CATEGORIES)[number];

const ALL_ROLES = ['admin', 'portfolio-manager', 'project-manager', 'team-lead', 'member', 'viewer'];

const CATEGORY_COLORS: Record<Category, string> = {
  project: '#3b82f6',
  person: '#8b5cf6',
  date: '#f59e0b',
  financial: '#22c55e',
  location: '#ef4444',
  custom: '#06b6d4',
};

const CATEGORY_LABELS: Record<Category, string> = {
  project: 'Project',
  person: 'Person',
  date: 'Date',
  financial: 'Financial',
  location: 'Location',
  custom: 'Custom',
};

const FINANCIAL_MASK_OPTIONS = [
  { value: 'exact', label: 'Exact value' },
  { value: 'range', label: 'Range (e.g., $10K-$50K)' },
  { value: 'percentage', label: 'Percentage change only' },
  { value: 'hidden', label: 'Fully hidden' },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCodeword(): string {
  const prefixes = ['ALPHA', 'BRAVO', 'DELTA', 'ECHO', 'FOXTROT', 'GAMMA', 'KILO', 'OSCAR', 'SIERRA', 'TANGO', 'ZULU'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${prefix}-${num}`;
}

function canSeeRealValue(userRole: string, rolesWithAccess: string[]): boolean {
  return userRole === 'admin' || rolesWithAccess.includes(userRole);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: Category }) {
  const color = CATEGORY_COLORS[category];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      <Tag size={10} />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  size = 'md',
}: {
  checked: boolean;
  onChange: () => void;
  size?: 'sm' | 'md';
}) {
  const w = size === 'sm' ? 32 : 40;
  const h = size === 'sm' ? 18 : 22;
  const dot = size === 'sm' ? 14 : 18;
  const offset = checked ? w - dot - 2 : 2;
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200"
      style={{
        width: w,
        height: h,
        backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-surface-overlay)',
      }}
    >
      <span
        className="inline-block rounded-full bg-white shadow transition-transform duration-200"
        style={{ width: dot, height: dot, marginTop: 2, transform: `translateX(${offset}px)` }}
      />
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {value}
        </p>
        <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Codeword Form
// ---------------------------------------------------------------------------

interface AddFormProps {
  onSubmit: (entry: Omit<CodewordEntry, 'id'>) => void;
  onCancel: () => void;
}

function AddCodewordForm({ onSubmit, onCancel }: AddFormProps) {
  const [category, setCategory] = useState<Category>('project');
  const [realValue, setRealValue] = useState('');
  const [codeword, setCodeword] = useState('');
  const [rolesWithAccess, setRolesWithAccess] = useState<string[]>(['admin']);
  const [dateShiftDays, setDateShiftDays] = useState(0);
  const [financialMaskType, setFinancialMaskType] = useState<CodewordEntry['financialMaskType']>('hidden');

  const toggleRole = (role: string) => {
    if (role === 'admin') return; // admin always has access
    setRolesWithAccess((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!realValue.trim() || !codeword.trim()) return;
    onSubmit({
      category,
      realValue: realValue.trim(),
      codeword: codeword.trim(),
      rolesWithAccess,
      dateShiftDays,
      financialMaskType,
      isActive: true,
    });
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4,
    display: 'block',
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-5 mt-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Add New Codeword
        </h4>
        <button type="button" onClick={onCancel} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label style={labelStyle}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        {/* Real Value */}
        <div>
          <label style={labelStyle}>Real Value</label>
          <input
            type="text"
            value={realValue}
            onChange={(e) => setRealValue(e.target.value)}
            placeholder="e.g., Project Phoenix"
            style={inputStyle}
          />
        </div>

        {/* Codeword */}
        <div>
          <label style={labelStyle}>Codeword</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={codeword}
              onChange={(e) => setCodeword(e.target.value)}
              placeholder="e.g., ALPHA-7"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setCodeword(generateCodeword())}
              className="flex items-center gap-1 px-3 rounded-lg text-xs font-medium shrink-0 transition-colors"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
              title="Auto-generate codeword"
            >
              <Shuffle size={12} />
              Generate
            </button>
          </div>
        </div>

        {/* Date Shift (conditional) */}
        {category === 'date' && (
          <div>
            <label style={labelStyle}>Date Shift (days)</label>
            <input
              type="number"
              value={dateShiftDays}
              onChange={(e) => setDateShiftDays(parseInt(e.target.value) || 0)}
              placeholder="e.g., 14"
              style={inputStyle}
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Dates will be shifted by this many days for restricted roles.
            </p>
          </div>
        )}

        {/* Financial Mask (conditional) */}
        {category === 'financial' && (
          <div>
            <label style={labelStyle}>Financial Mask Type</label>
            <select
              value={financialMaskType}
              onChange={(e) => setFinancialMaskType(e.target.value as CodewordEntry['financialMaskType'])}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {FINANCIAL_MASK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Roles Multi-select */}
      <div className="mt-4">
        <label style={labelStyle}>Roles with Real-Value Access</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {ALL_ROLES.map((role) => {
            const selected = rolesWithAccess.includes(role);
            const isAdmin = role === 'admin';
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: selected ? 'var(--color-primary)' : 'var(--color-surface-raised)',
                  color: selected ? '#fff' : 'var(--color-text-secondary)',
                  border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  opacity: isAdmin ? 0.7 : 1,
                  cursor: isAdmin ? 'not-allowed' : 'pointer',
                }}
                disabled={isAdmin}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!realValue.trim() || !codeword.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
          style={{
            backgroundColor: 'var(--color-primary)',
          }}
        >
          Add Codeword
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CodewordManager({
  codewords,
  onAdd,
  onUpdate,
  onDelete,
  onToggleActive,
  currentUserRole,
}: CodewordManagerProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | Category>('all');
  const [previewRole, setPreviewRole] = useState<string>(currentUserRole);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Derived data ----

  const filtered = useMemo(() => {
    let list = codewords;
    if (filterCategory !== 'all') {
      list = list.filter((c) => c.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.codeword.toLowerCase().includes(q) ||
          c.realValue.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [codewords, filterCategory, searchQuery]);

  const totalActive = codewords.filter((c) => c.isActive).length;
  const uniqueCategories = new Set(codewords.map((c) => c.category)).size;

  // ---- Handlers ----

  const handleAdd = (entry: Omit<CodewordEntry, 'id'>) => {
    onAdd(entry);
    setShowAddForm(false);
  };

  // ---- Render ----

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{
              backgroundColor: isEnabled ? 'var(--color-primary)' : 'var(--color-surface-overlay)',
              color: '#fff',
            }}
          >
            {isEnabled ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              Codeword Protection
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {isEnabled ? 'Active' : 'Disabled'} &mdash; {codewords.length} codeword{codewords.length !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Preview-as dropdown */}
          <div className="flex items-center gap-2">
            <Eye size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              See as
            </span>
            <div className="relative">
              <select
                value={previewRole}
                onChange={(e) => setPreviewRole(e.target.value)}
                className="appearance-none pr-6 pl-2 py-1 rounded-md text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-text-muted)' }}
              />
            </div>
          </div>

          <Toggle checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={codewords.length} icon={<Hash size={16} />} color="var(--color-primary)" />
        <StatCard label="Active" value={totalActive} icon={<ShieldCheck size={16} />} color="var(--color-success)" />
        <StatCard label="Categories" value={uniqueCategories} icon={<Tag size={16} />} color="var(--color-info)" />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search codewords..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Filter size={13} style={{ color: 'var(--color-text-muted)' }} />
          {(['all', ...ALL_CATEGORIES] as const).map((cat) => {
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider transition-colors"
                style={{
                  backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? '#fff' : 'var(--color-text-muted)',
                }}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors shrink-0"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={14} />
          Add Codeword
        </button>
      </div>

      {/* Add Form (inline) */}
      {showAddForm && <AddCodewordForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />}

      {/* Codeword List */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Shield size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
          <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {codewords.length === 0
              ? 'No codewords configured yet'
              : 'No codewords match the current filter'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
            {codewords.length === 0
              ? 'Add your first codeword to start protecting sensitive data.'
              : 'Try adjusting the category filter or search term.'}
          </p>
          {codewords.length === 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Plus size={14} />
              Add Codeword
            </button>
          )}
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          {/* Table header */}
          <div
            className="grid gap-4 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              gridTemplateColumns: '100px 1fr 1fr 1fr 60px 80px',
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-muted)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span>Category</span>
            <span>Codeword</span>
            <span>Real Value</span>
            <span>Access Roles</span>
            <span className="text-center">Active</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Table rows */}
          {filtered.map((entry) => {
            const showReal = canSeeRealValue(previewRole, entry.rolesWithAccess);
            return (
              <div
                key={entry.id}
                className="grid gap-4 px-4 py-3 items-center text-sm transition-colors"
                style={{
                  gridTemplateColumns: '100px 1fr 1fr 1fr 60px 80px',
                  backgroundColor: 'var(--color-surface)',
                  borderBottom: '1px solid var(--color-border)',
                  opacity: entry.isActive ? 1 : 0.5,
                }}
              >
                <CategoryBadge category={entry.category} />

                <span className="font-mono font-semibold text-sm" style={{ color: 'var(--color-primary-light)' }}>
                  {entry.codeword}
                </span>

                <span
                  className="text-sm font-mono"
                  style={{ color: showReal ? 'var(--color-text)' : 'var(--color-text-muted)' }}
                >
                  {showReal ? entry.realValue : '\u2022\u2022\u2022\u2022\u2022\u2022'}
                </span>

                <div className="flex flex-wrap gap-1">
                  {entry.rolesWithAccess.slice(0, 3).map((role) => (
                    <span
                      key={role}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: 'var(--color-surface-raised)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {role}
                    </span>
                  ))}
                  {entry.rolesWithAccess.length > 3 && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      +{entry.rolesWithAccess.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex justify-center">
                  <Toggle checked={entry.isActive} onChange={() => onToggleActive(entry.id)} size="sm" />
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => setEditingId(editingId === entry.id ? null : entry.id)}
                    className="p-1.5 rounded-md transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--color-surface-raised)',
                      color: 'var(--color-text-muted)',
                    }}
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-1.5 rounded-md transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--color-surface-raised)',
                      color: 'var(--color-danger)',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
