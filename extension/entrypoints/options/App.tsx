import React, { useEffect, useState } from "react";
import {
  getSettings,
  setSettings,
  DEFAULT_SETTINGS,
} from "@/lib/settings";
import { getBlockedSites, setBlockedSites, DEFAULT_BLOCKED } from "@/lib/blocking";

const MAX_MIN = 180;

function clampMinutes(value: number): number {
  if (!Number.isFinite(value) || value < 1) return 1;
  if (value > MAX_MIN) return MAX_MIN;
  return Math.floor(value);
}

/** Normalise a user-entered line into a bare domain (strip scheme/path/www). */
function normaliseDomain(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export default function App() {
  const [workMin, setWorkMin] = useState(DEFAULT_SETTINGS.workMin);
  const [shortBreakMin, setShortBreakMin] = useState(DEFAULT_SETTINGS.shortBreakMin);
  const [sitesText, setSitesText] = useState(DEFAULT_BLOCKED.join("\n"));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setWorkMin(s.workMin);
      setShortBreakMin(s.shortBreakMin);
      setSitesText((await getBlockedSites()).join("\n"));
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = clampMinutes(workMin);
    const b = clampMinutes(shortBreakMin);
    const sites = Array.from(
      new Set(sitesText.split("\n").map(normaliseDomain).filter(Boolean)),
    );

    setWorkMin(w);
    setShortBreakMin(b);
    setSitesText(sites.join("\n"));

    await setSettings({ workMin: w, shortBreakMin: b });
    await setBlockedSites(sites);
    await chrome.runtime.sendMessage({ type: "SETTINGS_CHANGED" });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page">
      <form className="card" onSubmit={handleSave}>
        <h1 className="brand">FocusFlow Settings</h1>

        <section>
          <h2>Timer</h2>
          <div className="grid">
            <label>
              Focus (minutes)
              <input
                type="number"
                min={1}
                max={MAX_MIN}
                value={workMin}
                onChange={(e) => setWorkMin(Number(e.target.value))}
              />
            </label>
            <label>
              Short break (minutes)
              <input
                type="number"
                min={1}
                max={MAX_MIN}
                value={shortBreakMin}
                onChange={(e) => setShortBreakMin(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="hint">Applies to your next session.</p>
        </section>

        <section>
          <h2>Blocked sites during focus</h2>
          <p className="hint">One domain per line (e.g. youtube.com).</p>
          <textarea
            rows={8}
            value={sitesText}
            onChange={(e) => setSitesText(e.target.value)}
            spellCheck={false}
          />
        </section>

        <div className="actions">
          <button type="submit" className="primary">
            Save
          </button>
          {saved && <span className="saved">Saved ✓</span>}
        </div>
      </form>
    </div>
  );
}
