// frontend/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Navbar from "../components/Navbar";

/**
 * Interface representing the Focus Profile.
 * Extended with separate volume controls for music and ambience.
 */
interface FocusMode {
  id: number;
  name: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  ambientVolume: number;
  ambientSound: string;
  alarmSound: string;      // The notification sound when timer ends
  alertAt25Percent: boolean;
  musicUrl: string | null;
  musicType: string;
  musicVolume: number;     // Separate volume for YouTube/Background music
}

export default function SettingsPage() {
  const [modes, setModes] = useState<FocusMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<FocusMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load profiles on component mount
  useEffect(() => {
    fetchModes();
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
   * Generic handler to update a specific field in the selected profile state.
   */
  const handleFieldChange = (field: keyof FocusMode, value: any) => {
    if (!selectedMode) return;
    setSelectedMode({ ...selectedMode, [field]: value });
  };

  /**
   * Saves the current profile configuration to the backend database.
   */
  const handleSave = async () => {
    if (!selectedMode) return;
    setIsSaving(true);
    try {
      // Ensure your backend Prisma schema has musicVolume and alarmSound fields!
      await api.patch(`/focus-modes/${selectedMode.id}`, selectedMode);
      setModes(modes.map((m) => (m.id === selectedMode.id ? selectedMode : m)));
      alert("Settings successfully saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save. Check if your backend schema is updated.");
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
      alert("Error adding new profile.");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 dark:text-slate-200 font-semibold animate-pulse">Initializing...</div>;

  return (
    <div className="min-h-screen transition-colors duration-500">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar: Profile Selection List */}
        <div className="w-full lg:w-64 space-y-2">
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em] mb-4 ml-2">Focus Profiles</h3>
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode)}
              className={`w-full text-left px-5 py-4 rounded-2xl font-semibold transition-all ${
                selectedMode?.id === mode.id
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.02]"
                  : "glass-panel text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {mode.name}
            </button>
          ))}
          <button onClick={handleAddNew} className="w-full mt-4 px-5 py-4 rounded-2xl border-2 border-dashed border-white/60 dark:border-white/10 text-slate-400 font-semibold hover:text-slate-800 hover:border-slate-400 transition-all">
            + New Profile
          </button>
        </div>

        {/* Main Editor: Configuration Form */}
        {selectedMode && (
          <div className="flex-grow glass-card rounded-[3rem] p-10 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 glass-divider">
              <input 
                type="text" 
                value={selectedMode.name} 
                onChange={(e) => handleFieldChange("name", e.target.value)} 
                className="text-3xl font-display font-semibold bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white w-full md:w-2/3 tracking-tight" 
              />
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-semibold text-xs tracking-[0.25em] hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-900/20"
              >
                {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Left Column: Timer & Notification Logic */}
              <div className="space-y-8">
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em]">Timer & Alerts</h4>
                
                {/* Duration Inputs */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Work', key: 'workDuration' },
                    { label: 'Short', key: 'shortBreakDuration' },
                    { label: 'Long', key: 'longBreakDuration' }
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-2 uppercase">{item.label}</label>
                      <input 
                        type="number" 
                        value={selectedMode[item.key as keyof FocusMode] as number} 
                        onChange={(e) => handleFieldChange(item.key as keyof FocusMode, parseInt(e.target.value))} 
                        className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-semibold" 
                      />
                    </div>
                  ))}
                </div>

                {/* Alarm Sound Picker - Restored */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-2 uppercase">End of Session Alarm</label>
                  <select 
                    value={selectedMode.alarmSound} 
                    onChange={(e) => handleFieldChange("alarmSound", e.target.value)} 
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-semibold cursor-pointer"
                  >
                    <option value="classic">Classic Bell</option>
                    <option value="digital">Digital Beep</option>
                    <option value="bird">Morning Bird</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-4 cursor-pointer p-5 glass-panel rounded-2xl hover:brightness-110 transition-all">
                  <input 
                    type="checkbox" 
                    checked={selectedMode.alertAt25Percent} 
                    onChange={(e) => handleFieldChange("alertAt25Percent", e.target.checked)} 
                    className="w-6 h-6 rounded-lg text-slate-700 border-none bg-white/60 dark:bg-white/10 focus:ring-0" 
                  />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Milestone Chimes (75%, 50%, 25%)</span>
                </label>
              </div>

              {/* Right Column: Audio & Music Customization */}
              <div className="space-y-8">
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em]">Audio & Background</h4>
                
                {/* Background Music Card */}
                <div className="p-6 border border-slate-200/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] space-y-5">
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 block uppercase tracking-widest">YouTube Music Integration</label>
                  <select 
                    value={selectedMode.musicType} 
                    onChange={(e) => handleFieldChange("musicType", e.target.value)} 
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm"
                  >
                    <option value="none">No Music</option>
                    <option value="youtube">YouTube URL</option>
                  </select>
                  
                  {selectedMode.musicType === "youtube" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="text" 
                        placeholder="Paste YouTube Link (Video or Playlist)..." 
                        value={selectedMode.musicUrl || ""} 
                        onChange={(e) => handleFieldChange("musicUrl", e.target.value)} 
                        className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-medium shadow-sm"
                      />
                      {/* Music Volume Control */}
                      <div className="px-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase mb-2">
                          <span>Music Volume</span>
                          <span>{selectedMode.musicVolume}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" 
                          value={selectedMode.musicVolume} 
                          onChange={(e) => handleFieldChange("musicVolume", parseInt(e.target.value))} 
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-600" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Ambient Sounds Grid */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-3 uppercase">Ambient Environment</label>
                    <div className="flex gap-3 flex-wrap">
                      {['none', 'ticking', 'rain', 'forest'].map((sound) => (
                        <button
                          key={sound}
                          onClick={() => handleFieldChange("ambientSound", sound)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-[0.25em] transition-all ${
                            selectedMode.ambientSound === sound
                              ? "bg-slate-900 text-white dark:bg-white/15 dark:text-white"
                              : "glass-pill text-slate-400 dark:text-slate-300"
                          }`}
                        >
                          {sound}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase mb-2">
                      <span>Ambient Volume</span>
                      <span>{selectedMode.ambientVolume}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={selectedMode.ambientVolume} 
                      onChange={(e) => handleFieldChange("ambientVolume", parseInt(e.target.value))} 
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500" 
                    />
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
