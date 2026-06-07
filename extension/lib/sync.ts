// Offline-tolerant session recording: if a POST fails (offline / server down),
// queue it in chrome.storage and retry later.

import { postSession } from "@/lib/api";

interface PendingSession {
  durationSeconds: number;
  taskId: number | null;
}

const KEY = "pendingSessions";

async function getQueue(): Promise<PendingSession[]> {
  const { [KEY]: q } = await chrome.storage.local.get(KEY);
  return Array.isArray(q) ? (q as PendingSession[]) : [];
}

async function setQueue(q: PendingSession[]): Promise<void> {
  await chrome.storage.local.set({ [KEY]: q });
}

/** Record a finished session now; on failure, queue it for a later retry. */
export async function recordSession(
  durationSeconds: number,
  taskId: number | null,
): Promise<void> {
  try {
    await postSession(durationSeconds, taskId);
  } catch {
    const q = await getQueue();
    q.push({ durationSeconds, taskId });
    await setQueue(q);
  }
}

/** Retry every queued session; keep the ones that still fail. */
export async function flushQueue(): Promise<void> {
  const q = await getQueue();
  if (q.length === 0) return;

  const remaining: PendingSession[] = [];
  for (const s of q) {
    try {
      await postSession(s.durationSeconds, s.taskId);
    } catch {
      remaining.push(s);
    }
  }
  await setQueue(remaining);
}
