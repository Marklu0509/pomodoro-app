// frontend/app/focus/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../utils/api";
import Timer from "../components/Timer";
import ThemeToggle from "../components/ThemeToggle";

function FocusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const modeIdFromUrl = searchParams.get("modeId");
  const isMini = searchParams.get("mini") === "true";

  const [modes, setModes] = useState<any[]>([]);
  const [activeMode, setActiveMode] = useState<any | null>(null);
  const [taskTitle, setTaskTitle] = useState("Quick Focus");

  useEffect(() => {
    const load = async () => {
      try {
        const modeRes = await api.get("/focus-modes");
        setModes(modeRes.data);
        setActiveMode(modeRes.data.find((m: any) => m.id === Number(modeIdFromUrl)) || modeRes.data[0]);
        
        if (taskId && taskId !== "null") {
          const tRes = await api.get("/tasks");
          const t = tRes.data.find((x: any) => x.id === Number(taskId));
          if (t) setTaskTitle(t.title);
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, [taskId, modeIdFromUrl]);

  const popOut = () => {
    const url = window.location.href + "&mini=true";
    window.open(url, "TimerPopup", "width=400,height=550,menubar=no,toolbar=no,location=no,status=no,resizable=yes");
  };

  if (!activeMode) return null;

  return (
    // ★ Page Layout: Centered card, no external header
    <div className={`relative min-h-screen flex flex-col items-center justify-center transition-all ${isMini ? "p-4" : "p-8"}`}>
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-md">
        <Timer 
          key={activeMode.id}
          taskId={taskId && taskId !== "null" ? Number(taskId) : null}
          taskName={taskTitle} // ★ Pass the title here
          activeMode={activeMode}
          modes={modes}
          onModeChange={(m) => { setActiveMode(m); router.replace(`/focus?taskId=${taskId}&modeId=${m.id}`); }}
          onExit={() => router.push("/dashboard")}
          onPopOut={popOut}
          showControls={!isMini}
          onSessionComplete={() => {}}
        />
      </div>
    </div>
  );
}

export default function FocusPage() {
  return <Suspense><FocusContent /></Suspense>;
}
