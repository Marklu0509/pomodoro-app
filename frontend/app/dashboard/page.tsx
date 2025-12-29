// frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import { Task } from "../../types/task"; 
import Timer from "../components/Timer"; 
import Navbar from "../components/Navbar"; 

// Local interface for FocusMode
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
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEstimate, setNewTaskEstimate] = useState(1);
  const [activeSessionTaskId, setActiveSessionTaskId] = useState<number | "FREE_MODE" | null>(null);

  // 1. Fetch initial data (Tasks & Focus Modes)
  useEffect(() => {
    const initData = async () => {
      try {
        const [taskRes, modeRes] = await Promise.all([
          api.get("/tasks"),
          api.get("/focus-modes")
        ]);
        setTasks(taskRes.data);
        setFocusModes(modeRes.data);
        
        // Default to the first mode (or the one marked isDefault)
        if (modeRes.data.length > 0) {
          setActiveMode(modeRes.data[0]);
        }
      } catch (error) {
        console.error("Initialization failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const response = await api.post("/tasks", {
        title: newTaskTitle,
        estimatedPomodoros: newTaskEstimate,
      });
      setTasks([response.data, ...tasks]); 
      setNewTaskTitle("");
    } catch (error) { console.error("Task creation failed", error); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        
        {/* --- Phase 11: Mode Selection Tabs --- */}
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
            {/* Shortcut to Settings to add more */}
            <button 
              onClick={() => window.location.href='/settings'}
              className="px-4 py-2.5 text-gray-400 hover:text-blue-500 text-sm font-bold"
            >
              + New
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tight">Dashboard</h1>
          <button
            onClick={() => setActiveSessionTaskId(activeSessionTaskId === "FREE_MODE" ? null : "FREE_MODE")}
            className={`px-6 py-3 rounded-2xl font-black text-sm tracking-wider transition-all ${
              activeSessionTaskId === "FREE_MODE" 
                ? "bg-red-100 text-red-600 border border-red-200"
                : "bg-blue-600 text-white shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            }`}
          >
            {activeSessionTaskId === "FREE_MODE" ? "CLOSE TIMER" : "⚡ QUICK START"}
          </button>
        </div>

        {/* Timer Display for Free Mode */}
        {activeSessionTaskId === "FREE_MODE" && activeMode && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <Timer 
              taskId={null} 
              activeMode={activeMode} // ★ Pass the selected profile
              onSessionComplete={() => {}} 
            />
          </div>
        )}

        {/* Add Task Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <form onSubmit={handleCreateTask} className="flex gap-4 items-end">
            <div className="flex-grow">
              <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Task Title</label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                placeholder="What are you working on?"
              />
            </div>
            <button type="submit" className="bg-gray-800 dark:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all">
              Add
            </button>
          </form>
        </div>

        {/* Task List */}
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{task.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{task.completedPomodoros} / {task.estimatedPomodoros} Pomodoros</p>
                </div>
                <button
                  onClick={() => setActiveSessionTaskId(activeSessionTaskId === task.id ? null : task.id)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeSessionTaskId === task.id ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  {activeSessionTaskId === task.id ? "Close" : "Focus"}
                </button>
              </div>
              {activeSessionTaskId === task.id && activeMode && (
                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700">
                  <Timer taskId={task.id} activeMode={activeMode} onSessionComplete={initData} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}