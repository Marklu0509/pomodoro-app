// frontend/app/stats/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../utils/api";
import Navbar from "../components/Navbar";
import HeatmapSection from "../components/HeatmapSection";

interface WeeklyPoint {
  date: string;
  minutes: number;
}

interface StatsResponse {
  today: {
    minutes: number;
    goal: number;
    progress: number;
  };
  weekly: WeeklyPoint[];
}

const WeeklyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-2xl px-4 py-2 text-xs text-slate-700 dark:text-slate-200">
      <div className="font-semibold">{label}</div>
      <div>{payload[0].value} mins</div>
    </div>
  );
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get("/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const weeklyTotal = useMemo(() => stats?.weekly.reduce((sum, item) => sum + item.minutes, 0) || 0, [stats]);
  const weeklyAverage = useMemo(() => (stats?.weekly.length ? Math.round(weeklyTotal / stats.weekly.length) : 0), [stats, weeklyTotal]);
  const bestDay = useMemo(() => {
    if (!stats?.weekly.length) return null;
    return stats.weekly.reduce((best, point) => (point.minutes > best.minutes ? point : best), stats.weekly[0]);
  }, [stats]);

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-200">Loading stats...</div>;

  return (
    <div className="min-h-screen transition-colors duration-500">
      <Navbar />
      <main className="max-w-6xl mx-auto p-8 space-y-8">
        <header className="glass-card rounded-[2.5rem] p-8 md:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Focus Analytics
          </p>
          <h1 className="mt-4 text-3xl md:text-4xl font-display font-semibold text-slate-900 dark:text-white">
            See how your focus compounds.
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
            Track today&apos;s progress, weekly trends, and the long arc of your deep work.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Today</p>
              <div className="mt-3 text-3xl font-display font-semibold text-slate-900 dark:text-white">
                {stats?.today.minutes ?? 0}
                <span className="text-sm font-body text-slate-500 dark:text-slate-400"> mins</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Goal: {stats?.today.goal ?? 0} mins
              </p>
              <div className="mt-4 h-2 rounded-full bg-white/60 dark:bg-white/10">
                <div
                  className="h-2 rounded-full bg-slate-900"
                  style={{ width: `${stats?.today.progress ?? 0}%` }}
                />
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Weekly Total</p>
              <div className="mt-3 text-3xl font-display font-semibold text-slate-900 dark:text-white">
                {weeklyTotal}
                <span className="text-sm font-body text-slate-500 dark:text-slate-400"> mins</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">Average {weeklyAverage} mins / day</p>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Best Day</p>
              <div className="mt-3 text-3xl font-display font-semibold text-slate-900 dark:text-white">
                {bestDay?.minutes ?? 0}
                <span className="text-sm font-body text-slate-500 dark:text-slate-400"> mins</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{bestDay?.date ?? "--"}</p>
            </div>
          </div>
        </header>

        <section className="glass-card rounded-[2.5rem] p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">Weekly Flow</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Minutes focused across the last seven days.
              </p>
            </div>
            <div className="glass-pill px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Last 7 Days
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weekly ?? []} barSize={28}>
                <XAxis dataKey="date" stroke="rgba(148,163,184,0.6)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(148,163,184,0.6)" tickLine={false} axisLine={false} />
                <Tooltip content={<WeeklyTooltip />} cursor={{ fill: "rgba(15,23,42,0.08)" }} />
                <Bar dataKey="minutes" radius={[12, 12, 4, 4]} fill="#1e293b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <HeatmapSection className="glass-card rounded-[2.5rem] p-8" />
      </main>
    </div>
  );
}
