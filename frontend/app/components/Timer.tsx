// frontend/app/components/Timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";

/**
 * Interface representing a Focus Profile configuration.
 */
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

/**
 * Props for the Timer component.
 */
interface TimerProps {
  taskId: number | null;
  taskName: string; // The display name of the current task or "Quick Focus"
  activeMode: FocusMode; // Currently selected profile configuration
  onSessionComplete: () => void; // Callback to refresh data after a pomodoro ends
  modes?: FocusMode[]; // Optional list for the integrated mode switcher
  onModeChange?: (mode: FocusMode) => void;
  onExit?: () => void; // Callback for the exit icon
  onPopOut?: () => void; // Callback for the mini-window icon
  showControls?: boolean; // Whether to show the top control bar (hidden in mini mode)
}

export default function Timer({ 
  taskId, taskName, activeMode, onSessionComplete, 
  modes, onModeChange, onExit, onPopOut,
  showControls = true 
}: TimerProps) {
  // --- States ---
  const [status, setStatus] = useState<"WORK" | "SHORT_BREAK" | "LONG_BREAK">("WORK");
  const [timeLeft, setTimeLeft] = useState(activeMode.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  
  // --- Audio Refs ---
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Helper: Stop and reset an audio reference.
   */
  const stopAudio = (audio: HTMLAudioElement | null) => {
    if (audio) { audio.pause(); audio.currentTime = 0; }
  };

  /**
   * Effect: Setup audio and timer when the mode changes.
   */
  useEffect(() => {
    stopAudio(ambientAudioRef.current);
    
    // Setup notification sound for 25/50/75% milestones
    chimeAudioRef.current = new Audio("/sounds/chime.mp3");
    chimeAudioRef.current.volume = 0.5;

    // Setup final alarm sound based on profile settings
    const alarmFile = `/sounds/alarm-${activeMode.alarmSound}.mp3`;
    alarmAudioRef.current = new Audio(alarmFile);
    alarmAudioRef.current.volume = 0.8;

    // Setup ambient background sound (e.g., rain, ticking)
    if (activeMode.ambientSound !== "none") {
      const isTicking = activeMode.ambientSound === "ticking";
      const soundPath = isTicking ? "/sounds/tick.mp3" : `/sounds/${activeMode.ambientSound}.mp3`;
      ambientAudioRef.current = new Audio(soundPath);
      ambientAudioRef.current.volume = activeMode.ambientVolume / 100;
      if (!isTicking) ambientAudioRef.current.loop = true;
    }

    // Sync timer time with the new mode duration
    setTimeLeft(activeMode.workDuration * 60);
    return () => stopAudio(ambientAudioRef.current);
  }, [activeMode]);

  /**
   * Effect: Core Timer Interval Logic
   */
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;

          // Milestone alerts (Chime at 75%, 50%, 25% remaining)
          if (activeMode.alertAt25Percent && status === "WORK") {
            const total = activeMode.workDuration * 60;
            const milestones = [Math.floor(total * 0.75), Math.floor(total * 0.50), Math.floor(total * 0.25)];
            if (milestones.includes(nextTime)) {
               chimeAudioRef.current?.play().catch(() => {});
            }
          }

          if (nextTime <= 0) return 0;
          return nextTime;
        });

        // Trigger discrete ticking sound every second if mode is "ticking"
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

  /**
   * Handles session completion, database updates, and transitions to break.
   */
  const handleTimerComplete = async () => {
    stopAudio(ambientAudioRef.current);
    alarmAudioRef.current?.play();
    
    // Automatically stop alarm after 5 seconds
    setTimeout(() => stopAudio(alarmAudioRef.current), 5000);

    if (status === "WORK") {
      try {
        await api.post("/sessions", { durationSeconds: activeMode.workDuration * 60, taskId });
        onSessionComplete(); // Refresh parent data
        
        // Transition to Break Mode
        setStatus("SHORT_BREAK");
        setTimeLeft(activeMode.shortBreakDuration * 60);
      } catch (e) { console.error("Session recording failed", e); }
    } else {
      // Transition back to Work Mode
      setStatus("WORK");
      setTimeLeft(activeMode.workDuration * 60);
    }
  };

  /**
   * Helper: Formats URL for YouTube/Spotify embed playback.
   */
  const getMusicUrl = (type: string, url: string | null) => {
    if (!url) return "";
    if (type === "youtube") {
      const vid = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
      return `https://www.youtube.com/embed/${vid}?autoplay=1&controls=0&loop=1&playlist=${vid}`;
    }
    if (type === "spotify") {
      return url.replace("open.spotify.com", "open.spotify.com/embed");
    }
    return url;
  };

  const currentColor = status === "WORK" ? "#ef4444" : "#3b82f6";

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-2xl flex flex-col items-center relative transition-all duration-500">
      
      {/* Integrated Header Controls */}
      {showControls && (
        <div className="w-full flex justify-between items-center mb-8 px-2">
          {/* Exit Button */}
          <button onClick={onExit} className="p-2.5 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-900 rounded-xl" title="Exit Session">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>

          {/* Mini Mode Selector */}
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

          {/* Pop-out Mini Window Button */}
          <button onClick={onPopOut} className="p-2.5 text-gray-300 hover:text-blue-500 transition-colors bg-gray-50 dark:bg-gray-900 rounded-xl" title="Pop-out Window">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </button>
        </div>
      )}

      {/* Hidden Music Player Layer */}
      {isActive && status === "WORK" && activeMode.musicType !== "none" && activeMode.musicUrl && (
        <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
          {activeMode.musicType === "mp3" ? (
            <audio src={activeMode.musicUrl} autoPlay loop onPlay={(e) => (e.currentTarget.volume = activeMode.ambientVolume / 100)} />
          ) : (
            <iframe src={getMusicUrl(activeMode.musicType, activeMode.musicUrl)} allow="autoplay" />
          )}
        </div>
      )}

      {/* Task Name & Session Status */}
      <div className="text-[11px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase mb-4 px-6 text-center line-clamp-2">
        {taskName} <span className="mx-2 opacity-30">/</span> {status}
      </div>

      {/* Circular Progress Display */}
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

      {/* Timer Controls */}
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
      
      {/* Developer Test Hook */}
      <button onClick={() => setTimeLeft(2)} className="mt-8 text-[10px] font-bold text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors">
        Quick Test (2s)
      </button>
    </div>
  );
}