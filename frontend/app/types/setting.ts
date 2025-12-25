// frontend/app/types/setting.ts
export interface Settings {
  id: number;
  userId: number;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  tickVolume: number;
  notificationVolume: number;
  backgroundSound: string;
  tickingSound: string;
  alertAt25Percent: boolean;
  notificationsEnabled: boolean;
  miniClockMode: boolean;
  lockWindow: boolean;
  alarmSoundString: string;
}