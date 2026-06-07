// frontend/app/components/Navbar.tsx
"use client";

import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/30 dark:border-white/5 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <button
            className="text-xl font-display tracking-tight text-slate-900 dark:text-white"
            onClick={() => router.push("/focus")}
          >
            POMO<span className="text-slate-500 dark:text-slate-300">.</span>
          </button>
          <div className="hidden md:flex gap-6">
            {[
              { label: "Focus", href: "/focus" },
              { label: "Stats", href: "/stats" },
              { label: "Settings", href: "/settings" },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="text-sm font-semibold text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <button
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/");
            }}
            className="text-[10px] font-black text-slate-400 hover:text-rose-400 uppercase tracking-[0.2em] ml-2"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
