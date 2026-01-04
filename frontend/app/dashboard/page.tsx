// frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../../utils/api";
import { Task } from "../../types/task"; 
import Navbar from "../components/Navbar"; 

// FocusMode interface synced with Backend and Timer component
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

  // --- Data Fetching ---
  // Memoized function to fetch all necessary data for the dashboard
  const initData = useCallback(async () => {
    try {
      const [taskRes, modeRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/focus-modes")
      ]);
      setTasks(taskRes.data);
      setFocusModes(modeRes.data);
      
      // Select the first mode as default if none is currently selected
      if (modeRes.data.length > 0 && !activeMode) {
        setActiveMode(modeRes.data[0]);
      }
    } catch (error) {
      console.error("Failed to initialize dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeMode]);

  // Initial load on component mount
  useEffect(() => {
    initData();
  }, [initData]);

  // --- Event Handlers ---

  /**
   * Navigates the user to the dedicated Pure Focus page
   * @param taskId - The ID of the task to focus on, or null for Quick Start
   */
  const startFocusSession = (taskId: number | null) => {
    if (!activeMode) {
      alert("Please select a focus mode first.");
      return;
    }
    // Redirecting to the clean focus view with necessary parameters
    router.push(`/focus?taskId=${taskId}&modeId=${activeMode.id}`);
  };

  /**
   * Handles the creation of a new task via the form
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
      initData(); // Refresh the list to show the new task
    } catch (error) {
      console.error("Task creation failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-8">
        
        {/* --- Phase 11: Focus Profile Selector --- */}
        <section className="flex flex-col items-center mb-12">
          <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-md">
            {focusModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  activeMode?.id === mode.id
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md scale-105"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
              >
                {mode.name}
              </button>
            ))}
            {/* Link to Settings to manage profiles */}
            <button 
              type="button"
              onClick={() => router.push('/settings')}
              className="px-4 py-2.5 text-gray-300 hover:text-blue-500 text-xs font-bold transition-colors"
            >
              + NEW
            </button>
          </div>
        </section>

        {/* --- Header Section --- */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 tracking-tighter">
              My Tasks
            </h1>
            <p className="text-gray-400 font-medium text-sm mt-1">
              Organize your day, one tomato at a time.
            </p>
          </div>
          
          {/* Quick Start for taskless focusing */}
          <button
            onClick={() => startFocusSession(null)}
            className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm tracking-widest shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all"
          >
            ⚡ QUICK START
          </button>
        </header>

        {/* --- Task Creation Form --- */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 mb-10">
          <form onSubmit={handleCreateTask} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">
                New Task Title
              </label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all dark:text-white placeholder:text-gray-300"
                placeholder="Finish the DevOps project documentation..."
              />
            </div>
            
            <div className="w-full md:w-32">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">
                Est. 🍅
              </label>
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
              className="w-full md:w-auto bg-gray-800 dark:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:opacity-90 transition-all"
            >
              ADD
            </button>
          </form>
        </section>

        {/* --- Task List Display --- */}
        <section className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400 font-bold animate-pulse">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 bg-gray-100/50 dark:bg-gray-800/30 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-400 font-medium">No tasks yet. Start by adding one above!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex justify-between items-center group hover:border-blue-300 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-400">
                      {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
                    </span>
                    {task.completedPomodoros >= task.estimatedPomodoros && (
                      <span className="text-[10px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-md uppercase">
                        Target Met
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => startFocusSession(task.id)}
                  className="px-8 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm"
                >
                  START FOCUS
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}