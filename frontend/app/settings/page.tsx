// frontend/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Navbar from "../components/Navbar";

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
  musicUrl: string | null;   // ★ New field
  musicType: string;         // ★ New field
}

export default function SettingsPage() {
  const [modes, setModes] = useState<FocusMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<FocusMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchModes(); }, []);

  const fetchModes = async () => {
    try {
      const res = await api.get("/focus-modes");
      setModes(res.data);
      if (res.data.length > 0) setSelectedMode(res.data[0]);
    } catch (err) { console.error("Load failed", err); }
    finally { setIsLoading(false); }
  };

  const handleFieldChange = (field: keyof FocusMode, value: any) => {
    if (!selectedMode) return;
    setSelectedMode({ ...selectedMode, [field]: value });
  };
  
  const handleSave = async () => {
    if (!selectedMode) return;
    setIsSaving(true);
    try {
      await api.patch(`/focus-modes/${selectedMode.id}`, selectedMode);
      setModes(modes.map(m => m.id === selectedMode.id ? selectedMode : m));
      alert("Settings saved!");
    } catch (err) { alert("Save failed."); }
    finally { setIsSaving(false); }
  };

  const handleAddNew = async () => {
    try {
      const res = await api.post("/focus-modes", { name: "New Profile",
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      musicType: "none",
      musicUrl: "",
      alertAt25Percent: true
    });
      setModes((prev) => [...prev, res.data]);
      setSelectedMode(res.data); 
    } catch (err) { alert("Failed to add profile."); }
  };

  const handleDeleteSelected = async () => {
    if (!selectedMode || modes.length <= 1) return;
    if (!confirm(`Delete profile "${selectedMode.name}"?`)) return;
    try {
      await api.delete(`/focus-modes/${selectedMode.id}`);
      const remaining = modes.filter((m) => m.id !== selectedMode.id);
      setModes(remaining);
      setSelectedMode(remaining[0] ?? null);
    } catch (err) { alert("Delete failed."); }
  };

  if (isLoading) return <div className="p-8 text-center dark:text-white">Loading Profiles...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
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
          <button type="button" onClick={handleAddNew} className="w-full mt-4 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 font-bold hover:text-blue-500 transition-all">
            + Add Profile
          </button>
        </div>

        {/* Editor */}
        {selectedMode && (
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-8">
            <div className="flex justify-between items-center">
              <input type="text" value={selectedMode.name} onChange={(e) => handleFieldChange("name", e.target.value)} className="text-2xl font-black bg-transparent border-none focus:ring-0 dark:text-white w-2/3" />
              <div className="flex gap-3">
                <button type="button" onClick={handleDeleteSelected} disabled={modes.length <= 1} className="px-4 py-2.5 rounded-xl font-bold border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 disabled:opacity-50">Delete</button>
                <button type="button" onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg disabled:opacity-50">{isSaving ? "Saving..." : "Save Changes"}</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Section 1: Timer & Alerts */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Timer Settings</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Work</label>
                    <input type="number" value={selectedMode.workDuration} onChange={(e) => handleFieldChange("workDuration", parseInt(e.target.value))} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Short</label>
                    <input type="number" value={selectedMode.shortBreakDuration} onChange={(e) => handleFieldChange("shortBreakDuration", parseInt(e.target.value))} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Long</label>
                    <input type="number" value={selectedMode.longBreakDuration} onChange={(e) => handleFieldChange("longBreakDuration", parseInt(e.target.value))} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl dark:text-white" />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <input type="checkbox" checked={selectedMode.alertAt25Percent} onChange={(e) => handleFieldChange("alertAt25Percent", e.target.checked)} className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chime at 75%, 50%, 25%</span>
                </label>
              </div>

              {/* Section 2: Audio & Music (FIXED ALARM HERE) */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Audio & Music</h4>
                
                {/* Fixed Alarm Selection */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Alarm Sound (Notification)</label>
                  <select value={selectedMode.alarmSound} onChange={(e) => handleFieldChange("alarmSound", e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl dark:text-white">
                    <option value="classic">Classic Bell</option>
                    <option value="digital">Digital Beep</option>
                    <option value="bird">Morning Bird</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ambient Background Sound</label>
                  <select value={selectedMode.ambientSound} onChange={(e) => handleFieldChange("ambientSound", e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl dark:text-white">
                    <option value="none">None</option>
                    <option value="ticking">Classic Ticking</option>
                    <option value="rain">Soft Rain</option>
                    <option value="forest">Forest Ambience</option>
                    <option value="cafe">London Cafe</option>
                  </select>
                </div>
                {/* ★ Music Integration UI */}
                <div className="p-4 border border-blue-100 dark:border-blue-900 rounded-2xl bg-blue-50/30 dark:bg-blue-900/10">
                  <label className="text-xs font-bold text-blue-600 dark:text-blue-400 block mb-3 uppercase">External Music Link</label>
                  <div className="space-y-3">
                    <select value={selectedMode.musicType} onChange={(e) => handleFieldChange("musicType", e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-900 rounded-lg text-sm dark:text-white border-none shadow-sm">
                      <option value="none">No Music</option>
                      <option value="youtube">YouTube Embed</option>
                      <option value="spotify">Spotify Embed</option>
                      <option value="mp3">Direct MP3 URL</option>
                    </select>
                    {selectedMode.musicType !== 'none' && (
                      <input type="text" placeholder="Paste link here..." value={selectedMode.musicUrl || ''} onChange={(e) => handleFieldChange("musicUrl", e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-900 rounded-lg text-sm dark:text-white border-none shadow-sm placeholder:text-gray-400" />
                    )}
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
