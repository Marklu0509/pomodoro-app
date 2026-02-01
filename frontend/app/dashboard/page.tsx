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
    <div className="min-h-screen transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-6xl mx-auto p-8">
        <header className="grid gap-6 md:grid-cols-[1.3fr_0.7fr] mb-10">
          <div className="glass-card rounded-[2.5rem] p-8">
            <h1 className="mt-4 text-3xl md:text-4xl font-display font-semibold text-slate-900 dark:text-white">
              Stay focused.
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-300 max-w-lg">
              The clock counts the moments you chose your future self over distraction
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {focusModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveMode(mode)}
                  className={`rounded-2xl px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition-all ${
                    activeMode?.id === mode.id
                      ? "bg-slate-900/90 text-white shadow-lg shadow-slate-900/20 dark:bg-slate-200 dark:text-slate-900"
                      : "glass-pill text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {mode.name}
                </button>
              ))}
            </div>
            {tasks.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="mt-6 text-[10px] font-semibold text-rose-400 hover:text-rose-300 uppercase tracking-[0.25em] transition-colors"
              >
                Clear All Tasks
              </button>
            )}
          </div>

          <div className="glass-card rounded-[2.5rem] p-8 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Active Mode
              </p>
              <h2 className="mt-4 text-2xl font-display font-semibold text-slate-900 dark:text-white">
                {activeMode?.name || "Loading..."}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {activeMode
                  ? `${activeMode.workDuration} min focus · ${activeMode.shortBreakDuration} min break`
                  : "Select a focus profile to begin."}
              </p>
            </div>
            <button
              onClick={() => startFocusSession(null)}
              className="mt-6 rounded-2xl bg-slate-900 px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Quick Start Session
            </button>
          </div>
        </header>

        <section className="glass-card rounded-[2.5rem] p-6 md:p-8 mb-10">
          <form onSubmit={handleCreateTask} className="grid gap-4 md:grid-cols-[1fr_140px_auto] items-end">
            <div className="w-full">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] mb-2 ml-1">
                Task Title
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="glass-input w-full rounded-2xl px-4 py-4 text-sm"
                placeholder="What needs your attention?"
              />
            </div>
            <div className="w-full">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] mb-2 ml-1">
                Estimated times
              </label>
              <input
                type="number"
                min="1"
                value={newTaskEstimate}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setNewTaskEstimate(Number.isFinite(next) && next > 0 ? next : 1);
                }}
                className="glass-input w-full rounded-2xl px-4 py-4 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900/90 px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-white shadow-lg hover:brightness-110 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Add Task
            </button>
          </form>
        </section>

        <section className="grid gap-4 pb-20">
          {isLoading ? (
            <div className="glass-panel rounded-[2rem] py-10 text-center text-slate-500 dark:text-slate-300 font-semibold">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="glass-panel rounded-[2.5rem] border-2 border-dashed border-white/50 dark:border-white/10 py-20 text-center text-slate-500 dark:text-slate-400 italic">
              Your list is empty. Add a task to begin.
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className="glass-panel rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-[0_20px_50px_rgba(15,23,42,0.2)]"
              >
                <div className="flex-grow">
                  <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-sm font-semibold text-slate-400 mt-2">
                    {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Individual Delete Button - Hidden by default, visible on hover */}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Delete Task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>

                  {/* Focus Start Button */}
                  <button 
                    onClick={() => startFocusSession(task.id)} 
                    className="px-6 py-3 rounded-xl bg-slate-900/90 text-white font-semibold text-[10px] uppercase tracking-[0.25em] hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100"
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
