// frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../../utils/api";
import { Task } from "../types/task"; 
import Navbar from "../components/Navbar"; 

// Profile interface MUST match your database and settings
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
  const router = useRouter();
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
      if (modeRes.data.length > 0 && !activeMode) {
        setActiveMode(modeRes.data[0]);
      }
    } catch (e) { console.error("Data load error", e); }
    finally { setIsLoading(false); }
  }, [activeMode]);

  useEffect(() => { initData(); }, [initData]);

  // Navigate to the pure focus page
  const startFocusSession = (taskId: number | null) => {
    if (!activeMode) return;
    router.push(`/focus?taskId=${taskId}&modeId=${activeMode.id}`);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await api.post("/tasks", { title: newTaskTitle, estimatedPomodoros: newTaskEstimate });
      setNewTaskTitle("");
      initData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <main className="max-w-4xl mx-auto p-8">
        {/* Profile Selector */}
        <section className="flex flex-col items-center mb-10">
          <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-md">
            {focusModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeMode?.id === mode.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 shadow-md"
                    : "text-gray-400"
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>
        </section>

        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tighter">Tasks</h1>
          <button onClick={() => startFocusSession(null)} className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs tracking-widest shadow-xl">
            ⚡ QUICK START
          </button>
        </header>

        {/* Task Form */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 mb-10">
          <form onSubmit={handleCreateTask} className="flex gap-4 items-end">
            <div className="flex-grow">
              <input 
                type="text" 
                value={newTaskTitle} 
                onChange={(e) => setNewTaskTitle(e.target.value)} 
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white"
                placeholder="New Task..."
              />
            </div>
            <button type="submit" className="bg-gray-800 dark:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs">ADD</button>
          </form>
        </section>

        {/* List */}
        <section className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{task.title}</h3>
                <p className="text-sm font-bold text-gray-400">{task.completedPomodoros} / {task.estimatedPomodoros} 🍅</p>
              </div>
              <button onClick={() => startFocusSession(task.id)} className="px-8 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase">
                START
              </button>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
