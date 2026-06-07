// frontend/app/(app)/focus/page.tsx
"use client";

import { useState } from "react";
import Timer from "@/app/components/Timer";
import TaskList from "@/app/components/TaskList";
import { useAppData } from "@/app/context/AppData";
import { Task } from "@/app/types/task";

/**
 * Unified focus workspace: pick a task on the left, run the timer on the right.
 * Replaces the old split between /dashboard (pick) and /focus (run).
 */
export default function FocusWorkspace() {
  const { focusModes, activeMode, setActiveMode, loading, refreshTasks } = useAppData();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const openPopOut = () => {
    const params = new URLSearchParams();
    if (activeTask) params.set("taskId", String(activeTask.id));
    if (activeMode) params.set("modeId", String(activeMode.id));
    window.open(
      `/timer?${params.toString()}`,
      "TimerPopup",
      "width=400,height=560,menubar=no,toolbar=no,location=no,status=no,resizable=yes",
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-slate-900 dark:text-white">
          Stay focused.
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Pick a task, choose a mode, and start the clock.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px] items-start">
        {/* Left: tasks */}
        <section>
          <TaskList activeTaskId={activeTask?.id ?? null} onSelect={setActiveTask} />
        </section>

        {/* Right: timer */}
        <aside className="lg:sticky lg:top-24">
          {loading ? (
            <div className="glass-card rounded-[2.5rem] py-20 text-center text-slate-500 dark:text-slate-300 font-semibold">
              Loading…
            </div>
          ) : !activeMode ? (
            <div className="glass-card rounded-[2.5rem] py-20 px-6 text-center text-slate-500 dark:text-slate-300">
              No focus mode yet. Create one in{" "}
              <span className="font-semibold">Settings</span>.
            </div>
          ) : (
            <Timer
              key={activeMode.id}
              taskId={activeTask?.id ?? null}
              taskName={activeTask?.title ?? "Quick Focus"}
              activeMode={activeMode}
              modes={focusModes}
              onModeChange={setActiveMode}
              onExit={() => setActiveTask(null)}
              onPopOut={openPopOut}
              showControls
              onSessionComplete={refreshTasks}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
