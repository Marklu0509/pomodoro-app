// frontend/app/components/Timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import { Settings } from "../types/setting";

interface TimerProps {
  taskId: number | null; // ★ 修改：允許 null (代表無任務模式)
  onSessionComplete: () => void;
}

type TimerMode = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export default function Timer({ taskId, onSessionComplete }: TimerProps) {
  // --- State ---
  const [mode, setMode] = useState<TimerMode>("WORK");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  // --- Audio Refs ---
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- Wake Lock Ref ---
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const stopAudio = (audio: HTMLAudioElement | null) => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const openMiniWindow = () => {
    const width = 350;
    const height = 400;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      '/dashboard', 
      'PomodoroMini', 
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,directories=no,status=no`
    );
  };

  // 1. Init
  useEffect(() => {
    tickAudioRef.current = new Audio("/sounds/tick.mp3");
    chimeAudioRef.current = new Audio("/sounds/chime.mp3");

    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        const userSettings: Settings = res.data;
        setSettings(userSettings);
        
        if (userSettings) {
           setTimeLeft(userSettings.workDuration * 60);
           
           if (tickAudioRef.current) tickAudioRef.current.volume = userSettings.tickVolume / 100;
           if (chimeAudioRef.current) chimeAudioRef.current.volume = userSettings.notificationVolume / 100;

           const soundFile = userSettings.alarmSoundString 
             ? `/sounds/alarm-${userSettings.alarmSoundString}.mp3` 
             : "/sounds/alarm-classic.mp3";
           
           alarmAudioRef.current = new Audio(soundFile);
           if (alarmAudioRef.current) {
             alarmAudioRef.current.volume = userSettings.notificationVolume / 100;
           }
           
           if (userSettings.miniClockMode) {
             console.log("Mini mode enabled.");
           }
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };
    fetchSettings();
  }, []);

  // 2. Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isActive) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.error('Wake Lock failed:', err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    if (isActive) requestWakeLock();
    else releaseWakeLock();

    return () => { releaseWakeLock(); };
  }, [isActive]);

  // 3. Timer Core
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;

          if (settings?.alertAt25Percent && mode === "WORK") {
            const total = settings.workDuration * 60;
            const p75 = Math.floor(total * 0.75);
            const p50 = Math.floor(total * 0.50);
            const p25 = Math.floor(total * 0.25);

            if (nextTime === p75 || nextTime === p50 || nextTime === p25) {
               if (chimeAudioRef.current) {
                 chimeAudioRef.current.currentTime = 0;
                 chimeAudioRef.current.play().catch(() => {});
               }
            }
          }

          if (nextTime <= 0) {
            stopAudio(tickAudioRef.current);
            return 0;
          }
          return nextTime;
        });

        if (timeLeft > 1 && settings?.tickingSound !== "none" && tickAudioRef.current) {
            tickAudioRef.current.currentTime = 0;
            tickAudioRef.current.play().catch(() => {}); 
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, settings, mode]);

  // 4. Handle Completion
  const handleTimerComplete = async () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current.play().catch((e) => console.log("Audio play failed", e));
      setTimeout(() => stopAudio(alarmAudioRef.current), 5000);
    }

    if (mode === "WORK") {
      try {
        const duration = settings ? settings.workDuration * 60 : 25 * 60;
        
        // ★ 修改：如果 taskId 是 null，API 還是會接受 (因為 DTO 設為 Optional)
        await api.post("/sessions", { durationSeconds: duration, taskId: taskId });
        
        onSessionComplete(); 
        const newCount = sessionCount + 1;
        setSessionCount(newCount);

        if (newCount % 4 === 0) switchMode("LONG_BREAK");
        else switchMode("SHORT_BREAK");

      } catch (error) {
        console.error("Failed to save session", error);
      }
    } else {
      switchMode("WORK");
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    if (!settings) return;

    let newDuration = 25 * 60;
    if (newMode === "WORK") newDuration = settings.workDuration * 60;
    else if (newMode === "SHORT_BREAK") newDuration = settings.shortBreakDuration * 60;
    else if (newMode === "LONG_BREAK") newDuration = settings.longBreakDuration * 60;
    
    setTimeLeft(newDuration);

    let shouldAutoStart = false;
    if (newMode === "WORK" && settings.autoStartPomodoros) shouldAutoStart = true;
    if ((newMode === "SHORT_BREAK" || newMode === "LONG_BREAK") && settings.autoStartBreaks) shouldAutoStart = true;

    if (shouldAutoStart) setTimeout(() => setIsActive(true), 100);
    else setIsActive(false);
  };

  const handlePause = () => {
    setIsActive(!isActive);
    if (isActive) stopAudio(tickAudioRef.current);
  };

  const handleReset = () => {
    setIsActive(false);
    stopAudio(tickAudioRef.current);
    stopAudio(alarmAudioRef.current);
    setTimeLeft(getTotalTime());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalTime = () => {
    if (!settings) return 25 * 60;
    if (mode === "WORK") return settings.workDuration * 60;
    if (mode === "SHORT_BREAK") return settings.shortBreakDuration * 60;
    return settings.longBreakDuration * 60;
  };
  
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const totalTime = getTotalTime();
  const progressPercentage = timeLeft / totalTime;
  const strokeDashoffset = circumference * (1 - progressPercentage);

  const getColor = () => {
    if (mode === "WORK") return "#ef4444";
    if (mode === "SHORT_BREAK") return "#3b82f6";
    return "#10b981"; 
  };

  return (
    <div className="mt-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-lg flex flex-col items-center relative group">
      
      <button 
        type="button" 
        onClick={openMiniWindow}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        title="Open Mini Window"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </button>

      {/* Title indicating if we are working on a task or just focusing */}
      <div className="text-sm text-gray-400 font-medium mb-2">
        {taskId ? "Focusing on Task" : "Free Focus Mode"}
      </div>

      <div className="mb-4 px-3 py-1 rounded-full text-sm font-bold tracking-wide uppercase" 
           style={{ backgroundColor: `${getColor()}20`, color: getColor() }}>
        {mode.replace("_", " ")}
      </div>

      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={radius} fill="none" stroke={getColor()} strokeWidth="6" strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: "stroke-dashoffset 1s linear, stroke 0.5s ease"
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-mono font-bold text-gray-800">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-gray-400 mt-1 uppercase font-semibold">
            {isActive ? "Running" : "Paused"}
          </span>
        </div>
      </div>

      <div className="flex gap-4 w-full px-4">
        <button
          type="button" 
          onClick={handlePause}
          className="flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-all active:scale-95"
          style={{ backgroundColor: isActive ? "#f59e0b" : getColor() }}
        >
          {isActive ? "PAUSE" : "START"}
        </button>
        <button
          type="button" 
          onClick={handleReset}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
        >
          RESET
        </button>
      </div>
      
       {isActive && 'wakeLock' in navigator && (
         <div className="mt-2 text-[10px] text-gray-300">Screen Lock Active</div>
       )}
    </div>
  );
}