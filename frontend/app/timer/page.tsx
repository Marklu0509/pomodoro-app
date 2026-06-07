// frontend/app/timer/page.tsx
// Minimal standalone timer for the pop-out window (no navbar / chrome).
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/utils/api";
import Timer from "@/app/components/Timer";
import ThemeToggle from "@/app/components/ThemeToggle";
import { FocusMode } from "@/app/types/focus-mode";

function TimerPopupContent() {
  const params = useSearchParams();
  const taskId = params.get("taskId");
  const modeId = params.get("modeId");

  const [mode, setMode] = useState<FocusMode | null>(null);
  const [taskName, setTaskName] = useState("Quick Focus");

  useEffect(() => {
    (async () => {
      try {
        const modeRes = await api.get("/focus-modes");
        const modes: FocusMode[] = modeRes.data;
        setMode(modes.find((m) => m.id === Number(modeId)) ?? modes[0] ?? null);

        if (taskId && taskId !== "null") {
          const taskRes = await api.get("/tasks");
          const t = taskRes.data.find((x: { id: number }) => x.id === Number(taskId));
          if (t) setTaskName(t.title);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [taskId, modeId]);

  if (!mode) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-md">
        <Timer
          key={mode.id}
          taskId={taskId && taskId !== "null" ? Number(taskId) : null}
          taskName={taskName}
          activeMode={mode}
          showControls={false}
          onSessionComplete={() => {}}
        />
      </div>
    </div>
  );
}

export default function TimerPopupPage() {
  return (
    <Suspense>
      <TimerPopupContent />
    </Suspense>
  );
}
