import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPeso(value: number): string {
  return `$${Number(value || 0).toLocaleString()}`;
}

export function formatPesoK(value: number): string {
  return `$${(Number(value || 0) / 1000).toFixed(0)}k`;
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function formatDateFull(date: string | null): string {
  if (!date) return '';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function pct(a: number, b: number): number {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

export function daysFromNow(date: string | null): number {
  if (!date) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getWeekDates(weekOffset: number = 0) {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() - d.getDay() + 1 + weekOffset * 7);
  const start = new Date(d);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    dateRange: `${start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`,
  };
}

export const WEEKS = [
  { num: 1, label: 'Week 1', ...getWeekDates(0) },
  { num: 2, label: 'Week 2', ...getWeekDates(1) },
  { num: 3, label: 'Week 3', ...getWeekDates(2) },
  { num: 4, label: 'Week 4', ...getWeekDates(3) },
];

export function statusColor(status: string): string {
  switch (status) {
    case 'complete': return '#639922';
    case 'behind': return '#E24B4A';
    case 'on_track': return '#1D9E75';
    default: return '#888780';
  }
}
