// frontend/app/components/Timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";

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
  theme: string;
}

interface TimerProps {
  taskId: number | null;
  taskName: string;
  activeMode: FocusMode;
  onSessionComplete: () => void;
  modes?: FocusMode[];
  onModeChange?: (mode: FocusMode) => void;
  onExit?: () => void;
  onPopOut?: () => void;
  showControls?: boolean;
}

export default function Timer({ 
  taskId, taskName, activeMode, onSessionComplete, 
  modes, onModeChange, onExit, onPopOut,
  showControls = true 
}: TimerProps) {
  const [status, setStatus] = useState<"WORK" | "SHORT_BREAK" | "LONG_BREAK">("WORK");
  const [timeLeft, setTimeLeft] = useState(activeMode.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = (audio: HTMLAudioElement | null) => {
    if (audio) { audio.pause(); audio.currentTime = 0; }
  };

  useEffect(() => {
    stopAudio(ambientAudioRef.current);
    chimeAudioRef.current = new Audio("/sounds/chime.mp3");
    chimeAudioRef.current.volume = 0.5;

    const alarmFile = `/sounds/alarm-${activeMode.alarmSound}.mp3`;
    alarmAudioRef.current = new Audio(alarmFile);
    alarmAudioRef.current.volume = 0.8;

    if (activeMode.ambientSound !== "none") {
      const isTicking = activeMode.ambientSound === "ticking";
      const soundPath = isTicking ? "/sounds/tick.mp3" : `/sounds/${activeMode.ambientSound}.mp3`;
      ambientAudioRef.current = new Audio(soundPath);
      ambientAudioRef.current.volume = activeMode.ambientVolume / 100;
      if (!isTicking) ambientAudioRef.current.loop = true;
    }

    setTimeLeft(activeMode.workDuration * 60);
    return () => stopAudio(ambientAudioRef.current);
  }, [activeMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;
          if (activeMode.alertAt25Percent && status === "WORK") {
            const total = activeMode.workDuration * 60;
            const milestones = [Math.floor(total * 0.75), Math.floor(total * 0.50), Math.floor(total * 0.25)];
            if (milestones.includes(nextTime)) chimeAudioRef.current?.play().catch(() => {});
          }
          if (nextTime <= 0) return 0;
          return nextTime;
        });

        if (timeLeft > 1 && activeMode.ambientSound === "ticking" && ambientAudioRef.current) {
            ambientAudioRef.current.currentTime = 0;
            ambientAudioRef.current.play().catch(() => {}); 
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, activeMode, status]);

  const handleTimerComplete = async () => {
    stopAudio(ambientAudioRef.current);
    alarmAudioRef.current?.play();
    setTimeout(() => stopAudio(alarmAudioRef.current), 5000);

    if (status === "WORK") {
      try {
        await api.post("/sessions", { durationSeconds: activeMode.workDuration * 60, taskId });
        onSessionComplete();
        setStatus("SHORT_BREAK");
        setTimeLeft(activeMode.shortBreakDuration * 60);
      } catch (e) { console.error("Session failed", e); }
    } else {
      setStatus("WORK");
      setTimeLeft(activeMode.workDuration * 60);
    }
  };

  /**
   * HELPERS: YouTube Embed Logic
   * Converts standard URL to Embed URL with Autoplay and Loop.
   */
  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return "";
    // Extracts video ID from common patterns like v=ID or short links
    const vid = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
    // autoplay=1 starts music, loop=1 & playlist ensures it repeats
    return `https://www.youtube.com/embed/${vid}?autoplay=1&controls=0&loop=1&playlist=${vid}`;
  };

  const currentColor = status === "WORK" ? "#ef4444" : "#3b82f6";

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-2xl flex flex-col items-center relative transition-all duration-500">
      
      {showControls && (
        <div className="w-full flex justify-between items-center mb-8 px-2">
          <button onClick={onExit} className="p-2.5 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-900 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>

          <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            {modes?.map((m) => (
              <button
                key={m.id}
                onClick={() => onModeChange?.(m)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                  activeMode.id === m.id ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-400"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <button onClick={onPopOut} className="p-2.5 text-gray-300 hover:text-blue-500 transition-colors bg-gray-50 dark:bg-gray-900 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </button>
        </div>
      )}

      {/* --- MUSIC RENDERER (YouTube Only) --- */}
      {isActive && status === "WORK" && activeMode.musicType === "youtube" && activeMode.musicUrl && (
        <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
          {/* YouTube Iframe - The simplest way to handle background music */}
          <iframe 
            src={getYouTubeEmbedUrl(activeMode.musicUrl)} 
            allow="autoplay" 
          />
        </div>
      )}

      <div className="text-[11px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase mb-4 px-6 text-center line-clamp-2">
        {taskName} <span className="mx-2 opacity-30">/</span> {status}
      </div>

      <div className="relative w-64 h-64 mb-10">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="4" className="dark:stroke-gray-800" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke={currentColor} strokeWidth="5" strokeLinecap="round"
            style={{
              strokeDasharray: 282.7,
              strokeDashoffset: 282.7 * (1 - timeLeft / ((status === "WORK" ? activeMode.workDuration : activeMode.shortBreakDuration) * 60)),
              transition: "stroke-dashoffset 1s linear"
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-mono font-bold text-gray-800 dark:text-gray-100 tracking-tighter">
            {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="flex gap-4 w-full px-6">
        <button
          onClick={() => {
            setIsActive(!isActive);
            if (isActive) stopAudio(ambientAudioRef.current);
            else if (status === "WORK" && activeMode.ambientSound !== "ticking") ambientAudioRef.current?.play().catch(() => {});
          }}
          className="flex-1 py-5 rounded-[1.5rem] font-black text-xs tracking-widest text-white shadow-xl active:scale-95 transition-all"
          style={{ backgroundColor: isActive ? "#f59e0b" : currentColor }}
        >
          {isActive ? "PAUSE" : "START"}
        </button>
        <button
          onClick={() => { setIsActive(false); stopAudio(ambientAudioRef.current); setTimeLeft(activeMode.workDuration * 60); }}
          className="px-8 py-5 rounded-[1.5rem] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-black text-xs active:scale-95 transition-all"
        >
          RESET
        </button>
      </div>
      
      <button onClick={() => setTimeLeft(2)} className="mt-8 text-[10px] font-bold text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors">
        Quick Test (2s)
      </button>
    </div>
  );
}