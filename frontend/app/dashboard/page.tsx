// frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import { Task } from "../../types/task"; 
import Timer from "../components/Timer"; 
import Navbar from "../components/Navbar"; 

interface FocusMode {
  id: number;
  name: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  ambientVolume: number;
  ambientSound: string;
  alarmSound: string;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusModes, setFocusModes] = useState<FocusMode[]>([]);
  const [activeMode, setActiveMode] = useState<FocusMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSessionTaskId, setActiveSessionTaskId] = useState<number | "FREE_MODE" | null>(null);

  // 1. Load both Tasks and Modes
  const initData = async () => {
    try {
      const [taskRes, modeRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/focus-modes")
      ]);
      setTasks(taskRes.data);
      setFocusModes(modeRes.data);
      
      // Set the first mode as active by default
      if (modeRes.data.length > 0 && !activeMode) {
        setActiveMode(modeRes.data[0]);
      }
    } catch (error) {
      console.error("Initialization failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        
        {/* ★★★ 這裡就是「選擇模式」的區域 ★★★ */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-sm">
            {focusModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeMode?.id === mode.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md scale-105"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest font-bold">Select Focus Profile</p>
        </div>

        {/* ... 其餘代碼 (Quick Start 按鈕與 Task 列表) ... */}
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100">Dashboard</h1>
            <button
                onClick={() => setActiveSessionTaskId(activeSessionTaskId === "FREE_MODE" ? null : "FREE_MODE")}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold"
            >
                {activeSessionTaskId === "FREE_MODE" ? "Close" : "⚡ Quick Start"}
            </button>
        </div>

        {activeSessionTaskId === "FREE_MODE" && activeMode && (
          <Timer taskId={null} activeMode={activeMode} onSessionComplete={initData} />
        )}

        {/* Task 列表渲染同理，傳入 activeMode */}
      </div>
    </div>
  );
}