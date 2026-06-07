import React, { useEffect, useState, useCallback } from "react";
import { getToken, clearToken, login, getTodayMinutes } from "@/lib/api";
import { type TimerState, type Message } from "@/lib/types";

const PHASE_LABEL: Record<TimerState["phase"], string> = {
  IDLE: "Ready",
  WORK: "Focus",
  SHORT_BREAK: "Short Break",
  LONG_BREAK: "Long Break",
};

function send(message: Message): Promise<TimerState> {
  return chrome.runtime.sendMessage(message) as Promise<TimerState>;
}

function format(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [state, setState] = useState<TimerState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [today, setToday] = useState<number | null>(null);

  // form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setState(await send({ type: "GET_STATE" }));
    try {
      setToday(await getTodayMinutes());
    } catch {
      /* not critical */
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      setAuthed(!!token);
      if (token) await refresh();
    })();
  }, [refresh]);

  // tick once a second while running so the countdown is smooth
  useEffect(() => {
    if (!state?.running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state?.running]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      setAuthed(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await clearToken();
    setAuthed(false);
    setState(null);
  };

  if (authed === null) {
    return <div className="card muted">Loading…</div>;
  }

  if (!authed) {
    return (
      <div className="card">
        <h1 className="brand">FocusFlow</h1>
        <form onSubmit={handleLogin} className="form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <a className="link" href="https://pomodoro.marklu.page" target="_blank" rel="noreferrer">
          No account? Sign up on the web →
        </a>
      </div>
    );
  }

  const remaining = state
    ? state.running && state.endsAt
      ? Math.max(0, state.endsAt - now)
      : state.remainingMs
    : 0;

  return (
    <div className="card">
      <div className="row">
        <h1 className="brand">FocusFlow</h1>
        <button className="ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <p className="phase">{state ? PHASE_LABEL[state.phase] : ""}</p>
      <p className="time">{format(remaining)}</p>

      <div className="controls">
        {state?.running ? (
          <button onClick={async () => setState(await send({ type: "PAUSE" }))}>Pause</button>
        ) : (
          <button className="primary" onClick={async () => setState(await send({ type: "START" }))}>
            Start
          </button>
        )}
        <button className="ghost" onClick={async () => setState(await send({ type: "RESET" }))}>
          Reset
        </button>
      </div>

      <p className="muted small">
        {today !== null ? `${today} min focused today` : " "}
      </p>
    </div>
  );
}
