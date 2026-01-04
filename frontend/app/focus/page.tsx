// frontend/app/focus/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../utils/api";
import Timer from "../components/Timer";

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
      const modeRes = await api.get("/focus-modes");
      setModes(modeRes.data);
      setActiveMode(modeRes.data.find((m: any) => m.id === Number(modeIdFromUrl)) || modeRes.data[0]);
      if (taskId && taskId !== "null") {
        const tRes = await api.get("/tasks");
        const t = tRes.data.find((x: any) => x.id === Number(taskId));
        if (t) setTaskTitle(t.title);
      }
    };
    load();
  }, [taskId, modeIdFromUrl]);

  // ★ Popup window logic: Ensuring it's a small separate window
  const popOut = () => {
    const url = window.location.href + "&mini=true";
    window.open(url, "TimerPopup", "width=400,height=550,menubar=no,toolbar=no,location=no,status=no,resizable=yes");
  };

  if (!activeMode) return null;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-all ${isMini ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950 p-8'}`}>
      {!isMini && (
        <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-8 tracking-tighter">{taskTitle}</h1>
      )}
      <div className="w-full max-w-md">
        <Timer 
          key={activeMode.id}
          taskId={taskId && taskId !== "null" ? Number(taskId) : null}
          activeMode={activeMode}
          modes={modes}
          onModeChange={(m) => { setActiveMode(m); router.replace(`/focus?taskId=${taskId}&modeId=${m.id}`); }}
          onExit={() => router.push("/dashboard")}
          onPopOut={popOut}
          showControls={!isMini} // Hide the header inside the card when in mini window
          onSessionComplete={() => {}}
        />
      </div>
    </div>
  );
}

export default function FocusPage() {
  return <Suspense><FocusContent /></Suspense>;
}