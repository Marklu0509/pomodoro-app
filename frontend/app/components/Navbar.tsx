// frontend/app/components/Navbar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { applyTheme, getStoredTheme, ThemePreference } from "../../utils/theme";

export default function Navbar() {
  const [currentTheme, setCurrentTheme] = useState<ThemePreference>("system");
  const router = useRouter();

  // 1. Initial Load: Get theme from localStorage
  useEffect(() => {
    const savedTheme = getStoredTheme();
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // 2. Handle Theme Toggle
  const handleThemeChange = (theme: ThemePreference) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  // 3. React to system theme changes when in "system" mode
  useEffect(() => {
    if (currentTheme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, [currentTheme]);

  return (
    <nav className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-tighter text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => router.push('/dashboard')}>
            POMO.
          </span>
          <div className="hidden md:flex gap-6">
            <button onClick={() => router.push('/dashboard')} className="text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors">Dashboard</button>
            <button onClick={() => router.push('/settings')} className="text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors">Settings</button>
          </div>
        </div>

        {/* --- Phase 17: Theme Switcher UI --- */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            {[
              { id: 'light', icon: '☀️' },
              { id: 'dark', icon: '🌙' },
              { id: 'system', icon: '💻' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all ${
                  currentTheme === t.id 
                    ? "bg-white dark:bg-gray-700 shadow-sm scale-110" 
                    : "opacity-40 hover:opacity-100"
                }`}
                title={`Switch to ${t.id} mode`}
              >
                {t.icon}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
            className="text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-widest ml-2"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
