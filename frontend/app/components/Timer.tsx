// frontend/app/components/Timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";

// Define the interface for a Focus Profile (Mode)
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
}

interface TimerProps {
  taskId: number | null;
  activeMode: FocusMode; // The profile selected in the Dashboard
  onSessionComplete: () => void;
}

type TimerStatus = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export default function Timer({ taskId, activeMode, onSessionComplete }: TimerProps) {
  // --- State ---
  const [status, setStatus] = useState<TimerStatus>("WORK");
  const [timeLeft, setTimeLeft] = useState(activeMode.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  // --- Audio Refs ---
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Helper: Stop and reset any audio object
  const stopAudio = (audio: HTMLAudioElement | null) => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  // 1. Initialize Audio and Timer settings whenever the activeMode changes
  useEffect(() => {
    // Reset state
    setIsActive(false);
    stopAudio(ambientAudioRef.current);
    setTimeLeft(activeMode.workDuration * 60);
    setStatus("WORK");

    // Load Notification Chime
    chimeAudioRef.current = new Audio("/sounds/chime.mp3");
    chimeAudioRef.current.volume = 0.5;

    // Load Alarm Sound
    const alarmFile = `/sounds/alarm-${activeMode.alarmSound}.mp3`;
    alarmAudioRef.current = new Audio(alarmFile);
    alarmAudioRef.current.volume = 0.8;

    // Load Ambient Sound (Ticking or White Noise)
    if (activeMode.ambientSound !== "none") {
      const isTicking = activeMode.ambientSound === "ticking";
      const soundPath = isTicking ? "/sounds/tick.mp3" : `/sounds/${activeMode.ambientSound}.mp3`;
      
      ambientAudioRef.current = new Audio(soundPath);
      ambientAudioRef.current.volume = activeMode.ambientVolume / 100;
      if (!isTicking) ambientAudioRef.current.loop = true;
    }

    return () => stopAudio(ambientAudioRef.current);
  }, [activeMode]);

  // 2. Handle Continuous Ambient Sound & Screen Wake Lock
  useEffect(() => {
    const isContinuous = activeMode.ambientSound !== "none" && activeMode.ambientSound !== "ticking";
    
    // Play background noise during WORK sessions
    if (isActive && isContinuous && ambientAudioRef.current && status === "WORK") {
      ambientAudioRef.current.play().catch(() => console.log("Audio play blocked by browser"));
    } else {
      if (ambientAudioRef.current && isContinuous) ambientAudioRef.current.pause();
    }

    // Wake Lock API: Prevent screen from turning off while active
    const toggleWakeLock = async () => {
      if ('wakeLock' in navigator) {
        if (isActive) {
          try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) {}
        } else {
          await wakeLockRef.current?.release();
          wakeLockRef.current = null;
        }
      }
    };
    toggleWakeLock();
  }, [isActive, status, activeMode]);

  // 3. Core Timer Interval Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;

          // 25% Interval Chime Logic
          if (activeMode.alertAt25Percent && status === "WORK") {
            const total = activeMode.workDuration * 60;
            const milestones = [Math.floor(total * 0.75), Math.floor(total * 0.50), Math.floor(total * 0.25)];
            if (milestones.includes(nextTime)) {
               if (chimeAudioRef.current) {
                 chimeAudioRef.current.currentTime = 0;
                 chimeAudioRef.current.play().catch(() => {});
               }
            }
          }

          if (nextTime <= 0) {
            if (activeMode.ambientSound === "ticking") stopAudio(ambientAudioRef.current);
            return 0;
          }
          return nextTime;
        });

        // Ticking sound per second
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

  // 4. Handle Completion of a Session
  const handleTimerComplete = async () => {
    stopAudio(ambientAudioRef.current);
    
    // Play Alarm
    if (alarmAudioRef.current) {
      alarmAudioRef.current.play();
      setTimeout(() => stopAudio(alarmAudioRef.current), 6000);
    }

    if (status === "WORK") {
      try {
        await api.post("/sessions", { durationSeconds: activeMode.workDuration * 60, taskId });
        onSessionComplete(); // Refresh Dashboard data
        
        const newCount = sessionCount + 1;
        setSessionCount(newCount);
        
        // Auto-switch to Break
        const nextStatus = newCount % 4 === 0 ? "LONG_BREAK" : "SHORT_BREAK";
        setStatus(nextStatus);
        setTimeLeft((nextStatus === "LONG_BREAK" ? activeMode.longBreakDuration : activeMode.shortBreakDuration) * 60);
      } catch (e) { console.error("Session save failed", e); }
    } else {
      // Break is over, back to WORK
      setStatus("WORK");
      setTimeLeft(activeMode.workDuration * 60);
    }
  };

  // Helper: Open Mini-Clock Window
  const openMiniWindow = () => {
    const width = 350, height = 450;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open('/dashboard', 'MiniClock', `width=${width},height=${height},left=${left},top=${top},resizable=no`);
  };

  // Helper: Convert music URLs into embed format
  const getMusicEmbedUrl = (type: string, url: string | null) => {
    if (!url) return "";
    if (type === "youtube") {
      const vid = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
      return `https://www.youtube.com/embed/${vid}?autoplay=1&controls=0&loop=1&playlist=${vid}`;
    }
    if (type === "spotify") {
      const path = url.split("spotify.com/")[1];
      return `https://open.spotify.com/embed/${path}`;
    }
    return url;
  };

  // UI Helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentColor = status === "WORK" ? "#ef4444" : status === "SHORT_BREAK" ? "#3b82f6" : "#10b981";

  return (
    <div className="mt-4 p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-2xl flex flex-col items-center relative transition-colors duration-500">
      
      {/* Invisible Music Layer (Active only during work) */}
      {isActive && status === "WORK" && activeMode.musicType !== "none" && activeMode.musicUrl && (
        <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
          {activeMode.musicType === "mp3" ? (
            <audio src={activeMode.musicUrl} autoPlay loop />
          ) : (
            <iframe src={getMusicEmbedUrl(activeMode.musicType, activeMode.musicUrl)} allow="autoplay" />
          )}
        </div>
      )}

      {/* Mini Window Toggle */}
      <button type="button" onClick={openMiniWindow} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-500 dark:hover:text-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </button>

      {/* Mode Header */}
      <div className="text-[10px] font-black tracking-[0.25em] text-gray-400 dark:text-gray-500 uppercase mb-3">
        Focus Mode ({status})
      </div>

      <div className="mb-8 px-5 py-1.5 rounded-2xl text-xs font-black shadow-sm uppercase tracking-wide" 
           style={{ backgroundColor: `${currentColor}15`, color: currentColor }}>
        {activeMode.name}
      </div>

      {/* Timer Circle */}
      <div className="relative w-64 h-64 mb-10">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="4" className="dark:stroke-gray-700" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke={currentColor} strokeWidth="4" strokeLinecap="round"
            style={{
              strokeDasharray: 282.7,
              strokeDashoffset: 282.7 * (1 - timeLeft / ((status === "WORK" ? activeMode.workDuration : activeMode.shortBreakDuration) * 60)),
              transition: "stroke-dashoffset 1s linear"
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-mono font-bold text-gray-800 dark:text-gray-100 tracking-tighter">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex gap-4 w-full px-4">
        <button
          type="button" 
          onClick={() => {
            setIsActive(!isActive);
            if (isActive) stopAudio(ambientAudioRef.current);
          }}
          className="flex-1 py-4 rounded-2xl font-black text-sm tracking-widest text-white shadow-xl active:scale-95 transition-all"
          style={{ backgroundColor: isActive ? "#f59e0b" : currentColor }}
        >
          {isActive ? "PAUSE" : "START"}
        </button>
        <button
          type="button" 
          onClick={() => { setIsActive(false); stopAudio(ambientAudioRef.current); setTimeLeft(activeMode.workDuration * 60); }}
          className="px-8 py-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-black text-sm active:scale-95 transition-all"
        >
          RESET
        </button>
      </div>
      
       {/* Debug Button */}
       <button
         type="button"
         onClick={() => setTimeLeft(2)}
         className="mt-8 text-[10px] font-bold text-gray-300 hover:text-red-400 dark:text-gray-600 transition-colors"
       >
         Test Finish (2s left)
       </button>
    </div>
  );
}