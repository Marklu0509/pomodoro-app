// frontend/app/types/focus-mode.ts
// Shared FocusMode type — single source of truth (previously duplicated in
// dashboard / focus / settings / Timer).
export interface FocusMode {
  id: number;
  name: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  ambientVolume: number;
  ambientSound: string;
  alarmSound: string;
  alertAt25Percent: boolean;
  isDefault?: boolean;
  musicUrl: string | null;
  musicType: string;
  musicVolume?: number;
  theme?: string;
}
