// frontend/app/focus/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../utils/api";
import Timer from "../components/Timer";

interface FocusMode {
  id: number;
  name: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  ambientVolume: number;
  ambientSound: string;
  alarmSound: string;
  alertAt25Percent: boolean;
  musicUrl: string | null;
  musicType: string;
}

function FocusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const taskId = searchParams.get("taskId");
  const modeIdFromUrl = searchParams.get("modeId");
  const isMiniMode = searchParams.get("mini") === "true"; // ★ Check if we are in mini window

  const [modes, setModes] = useState<FocusMode[]>([]);
  const [activeMode, setActiveMode] = useState<FocusMode | null>(null);
  const [taskTitle, setTaskTitle] = useState<string>("Quick Focus");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initFocusPage = async () => {
      try {
        const [modeRes, taskRes] = await Promise.all([
          api.get("/focus-modes"),
          taskId && taskId !== "null" ? api.get("/tasks") : Promise.resolve({ data: [] })
        ]);
        setModes(modeRes.data);
        const initialMode = modeRes.data.find((m: FocusMode) => m.id === Number(modeIdFromUrl)) || modeRes.data[0];
        setActiveMode(initialMode);
        if (taskId && taskId !== "null") {
          const currentTask = taskRes.data.find((t: any) => t.id === Number(taskId));
          if (currentTask) setTaskTitle(currentTask.title);
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    initFocusPage();
  }, [taskId, modeIdFromUrl]);

  // ★ Function to open the current timer in a mini popup window
  const openPopOut = () => {
    const width = 450;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    // Open the same URL but append &mini=true
    window.open(
      window.location.href + "&mini=true",
      "FocusMini",
      `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=no,status=no,location=no`
    );
  };

  if (isLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;
  if (!activeMode) return <div>Error</div>;

  // ★ MINI MODE UI (Only the Timer)
  if (isMiniMode) {
    return (
      <div className="h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full">
          <Timer 
            key={activeMode.id}
            taskId={taskId && taskId !== "null" ? Number(taskId) : null} 
            activeMode={activeMode} 
            onSessionComplete={() => {}} 
          />
        </div>
      </div>
    );
  }

  // ★ STANDARD FOCUS MODE UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-700 flex flex-col">
      
      {/* Header: Exit on Left, Modes in Middle, Pop-out on Right */}
      <div className="p-6 flex justify-between items-center">
        {/* Left: Exit Icon */}
        <button 
          onClick={() => router.push("/dashboard")}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Exit Session"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>

        {/* Middle: Mode Switcher */}
        <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl backdrop-blur-md">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setActiveMode(m);
                router.replace(`/focus?taskId=${taskId}&modeId=${m.id}`);
              }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                activeMode.id === m.id
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-500"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Right: Pop-out Icon */}
        <button 
          onClick={openPopOut}
          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
          title="Open Mini Window"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-8 -mt-12">
        <h1 className="text-3xl md:text-5xl font-black text-gray-800 dark:text-gray-100 mb-4 tracking-tighter text-center">
          {taskTitle}
        </h1>
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
          <Timer 
            key={activeMode.id}
            taskId={taskId && taskId !== "null" ? Number(taskId) : null} 
            activeMode={activeMode} 
            onSessionComplete={() => {}} 
          />
        </div>
      </div>
    </div>
  );
}

export default function FocusPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FocusContent />
    </Suspense>
  );
}