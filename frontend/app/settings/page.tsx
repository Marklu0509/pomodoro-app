// frontend/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Navbar from "../components/Navbar";
import { applyTheme } from "../../utils/theme";

/**
 * Interface representing the Focus Profile.
 * Simplified to focus on YouTube as the primary music source.
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
  musicType: string; // Restrict logic to "none" or "youtube"
}

export default function SettingsPage() {
  const [modes, setModes] = useState<FocusMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<FocusMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("system");

  useEffect(() => {
    fetchModes();
    // Load local theme preference
    const savedTheme = localStorage.getItem("theme-preference") || "system";
    setCurrentTheme(savedTheme);
  }, []);

  const fetchModes = async () => {
    try {
      const res = await api.get("/focus-modes");
      setModes(res.data);
      if (res.data.length > 0) setSelectedMode(res.data[0]);
    } catch (err) {
      console.error("Failed to load profiles", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generic handler for input changes within the selected profile.
   */
  const handleFieldChange = (field: keyof FocusMode, value: any) => {
    if (!selectedMode) return;
    setSelectedMode({ ...selectedMode, [field]: value });
  };

  const handleSave = async () => {
    if (!selectedMode) return;
    setIsSaving(true);
    try {
      await api.patch(`/focus-modes/${selectedMode.id}`, selectedMode);
      setModes(modes.map((m) => (m.id === selectedMode.id ? selectedMode : m)));
      alert("Settings saved successfully!");
    } catch (err) {
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = async () => {
    try {
      const res = await api.post("/focus-modes", { name: "New Profile" });
      setModes((prev) => [...prev, res.data]);
      setSelectedMode(res.data);
    } catch (err) {
      alert("Error adding profile.");
    }
  };

  if (isLoading) return <div className="p-8 text-center dark:text-white font-bold">Loading Settings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar: Profile List */}
        <div className="w-full lg:w-64 space-y-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Focus Profiles</h3>
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode)}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${
                selectedMode?.id === mode.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {mode.name}
            </button>
          ))}
          <button onClick={handleAddNew} className="w-full mt-4 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 font-bold hover:text-blue-500 transition-all">
            + Add Profile
          </button>
        </div>

        {/* Main Editor: Profile Configuration */}
        {selectedMode && (
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-10">
            <div className="flex justify-between items-center">
              <input 
                type="text" 
                value={selectedMode.name} 
                onChange={(e) => handleFieldChange("name", e.target.value)} 
                className="text-2xl font-black bg-transparent border-none focus:ring-0 dark:text-white w-2/3" 
              />
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs tracking-widest hover:shadow-blue-500/20 disabled:opacity-50 transition-all"
              >
                {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Section 1: Timer Logic */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timer Durations (Min)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">Work</label>
                    <input type="number" value={selectedMode.workDuration} onChange={(e) => handleFieldChange("workDuration", parseInt(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl dark:text-white border-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">Short</label>
                    <input type="number" value={selectedMode.shortBreakDuration} onChange={(e) => handleFieldChange("shortBreakDuration", parseInt(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl dark:text-white border-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">Long</label>
                    <input type="number" value={selectedMode.longBreakDuration} onChange={(e) => handleFieldChange("longBreakDuration", parseInt(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl dark:text-white border-none" />
                  </div>
                </div>
                
                <label className="flex items-center gap-4 cursor-pointer p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl group transition-all">
                  <input type="checkbox" checked={selectedMode.alertAt25Percent} onChange={(e) => handleFieldChange("alertAt25Percent", e.target.checked)} className="w-5 h-5 rounded-md text-blue-600 border-none bg-gray-200 dark:bg-gray-700" />
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Progress Chimes (75%, 50%, 25%)</span>
                </label>
              </div>

              {/* Section 2: Sound & Music */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sound & Music</h4>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">Background Music</label>
                  <div className="space-y-3">
                    {/* Simplified selection: Only None and YouTube */}
                    <select 
                      value={selectedMode.musicType} 
                      onChange={(e) => handleFieldChange("musicType", e.target.value)} 
                      className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl dark:text-white border-none text-sm font-bold"
                    >
                      <option value="none">No Background Music</option>
                      <option value="youtube">YouTube Video/Playlist</option>
                    </select>
                    
                    {selectedMode.musicType === "youtube" && (
                      <input 
                        type="text" 
                        placeholder="Paste YouTube Link here..." 
                        value={selectedMode.musicUrl || ""} 
                        onChange={(e) => handleFieldChange("musicUrl", e.target.value)} 
                        className="w-full p-4 bg-blue-50/50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-900/50 rounded-2xl text-sm dark:text-blue-400 placeholder:text-blue-300" 
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">Ambient Sound</label>
                    <select value={selectedMode.ambientSound} onChange={(e) => handleFieldChange("ambientSound", e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl dark:text-white border-none text-sm font-bold">
                      <option value="none">None</option>
                      <option value="ticking">Ticking</option>
                      <option value="rain">Rain</option>
                      <option value="forest">Forest</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">Volume</label>
                    <input type="range" min="0" max="100" value={selectedMode.ambientVolume} onChange={(e) => handleFieldChange("ambientVolume", parseInt(e.target.value))} className="w-full mt-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}