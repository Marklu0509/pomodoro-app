// frontend/app/components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, ThemePreference } from "../../utils/theme";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export default function ThemeToggle({ className = "", compact = false }: ThemeToggleProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const savedTheme = getStoredTheme();
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const handleThemeChange = (theme: ThemePreference) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

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

  const sizeClass = compact ? "w-8 h-8 text-sm" : "w-9 h-9 text-sm";

  return (
    <div className={`glass-pill flex items-center gap-1 p-1 ${className}`}>
      {(
        [
          { id: "light", icon: "☀️" },
          { id: "dark", icon: "🌙" },
          { id: "system", icon: "💻" },
        ] as const satisfies ReadonlyArray<{ id: ThemePreference; icon: string }>
      ).map((t) => (
        <button
          key={t.id}
          onClick={() => handleThemeChange(t.id)}
          className={`${sizeClass} flex items-center justify-center rounded-lg transition-all ${
            currentTheme === t.id
              ? "bg-white/90 dark:bg-white/15 text-slate-900 dark:text-white shadow-md"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title={`Switch to ${t.id} mode`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
