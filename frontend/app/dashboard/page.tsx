// frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../../utils/api";
import { Task } from "../types/task"; 
import Navbar from "../components/Navbar"; 

/**
 * FocusMode interface defines the structure of user-created focus profiles.
 * This must sync with the Backend Prisma schema and Timer component props.
 */
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
  theme: string; // Added to support your theme preference logic
}

export default function DashboardPage() {
  const router = useRouter();
  
  // --- State Management ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusModes, setFocusModes] = useState<FocusMode[]>([]);
  const [activeMode, setActiveMode] = useState<FocusMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEstimate, setNewTaskEstimate] = useState(1);

  /**
   * Fetches all tasks and focus profiles from the backend.
   * Wrapped in useCallback to prevent unnecessary re-renders when passed to effects.
   */
  const initData = useCallback(async () => {
    try {
      const [taskRes, modeRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/focus-modes")
      ]);
      setTasks(taskRes.data);
      setFocusModes(modeRes.data);
      
      // Select the first mode as default if nothing is selected yet
      if (modeRes.data.length > 0 && !activeMode) {
        setActiveMode(modeRes.data[0]);
      }
    } catch (error) {
      console.error("Initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeMode]);

  // Initial data fetch on component mount
  useEffect(() => {
    initData();
  }, [initData]);

  /**
   * Routes the user to the dedicated Pure Focus page.
   * Passes taskId and modeId via query parameters.
   */
  const startFocusSession = (taskId: number | null) => {
    if (!activeMode) {
      alert("Please select a focus profile first.");
      return;
    }
    // Navigating to the /focus route designed for deep concentration
    router.push(`/focus?taskId=${taskId}&modeId=${activeMode.id}`);
  };

  /**
   * Handles new task creation and refreshes the task list.
   */
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    try {
      await api.post("/tasks", {
        title: newTaskTitle,
        estimatedPomodoros: newTaskEstimate,
      });
      setNewTaskTitle("");
      setNewTaskEstimate(1);
      initData(); // Refresh list to show the new entry
    } catch (error) {
      console.error("Task creation failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-8">
        
        {/* Profile Selector Section */}
        <section className="flex flex-col items-center mb-10">
          <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-md border border-white/20">
            {focusModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeMode?.id === mode.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md scale-105"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                {mode.name}
              </button>
            ))}
            <button 
              type="button"
              onClick={() => router.push('/settings')}
              className="px-4 py-2.5 text-gray-300 hover:text-blue-500 text-[10px] font-black transition-colors"
            >
              + NEW
            </button>
          </div>
        </section>

        {/* Dashboard Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 tracking-tighter">
              Dashboard
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-1">Manage your productivity and focus goals.</p>
          </div>
          
          <button
            type="button"
            onClick={() => startFocusSession(null)}
            className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs tracking-widest shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all"
          >
            ⚡ QUICK START
          </button>
        </header>

        {/* Task Entry Form */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 mb-10">
          <form onSubmit={handleCreateTask} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Task Title</label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                placeholder="What's your next focus goal?"
              />
            </div>
            
            <div className="w-full md:w-32">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Est. 🍅</label>
              <input 
                type="number" 
                min="1"
                value={newTaskEstimate}
                onChange={(e) => setNewTaskEstimate(parseInt(e.target.value))}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
              />
            </div>

            <button 
              type="submit" 
              className="w-full md:w-auto bg-gray-800 dark:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest hover:opacity-90 transition-all"
            >
              ADD
            </button>
          </form>
        </section>

        {/* Task List Grid */}
        <section className="grid gap-4 pb-20">
          {isLoading ? (
            <div className="text-center py-10 text-gray-400 font-bold">Loading your workflow...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 bg-gray-100/50 dark:bg-gray-800/30 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-400 font-medium italic">No tasks yet. Create one above to begin.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:border-blue-300 dark:hover:border-blue-500/50 transition-all shadow-sm"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-sm font-bold text-gray-400 mt-1">
                    {task.completedPomodoros} / {task.estimatedPomodoros} 🍅 Completed
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => startFocusSession(task.id)}
                  className="px-8 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  Start Focus
                </button>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}