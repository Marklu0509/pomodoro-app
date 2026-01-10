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

  if (isLoading) return <div className="p-8 text-center dark:text-white font-bold animate-pulse">Initializing...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar: Profile Selection List */}
        <div className="w-full lg:w-64 space-y-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Focus Profiles</h3>
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode)}
              className={`w-full text-left px-5 py-4 rounded-2xl font-bold transition-all ${
                selectedMode?.id === mode.id
                  ? "bg-blue-600 text-white shadow-xl scale-[1.02]"
                  : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {mode.name}
            </button>
          ))}
          <button onClick={handleAddNew} className="w-full mt-4 px-5 py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 font-bold hover:text-blue-500 hover:border-blue-500 transition-all">
            + New Profile
          </button>
        </div>

        {/* Main Editor: Configuration Form */}
        {selectedMode && (
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-sm border border-gray-100 dark:border-gray-700 space-y-10">
            <div className="flex justify-between items-center pb-6 border-b border-gray-50 dark:border-gray-700">
              <input 
                type="text" 
                value={selectedMode.name} 
                onChange={(e) => handleFieldChange("name", e.target.value)} 
                className="text-3xl font-black bg-transparent border-none focus:ring-0 dark:text-white w-2/3 tracking-tighter" 
              />
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="bg-gray-900 dark:bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs tracking-[0.15em] hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
              >
                {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Left Column: Timer & Notification Logic */}
              <div className="space-y-8">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timer & Alerts</h4>
                
                {/* Duration Inputs */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Work', key: 'workDuration' },
                    { label: 'Short', key: 'shortBreakDuration' },
                    { label: 'Long', key: 'longBreakDuration' }
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">{item.label}</label>
                      <input 
                        type="number" 
                        value={selectedMode[item.key as keyof FocusMode] as number} 
                        onChange={(e) => handleFieldChange(item.key as keyof FocusMode, parseInt(e.target.value))} 
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl dark:text-white border-none font-bold" 
                      />
                    </div>
                  ))}
                </div>

                {/* Alarm Sound Picker - Restored */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-2 uppercase">End of Session Alarm</label>
                  <select 
                    value={selectedMode.alarmSound} 
                    onChange={(e) => handleFieldChange("alarmSound", e.target.value)} 
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl dark:text-white border-none text-sm font-bold cursor-pointer"
                  >
                    <option value="classic">Classic Bell</option>
                    <option value="digital">Digital Beep</option>
                    <option value="bird">Morning Bird</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-4 cursor-pointer p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-all">
                  <input 
                    type="checkbox" 
                    checked={selectedMode.alertAt25Percent} 
                    onChange={(e) => handleFieldChange("alertAt25Percent", e.target.checked)} 
                    className="w-6 h-6 rounded-lg text-blue-600 border-none bg-gray-200 dark:bg-gray-700 focus:ring-0" 
                  />
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Milestone Chimes (75%, 50%, 25%)</span>
                </label>
              </div>

              {/* Right Column: Audio & Music Customization */}
              <div className="space-y-8">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Audio & Background</h4>
                
                {/* Background Music Card */}
                <div className="p-6 border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2rem] space-y-5">
                  <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 block uppercase tracking-widest">YouTube Music Integration</label>
                  <select 
                    value={selectedMode.musicType} 
                    onChange={(e) => handleFieldChange("musicType", e.target.value)} 
                    className="w-full p-4 bg-white dark:bg-gray-900 rounded-2xl dark:text-white border-none text-sm font-bold shadow-sm"
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
                        className="w-full p-4 bg-white dark:bg-gray-900 rounded-2xl text-sm border-none shadow-sm placeholder:text-gray-300 dark:text-blue-400 font-medium"
                      />
                      {/* Music Volume Control */}
                      <div className="px-1">
                        <div className="flex justify-between text-[10px] font-black text-blue-500 uppercase mb-2">
                          <span>Music Volume</span>
                          <span>{selectedMode.musicVolume}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" 
                          value={selectedMode.musicVolume} 
                          onChange={(e) => handleFieldChange("musicVolume", parseInt(e.target.value))} 
                          className="w-full h-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Ambient Sounds Grid */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-3 uppercase">Ambient Environment</label>
                    <div className="flex gap-3 flex-wrap">
                      {['none', 'ticking', 'rain', 'forest'].map((sound) => (
                        <button
                          key={sound}
                          onClick={() => handleFieldChange("ambientSound", sound)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            selectedMode.ambientSound === sound
                              ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900"
                              : "bg-gray-100 dark:bg-gray-900 text-gray-400"
                          }`}
                        >
                          {sound}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase mb-2">
                      <span>Ambient Volume</span>
                      <span>{selectedMode.ambientVolume}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={selectedMode.ambientVolume} 
                      onChange={(e) => handleFieldChange("ambientVolume", parseInt(e.target.value))} 
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-500" 
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