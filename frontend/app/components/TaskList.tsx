// frontend/app/components/TaskList.tsx
"use client";

import { useState } from "react";
import { useAppData } from "@/app/context/AppData";
import { Task } from "@/app/types/task";

interface TaskListProps {
  activeTaskId: number | null;
  onSelect: (task: Task | null) => void;
}

/**
 * Task creation + list + delete. Reads/writes through AppData context so the
 * data stays in sync with the timer on the same page.
 */
export default function TaskList({ activeTaskId, onSelect }: TaskListProps) {
  const { tasks, loading, createTask, deleteTask, deleteAllTasks } = useAppData();
  const [title, setTitle] = useState("");
  const [estimate, setEstimate] = useState(1);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask(title.trim(), estimate);
      setTitle("");
      setEstimate(1);
    } catch {
      alert("Failed to create task.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      if (activeTaskId === id) onSelect(null);
    } catch {
      alert("Failed to delete task.");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("⚠️ This permanently deletes ALL tasks. Continue?")) return;
    try {
      await deleteAllTasks();
      onSelect(null);
    } catch {
      alert("Failed to clear tasks.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create */}
      <form
        onSubmit={handleCreate}
        className="glass-card rounded-[2rem] p-5 grid gap-4 sm:grid-cols-[1fr_110px_auto] items-end"
      >
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] mb-2 ml-1">
            Task
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs your attention?"
            className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] mb-2 ml-1">
            🍅 Est.
          </label>
          <input
            type="number"
            min="1"
            value={estimate}
            onChange={(e) => {
              const n = Number(e.target.value);
              setEstimate(Number.isFinite(n) && n > 0 ? n : 1);
            }}
            className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-2xl bg-slate-900/90 px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white shadow-lg hover:brightness-110 dark:bg-slate-200 dark:text-slate-900"
        >
          Add
        </button>
      </form>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-panel rounded-[2rem] py-10 text-center text-slate-500 dark:text-slate-300 font-semibold">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass-panel rounded-[2rem] border-2 border-dashed border-white/50 dark:border-white/10 py-16 text-center text-slate-500 dark:text-slate-400 italic">
            Your list is empty. Add a task to begin.
          </div>
        ) : (
          tasks.map((task) => {
            const isActive = activeTaskId === task.id;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onSelect(isActive ? null : task)}
                className={`w-full text-left glass-panel rounded-[1.75rem] p-5 flex items-center justify-between gap-4 transition-all ${
                  isActive
                    ? "ring-2 ring-slate-900/70 dark:ring-slate-200/70"
                    : "hover:shadow-[0_16px_40px_rgba(15,23,42,0.15)]"
                }`}
              >
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-display font-semibold text-slate-900 dark:text-white">
                    {task.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
                    {isActive && (
                      <span className="ml-2 text-slate-600 dark:text-slate-300">
                        · selected
                      </span>
                    )}
                  </p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(task.id);
                  }}
                  className="shrink-0 p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Delete task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </span>
              </button>
            );
          })
        )}
        {tasks.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 uppercase tracking-[0.25em] transition-colors ml-2"
          >
            Clear all tasks
          </button>
        )}
      </div>
    </div>
  );
}
