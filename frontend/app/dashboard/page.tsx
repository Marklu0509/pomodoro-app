// frontend/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import { Task } from "../types/task"; 
import { useRouter } from "next/navigation";
import Timer from "../components/Timer"; 
import Navbar from "../components/Navbar"; 

export default function DashboardPage() {
  const router = useRouter();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEstimate, setNewTaskEstimate] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  // State to track which session is active
  // Can be a task ID (number), "FREE_MODE" (string), or null (inactive)
  const [activeSessionMode, setActiveSessionMode] = useState<number | "FREE_MODE" | null>(null);

  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await api.post("/tasks", {
        title: newTaskTitle,
        estimatedPomodoros: newTaskEstimate,
      });
      setTasks([response.data, ...tasks]); 
      setNewTaskTitle("");
      setNewTaskEstimate(1);
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task.");
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle timer for a specific task
  const toggleTimerForTask = (taskId: number) => {
    if (activeSessionMode === taskId) {
      setActiveSessionMode(null); // Close if already open
    } else {
      setActiveSessionMode(taskId); // Open for this task
    }
  };

  // Toggle Taskless / Free Focus Mode
  const toggleFreeMode = () => {
    if (activeSessionMode === "FREE_MODE") {
      setActiveSessionMode(null);
    } else {
      setActiveSessionMode("FREE_MODE");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header & Quick Focus Button */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
            <button
              onClick={toggleFreeMode}
              className={`px-6 py-3 rounded-lg font-bold shadow-sm transition-all ${
                activeSessionMode === "FREE_MODE" 
                  ? "bg-red-100 text-red-600 border border-red-200"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105"
              }`}
            >
              {activeSessionMode === "FREE_MODE" ? "Close Free Focus" : "⚡ Quick Focus (No Task)"}
            </button>
          </div>

          {/* Free Mode Timer Area */}
          {activeSessionMode === "FREE_MODE" && (
            <div className="mb-8 animate-fade-in">
              <Timer 
                taskId={null} // null indicates Free Mode
                onSessionComplete={() => {
                  fetchTasks(); // Refresh state even if no task updated
                }} 
              />
            </div>
          )}

          {/* Create Task Form */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Task</h2>
            <form onSubmit={handleCreateTask} className="flex gap-4 items-end">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-600 mb-1">Est. 🍅</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:bg-gray-400"
              >
                {isCreating ? "Adding..." : "Add"}
              </button>
            </form>
          </div>

          {/* Task List */}
          {isLoading ? (
            <p className="text-gray-500">Loading tasks...</p>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border transition-all ${
                    activeSessionMode === task.id ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{task.title}</h3>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span>Progress:</span>
                        <span className="font-medium text-gray-700">
                          {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        task.isCompleted 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {task.isCompleted ? "Completed" : "In Progress"}
                      </span>

                      <button
                        onClick={() => toggleTimerForTask(task.id)}
                        disabled={activeSessionMode === "FREE_MODE"} // Disable if Free Mode is active
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeSessionMode === task.id
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        } ${activeSessionMode === "FREE_MODE" ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {activeSessionMode === task.id ? "Close Timer" : "Start Focus"}
                      </button>
                    </div>
                  </div>

                  {activeSessionMode === task.id && (
                    <div className="mt-6 animate-fade-in">
                      <Timer 
                        taskId={task.id} 
                        onSessionComplete={() => {
                          fetchTasks(); 
                        }} 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}