// frontend/app/focus/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../utils/api";
import Timer from "../components/Timer";
import Navbar from "../components/Navbar";

// Define FocusMode Interface
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
  
  // Get IDs from URL
  const taskId = searchParams.get("taskId");
  const modeId = searchParams.get("modeId");

  const [activeMode, setActiveMode] = useState<FocusMode | null>(null);
  const [taskTitle, setTaskTitle] = useState<string>("Quick Focus");
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch data based on URL parameters
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the specific focus mode
        const modeRes = await api.get("/focus-modes");
        const selectedMode = modeRes.data.find((m: FocusMode) => m.id === Number(modeId)) || modeRes.data[0];
        setActiveMode(selectedMode);

        // Fetch task title if taskId exists
        if (taskId && taskId !== "null") {
          const taskRes = await api.get("/tasks");
          const currentTask = taskRes.data.find((t: any) => t.id === Number(taskId));
          if (currentTask) setTaskTitle(currentTask.title);
        }
      } catch (error) {
        console.error("Failed to load focus data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [taskId, modeId]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 dark:text-white">Loading focus session...</div>;
  if (!activeMode) return <div>Error loading mode.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500 flex flex-col">
      {/* Minimalistic Header */}
      <div className="p-6 flex justify-between items-center">
        <button 
          onClick={() => router.push("/dashboard")}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-sm flex items-center gap-2"
        >
          ← EXIT SESSION
        </button>
        <div className="text-sm font-black text-gray-300 dark:text-gray-700 tracking-widest uppercase">
          Currently Focusing
        </div>
        <div className="w-20"></div> {/* Spacer for symmetry */}
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-8">
        {/* Task Title Display */}
        <h1 className="text-2xl md:text-4xl font-black text-gray-800 dark:text-gray-100 mb-2 text-center">
          {taskTitle}
        </h1>
        
        {/* The Clean Timer Card */}
        <div className="w-full max-w-md">
          <Timer 
            taskId={taskId && taskId !== "null" ? Number(taskId) : null} 
            activeMode={activeMode} 
            onSessionComplete={() => {
              console.log("Session completed and saved!");
              // Note: We don't exit automatically, allowing user to continue
            }} 
          />
        </div>
      </div>
    </div>
  );
}

// Main page component wrapped in Suspense for Next.js searchParams
export default function FocusPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FocusContent />
    </Suspense>
  );
}