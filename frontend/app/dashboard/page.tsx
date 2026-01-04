// frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; // Import router
import api from "../../utils/api";
import { Task } from "../types/task"; 
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
  alertAt25Percent: boolean;
  musicUrl: string | null;
  musicType: string;
}

export default function DashboardPage() {
  const router = useRouter(); // Initialize router
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusModes, setFocusModes] = useState<FocusMode[]>([]);
  const [activeMode, setActiveMode] = useState<FocusMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEstimate, setNewTaskEstimate] = useState(1);

  const initData = useCallback(async () => {
    try {
      const [taskRes, modeRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/focus-modes")
      ]);
      setTasks(taskRes.data);
      setFocusModes(modeRes.data);
      if (modeRes.data.length > 0 && !activeMode) setActiveMode(modeRes.data[0]);
    } catch (error) {
      console.error("Init failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeMode]);

  useEffect(() => { initData(); }, [initData]);

  // ★ New: Function to enter focus mode page
  const startFocusSession = (taskId: number | null) => {
    if (!activeMode) return;
    // Navigate to /focus with query parameters
    router.push(`/focus?taskId=${taskId}&modeId=${activeMode.id}`);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await api.post("/tasks", { title: newTaskTitle, estimatedPomodoros: newTaskEstimate });
      setNewTaskTitle("");
      initData();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        
        {/* Profile Selector */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-sm">
            {focusModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeMode?.id === mode.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100">Dashboard</h1>
          {/* ★ QUICK START: Navigate to Focus Page */}
          <button
            onClick={() => startFocusSession(null)}
            className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm tracking-widest shadow-lg hover:scale-105 transition-all"
          >
            ⚡ QUICK START
          </button>
        </div>

        {/* Task Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <form onSubmit={handleCreateTask} className="flex gap-4 items-end">
            <div className="flex-grow">
              <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">New Task</label>
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white" placeholder="What's next?" />
            </div>
            <button type="submit" className="bg-gray-800 dark:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold">Add</button>
          </form>
        </div>

        {/* Task List */}
        <div className="grid gap-4">
          {isLoading ? (
            <p className="text-center">Loading...</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:border-blue-200 transition-all">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{task.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{task.completedPomodoros} / {task.estimatedPomodoros} 🍅</p>
                </div>
                {/* ★ FOCUS BUTTON: Navigate to Focus Page */}
                <button
                  onClick={() => startFocusSession(task.id)}
                  className="px-8 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all"
                >
                  START
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}