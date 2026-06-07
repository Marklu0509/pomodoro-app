// frontend/app/context/AppData.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "@/utils/api";
import { Task } from "@/app/types/task";
import { FocusMode } from "@/app/types/focus-mode";

interface AppDataValue {
  tasks: Task[];
  focusModes: FocusMode[];
  activeMode: FocusMode | null;
  loading: boolean;
  setActiveMode: (mode: FocusMode) => void;
  refreshTasks: () => Promise<void>;
  refreshModes: () => Promise<void>;
  createTask: (title: string, estimatedPomodoros: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  deleteAllTasks: () => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

/**
 * Fetches tasks + focus modes ONCE and shares them across every authenticated
 * page, replacing the per-page duplicated fetching that made the app messy.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusModes, setFocusModes] = useState<FocusMode[]>([]);
  const [activeMode, setActiveMode] = useState<FocusMode | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTasks = useCallback(async () => {
    const res = await api.get("/tasks");
    setTasks(res.data);
  }, []);

  const refreshModes = useCallback(async () => {
    const res = await api.get("/focus-modes");
    setFocusModes(res.data);
    setActiveMode((prev) => prev ?? res.data[0] ?? null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([refreshTasks(), refreshModes()]);
      } catch (e) {
        console.error("Failed to load app data", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshTasks, refreshModes]);

  const createTask = useCallback(
    async (title: string, estimatedPomodoros: number) => {
      await api.post("/tasks", { title, estimatedPomodoros });
      await refreshTasks();
    },
    [refreshTasks],
  );

  const deleteTask = useCallback(async (id: number) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const deleteAllTasks = useCallback(async () => {
    await api.delete("/tasks/all");
    setTasks([]);
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        tasks,
        focusModes,
        activeMode,
        loading,
        setActiveMode,
        refreshTasks,
        refreshModes,
        createTask,
        deleteTask,
        deleteAllTasks,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return ctx;
}
