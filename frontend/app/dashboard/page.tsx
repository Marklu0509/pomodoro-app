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
  
  // --- State Management ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for creating tasks
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEstimate, setNewTaskEstimate] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // State to track which task has an active timer
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // --- Helper Functions ---

  // Function to fetch tasks from backend
  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      // Optional: Redirect to login if error (e.g., 401 Unauthorized)
      // router.push("/"); 
    } finally {
      setIsLoading(false);
    }
  };

  // Run fetching on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Handle creating a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await api.post("/tasks", {
        title: newTaskTitle,
        estimatedPomodoros: newTaskEstimate,
      });
      // Add new task to the top of the list
      setTasks([response.data, ...tasks]); 
      
      // Reset form
      setNewTaskTitle("");
      setNewTaskEstimate(1);
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task.");
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle timer visibility for a specific task
  const toggleTimerForTask = (taskId: number) => {
    if (activeTaskId === taskId) {
      setActiveTaskId(null); // Close if already open
    } else {
      setActiveTaskId(taskId); // Open the clicked one
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Navbar at the top (Full width) */}
      <Navbar />

      {/* 2. Main Content Area (Centered with padding) */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">My Tasks</h1>

          {/* Create Task Form */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-500">
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
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 transition-shadow"
                >
                  {/* Task Header */}
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
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        {activeTaskId === task.id ? "Close Timer" : "Start Focus"}
                      </button>
                    </div>
                  </div>

                  {/* Timer Component (Conditionally Rendered) */}
                  {activeTaskId === task.id && (
                    <Timer 
                      taskId={task.id} 
                      onSessionComplete={() => {
                        fetchTasks(); 
                        setActiveTaskId(null); 
                      }} 
                    />
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