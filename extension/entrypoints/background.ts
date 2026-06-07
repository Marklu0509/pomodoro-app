import { DEFAULT_STATE, type TimerState, type Message } from "@/lib/types";
import { postSession } from "@/lib/api";
import { enableBlocking, disableBlocking } from "@/lib/blocking";

/** Block distracting sites only while actively focusing. */
async function syncBlocking(state: TimerState): Promise<void> {
  if (state.running && state.phase === "WORK") await enableBlocking();
  else await disableBlocking();
}

const STATE_KEY = "timerState";
const ALARM_PHASE_END = "phaseEnd";
const ALARM_BADGE = "badge";

async function loadState(): Promise<TimerState> {
  const { [STATE_KEY]: s } = await chrome.storage.local.get(STATE_KEY);
  return { ...DEFAULT_STATE, ...(s as Partial<TimerState> | undefined) };
}

async function saveState(state: TimerState): Promise<void> {
  await chrome.storage.local.set({ [STATE_KEY]: state });
}

function remainingMs(state: TimerState, now: number): number {
  if (state.running && state.endsAt) return Math.max(0, state.endsAt - now);
  return state.remainingMs;
}

/** What the popup renders: state with a freshly-computed remaining time. */
function viewState(state: TimerState): TimerState {
  return { ...state, remainingMs: remainingMs(state, Date.now()) };
}

async function updateBadge(state: TimerState): Promise<void> {
  if (!state.running || !state.endsAt) {
    await chrome.action.setBadgeText({ text: "" });
    return;
  }
  const mins = Math.ceil(remainingMs(state, Date.now()) / 60000);
  await chrome.action.setBadgeBackgroundColor({
    color: state.phase === "WORK" ? "#1e293b" : "#475569",
  });
  await chrome.action.setBadgeText({ text: String(mins) });
}

async function scheduleAlarms(endsAt: number): Promise<void> {
  await chrome.alarms.create(ALARM_PHASE_END, { when: endsAt });
  await chrome.alarms.create(ALARM_BADGE, { periodInMinutes: 1 });
}

async function clearAlarms(): Promise<void> {
  await chrome.alarms.clear(ALARM_PHASE_END);
  await chrome.alarms.clear(ALARM_BADGE);
}

async function start(): Promise<TimerState> {
  const state = await loadState();
  if (state.running) return viewState(state);

  // Starting from idle begins a WORK phase.
  if (state.phase === "IDLE") {
    state.phase = "WORK";
    state.remainingMs = state.workMin * 60 * 1000;
  }
  const now = Date.now();
  state.endsAt = now + state.remainingMs;
  state.running = true;

  await scheduleAlarms(state.endsAt);
  await saveState(state);
  await updateBadge(state);
  await syncBlocking(state);
  return viewState(state);
}

async function pause(): Promise<TimerState> {
  const state = await loadState();
  if (state.running && state.endsAt) {
    state.remainingMs = Math.max(0, state.endsAt - Date.now());
    state.running = false;
    state.endsAt = null;
  }
  await clearAlarms();
  await saveState(state);
  await updateBadge(state);
  await syncBlocking(state);
  return viewState(state);
}

async function reset(): Promise<TimerState> {
  const state = await loadState();
  const next: TimerState = {
    ...state,
    phase: "IDLE",
    running: false,
    endsAt: null,
    remainingMs: state.workMin * 60 * 1000,
  };
  await clearAlarms();
  await saveState(next);
  await updateBadge(next);
  await syncBlocking(next);
  return viewState(next);
}

async function notify(title: string, message: string): Promise<void> {
  await chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("/icon/128.png"),
    title,
    message,
  });
}

/** Fired when a phase's end-time alarm triggers. */
async function handlePhaseEnd(): Promise<void> {
  const state = await loadState();

  if (state.phase === "WORK") {
    // Record the completed focus session (best-effort).
    try {
      await postSession(state.workMin * 60, state.taskId);
    } catch (e) {
      console.error("session sync failed", e);
    }
    await notify("Focus complete 🍅", "Time for a short break.");
    state.phase = "SHORT_BREAK";
    state.remainingMs = state.shortBreakMin * 60 * 1000;
  } else {
    await notify("Break over", "Ready for another focus session?");
    state.phase = "WORK";
    state.remainingMs = state.workMin * 60 * 1000;
  }

  // Do not auto-start the next phase; wait for the user to press start.
  state.running = false;
  state.endsAt = null;
  await clearAlarms();
  await saveState(state);
  await updateBadge(state);
  await syncBlocking(state);
}

// --- wiring ---
export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(async () => {
    const state = await loadState();
    await saveState(state);
    // Reconcile blocking rules with the persisted timer state on install/update.
    await syncBlocking(state);
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_PHASE_END) await handlePhaseEnd();
    else if (alarm.name === ALARM_BADGE) await updateBadge(await loadState());
  });

  chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
    (async () => {
      switch (message.type) {
        case "START":
          sendResponse(await start());
          break;
        case "PAUSE":
          sendResponse(await pause());
          break;
        case "RESET":
          sendResponse(await reset());
          break;
        case "GET_STATE":
        default:
          sendResponse(viewState(await loadState()));
      }
    })();
    return true; // keep the message channel open for the async response
  });
});
