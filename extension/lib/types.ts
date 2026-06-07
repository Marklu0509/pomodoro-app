// Shared types for the extension (mirrors the web app's backend contract).

export type Phase = "IDLE" | "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export interface TimerState {
  phase: Phase;
  running: boolean;
  /** epoch ms when the current phase ends (only meaningful while running) */
  endsAt: number | null;
  /** remaining ms when paused/idle (used to resume) */
  remainingMs: number;
  workMin: number;
  shortBreakMin: number;
  taskId: number | null;
  taskName: string;
}

export const DEFAULT_STATE: TimerState = {
  phase: "IDLE",
  running: false,
  endsAt: null,
  remainingMs: 25 * 60 * 1000,
  workMin: 25,
  shortBreakMin: 5,
  taskId: null,
  taskName: "Quick Focus",
};

// Messages exchanged between popup and background service worker.
export type Message =
  | { type: "GET_STATE" }
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESET" };
