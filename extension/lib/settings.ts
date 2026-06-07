// User-configurable timer durations (set in the options page).

export interface ExtSettings {
  workMin: number;
  shortBreakMin: number;
}

export const DEFAULT_SETTINGS: ExtSettings = { workMin: 25, shortBreakMin: 5 };

const KEY = "settings";

export async function getSettings(): Promise<ExtSettings> {
  const { [KEY]: s } = await chrome.storage.local.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(s as Partial<ExtSettings> | undefined) };
}

export async function setSettings(settings: ExtSettings): Promise<void> {
  await chrome.storage.local.set({ [KEY]: settings });
}
