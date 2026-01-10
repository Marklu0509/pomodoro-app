// frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../../utils/api";
import { Task } from "../types/task"; 
import Navbar from "../components/Navbar"; 

/**
 * Interface for Focus Profiles.
 * Ensure this matches the backend schema and Timer requirements.
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
   * Fetch initial data: Tasks and Focus Profiles
   */
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
    } catch (e) { 
      console.error("Data load error", e); 
    } finally { 
      setIsLoading(false); 
    }
  }, [activeMode]);

  useEffect(() => { 
    initData(); 
  }, [initData]);

  // --- Logic Handlers ---

  /**
   * Redirects user to the pure focus page with task/mode params.
   */
  const startFocusSession = (taskId: number | null) => {
    if (!activeMode) return;
    router.push(`/focus?taskId=${taskId}&modeId=${activeMode.id}`);
  };

  /**
   * Creates a new task and refreshes the list.
   */
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await api.post("/tasks", { 
        title: newTaskTitle, 
        estimatedPomodoros: newTaskEstimate 
      });
      setNewTaskTitle("");
      setNewTaskEstimate(1);
      initData();
    } catch (e) { 
      console.error("Failed to create task", e); 
    }
  };

  /**
   * Deletes a specific task after confirmation.
   * Optimistic update used for immediate UI response.
   */
  const handleDeleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id)); // Remove from local state
    } catch (e) { 
      alert("Failed to delete task."); 
    }
  };

  /**
   * Deletes all tasks for the user.
   */
  const handleDeleteAll = async () => {
    if (!confirm("⚠️ WARNING: This will permanently delete ALL tasks. Continue?")) return;
    try {
      await api.delete("/tasks/all");
      setTasks([]); // Clear local state
    } catch (e) { 
      alert("Failed to clear all tasks."); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-8">
        
        {/* Profile Selector Section */}
        <section className="flex flex-col items-center mb-10">
          <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-md">
            {focusModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeMode?.id === mode.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 shadow-md scale-105"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>
        </section>

        {/* Dashboard Header: Title and Bulk Actions */}
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tighter">Tasks</h1>
            {tasks.length > 0 && (
              <button 
                onClick={handleDeleteAll}
                className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest mt-2 transition-colors"
              >
                × Clear All Tasks
              </button>
            )}
          </div>
          <button 
            onClick={() => startFocusSession(null)} 
            className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs tracking-widest shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all"
          >
            ⚡ QUICK START
          </button>
        </header>

        {/* Task Creation Form */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 mb-10">
          <form onSubmit={handleCreateTask} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Task Title</label>
              <input 
                type="text" 
                value={newTaskTitle} 
                onChange={(e) => setNewTaskTitle(e.target.value)} 
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-gray-900 dark:text-blue-400 placeholder-gray-500 dark:placeholder-blue-400 focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="What are you working on?"
              />
            </div>
            <div className="w-full md:w-28">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Est. 🍅</label>
              <input 
                type="number" 
                min="1"
                value={newTaskEstimate} 
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setNewTaskEstimate(Number.isFinite(next) && next > 0 ? next : 1);
                }} 
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-gray-900 dark:text-blue-400"
              />
            </div>
            <button type="submit" className="w-full md:w-auto bg-gray-800 dark:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest hover:opacity-90">
              ADD
            </button>
          </form>
        </section>

        {/* Task List Grid */}
        <section className="grid gap-4 pb-20">
          {isLoading ? (
            <div className="text-center py-10 text-gray-400 font-bold">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 bg-gray-100/50 dark:bg-gray-800/30 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 italic">
              Your list is empty. Add a task to begin.
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:border-blue-300 dark:hover:border-blue-500/50 transition-all shadow-sm"
              >
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-sm font-bold text-gray-400 mt-1">
                    {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Individual Delete Button - Hidden by default, visible on hover */}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>

                  {/* Focus Start Button */}
                  <button 
                    onClick={() => startFocusSession(task.id)} 
                    className="px-8 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    START
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
