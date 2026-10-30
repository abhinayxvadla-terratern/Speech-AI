import { PressureMode } from '../lib/database.types';

export interface PressureModeConfig {
  id: PressureMode;
  title: string;
  description: string;
  badgeColor: string;
}

export const PRESSURE_MODES: PressureModeConfig[] = [
  {
    id: 'Relaxed',
    title: 'Relaxed',
    description: 'Take your time, no time pressure',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'Standard',
    title: 'Standard',
    description: 'Realistic pacing and natural German interviewer cadence',
    badgeColor: 'bg-blue-50 text-[#255CC1] border-blue-200',
  },
  {
    id: 'High-Pressure',
    title: 'High-Pressure',
    description: 'Fast follow-ups, interruptions simulated — for exam-day readiness',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

export interface DurationOption {
  label: string;
  value: number | 'open';
}

export const SESSION_DURATIONS: DurationOption[] = [
  { label: '2 min', value: 2 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: 'Open-ended', value: 'open' },
];

export const INTERVIEW_DURATIONS: DurationOption[] = SESSION_DURATIONS;
