// API client for the extension. Talks to the SAME backend as the web app.
// CORS already allows chrome-extension:// origins (backend Phase 0.4).

const API_BASE = "https://pomodoro.marklu.page";
const TOKEN_KEY = "token";

export async function getToken(): Promise<string | null> {
  const { [TOKEN_KEY]: token } = await chrome.storage.local.get(TOKEN_KEY);
  return typeof token === "string" ? token : null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}

/** POST /api/auth/login -> stores the JWT and returns it. */
export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error("Login failed; check your email and password.");
  }
  const data = (await res.json()) as { accessToken: string };
  await setToken(data.accessToken);
}

/** Authenticated fetch helper that attaches the JWT. */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

/** Records a completed focus session. */
export async function postSession(durationSeconds: number, taskId: number | null): Promise<void> {
  const res = await authedFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ durationSeconds, taskId }),
  });
  if (!res.ok) throw new Error(`session post failed (${res.status})`);
}

interface SummaryResponse {
  today: { minutes: number; goal: number; progress: number };
}

/** Today's focused minutes from the Go stats service. */
export async function getTodayMinutes(): Promise<number> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const res = await authedFetch(`/stats-api/summary?tz=${encodeURIComponent(tz)}`);
  if (!res.ok) throw new Error(`summary failed (${res.status})`);
  const data = (await res.json()) as SummaryResponse;
  return data.today.minutes;
}
