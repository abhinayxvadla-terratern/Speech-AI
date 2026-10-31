import React, { useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

export type DateRangePreset = 'all' | 'today' | '7d' | '30d' | 'month' | '90d' | 'custom';

export interface DateRangeValue {
  preset: DateRangePreset;
  startDate: Date | null;
  endDate: Date | null;
  label: string;
}

export const DATE_PRESET_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'month', label: 'This Month' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export function computeDateBounds(
  preset: DateRangePreset,
  customStartStr?: string,
  customEndStr?: string
): { startDate: Date | null; endDate: Date | null; label: string } {
  const now = new Date();

  switch (preset) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startDate: start, endDate: end, label: 'Today' };
    }
    case '7d': {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now, label: 'Last 7 Days' };
    }
    case '30d': {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now, label: 'Last 30 Days' };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { startDate: start, endDate: now, label: 'This Month' };
    }
    case '90d': {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now, label: 'Last 90 Days' };
    }
    case 'custom': {
      if (customStartStr) {
        const start = new Date(customStartStr + 'T00:00:00');
        const end = customEndStr ? new Date(customEndStr + 'T23:59:59.999') : now;
        return {
          startDate: start,
          endDate: end,
          label: `${customStartStr} to ${customEndStr || 'now'}`,
        };
      }
      return { startDate: null, endDate: null, label: 'Custom Range' };
    }
    case 'all':
    default:
      return { startDate: null, endDate: null, label: 'All Time' };
  }
}

export function isDateInRange(
  dateValue: string | Date | null | undefined,
  range: DateRangeValue
): boolean {
  if (!dateValue) return false;
  if (range.preset === 'all' || (!range.startDate && !range.endDate)) {
    return true;
  }

  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return false;

  if (range.startDate && d < range.startDate) {
    return false;
  }
  if (range.endDate && d > range.endDate) {
    return false;
  }
  return true;
}

interface AdminDateRangeFilterProps {
  value: DateRangeValue;
  onChange: (newValue: DateRangeValue) => void;
  className?: string;
  showCustomInputsInline?: boolean;
}

export const AdminDateRangeFilter: React.FC<AdminDateRangeFilterProps> = ({
  value,
  onChange,
  className = '',
  showCustomInputsInline = true,
}) => {
  const [customStart, setCustomStart] = useState<string>(() => {
    return value.startDate ? value.startDate.toISOString().split('T')[0] : '';
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return value.endDate ? value.endDate.toISOString().split('T')[0] : '';
  });

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      const bounds = computeDateBounds('custom', customStart, customEnd);
      onChange({
        preset: 'custom',
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        label: bounds.label,
      });
      return;
    }

    const bounds = computeDateBounds(preset);
    onChange({
      preset,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      label: bounds.label,
    });
  };

  const handleApplyCustomDates = (startStr: string, endStr: string) => {
    setCustomStart(startStr);
    setCustomEnd(endStr);
    if (!startStr) return;

    const bounds = computeDateBounds('custom', startStr, endStr);
    onChange({
      preset: 'custom',
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      label: bounds.label,
    });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Preset Selector */}
      <div className="relative flex items-center">
        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
        <select
          value={value.preset}
          onChange={(e) => handlePresetSelect(e.target.value as DateRangePreset)}
          className="pl-8 pr-7 py-2 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-semibold text-[#00215C] focus:outline-none focus:border-[#255CC1] transition-all appearance-none cursor-pointer"
        >
          {DATE_PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
      </div>

      {/* Custom Date Pickers (Shown when preset is 'custom' or showCustomInputsInline) */}
      {value.preset === 'custom' && showCustomInputsInline && (
        <div className="flex items-center gap-1.5 animate-fadeIn">
          <input
            type="date"
            value={customStart}
            onChange={(e) => handleApplyCustomDates(e.target.value, customEnd)}
            className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-medium text-slate-700 focus:outline-none focus:border-[#255CC1]"
            title="Start Date"
          />
          <span className="text-slate-400 text-xs font-medium">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => handleApplyCustomDates(customStart, e.target.value)}
            className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-[#FAFBFF] text-xs font-medium text-slate-700 focus:outline-none focus:border-[#255CC1]"
            title="End Date"
          />
        </div>
      )}

      {/* Active Range Quick Badge (if not all-time) */}
      {value.preset !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#255CC1] border border-blue-100 text-[11px] font-bold">
          <span>{value.label}</span>
          <button
            onClick={() => handlePresetSelect('all')}
            className="hover:text-blue-900 rounded p-0.5 ml-0.5"
            title="Clear date filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}
    </div>
  );
};
