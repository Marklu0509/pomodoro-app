// frontend/app/components/Navbar.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../../utils/api";

export default function Navbar() {
  const router = useRouter();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const initTheme = async () => {
      try {
        const res = await api.get("/settings");
        const { theme } = res.data;
        
        const root = window.document.documentElement;
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (theme === "dark" || (theme === "system" && systemDark)) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      } catch (err) {
        console.error("Theme init failed", err);
      }
    };
    
    initTheme();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  // navigate to main page (Dashboard)
  const goHome = () => {
    router.push("/dashboard");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
      {/* 
        1.  onClick={goHome} clickable
        2.  cursor-pointer 
        3.  hover 
      */}
      <div 
        onClick={goHome} 
        className="flex items-center gap-2 cursor-pointer group"
      >
        <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
          <span className="text-white font-bold text-xl">🍅</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">
            Pomodoro Focus
          </span>
          {/*  Keep going ( linking) */}
          <span className="text-xs text-gray-400 font-medium group-hover:text-gray-600">
            Keep going, stay focused.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/stats")}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
        >
          Stats
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
        >
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 hover:text-red-700 px-4 py-2 border border-red-100 rounded-md hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}