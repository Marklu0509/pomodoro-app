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
}

export default function SettingsPage() {
  const [modes, setModes] = useState<FocusMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<FocusMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch all Focus Modes
  useEffect(() => {
    fetchModes();
  }, []);

  const fetchModes = async () => {
    try {
      const res = await api.get("/focus-modes");
      setModes(res.data);
      if (res.data.length > 0) setSelectedMode(res.data[0]);
    } catch (err) {
      console.error("Failed to load modes", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Input Changes for the selected mode
  const handleFieldChange = (field: keyof FocusMode, value: any) => {
    if (!selectedMode) return;
    setSelectedMode({ ...selectedMode, [field]: value });
  };

  // 3. Save Changes to Backend
  const handleSave = async () => {
    if (!selectedMode) return;
    setIsSaving(true);
    try {
      await api.patch(`/focus-modes/${selectedMode.id}`, selectedMode);
      // Update local list
      setModes(modes.map(m => m.id === selectedMode.id ? selectedMode : m));
      alert("Settings updated successfully!");
    } catch (err) {
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Create a New Mode
  const handleAddNew = async () => {
    try {
      const res = await api.post("/focus-modes", { name: "New Profile" });
      setModes([...modes, res.data]);
      setSelectedMode(res.data);
    } catch (err) {
      console.error("Failed to add mode", err);
    }
  };

  if (isLoading) return <div className="p-8 text-center dark:text-white">Loading Profiles...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar: Profile List */}
        <div className="w-full md:w-64 space-y-2">
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
          <button 
            onClick={handleAddNew}
            className="w-full mt-4 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all"
          >
            + Add Profile
          </button>
        </div>

        {/* Right Content: Editor Section */}
        {selectedMode && (
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-8">
              <input
                type="text"
                value={selectedMode.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className="text-2xl font-black bg-transparent border-none focus:ring-0 dark:text-white w-2/3"
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* --- Durations Section --- */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase">Durations (Minutes)</h4>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Work Time</label>
                  <input
                    type="number"
                    value={selectedMode.workDuration}
                    onChange={(e) => handleFieldChange("workDuration", parseInt(e.target.value))}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Short Break</label>
                    <input
                      type="number"
                      value={selectedMode.shortBreakDuration}
                      onChange={(e) => handleFieldChange("shortBreakDuration", parseInt(e.target.value))}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Long Break</label>
                    <input
                      type="number"
                      value={selectedMode.longBreakDuration}
                      onChange={(e) => handleFieldChange("longBreakDuration", parseInt(e.target.value))}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* --- Audio Section --- */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase">Audio & Environment</h4>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ambient Sound</label>
                  <select
                    value={selectedMode.ambientSound}
                    onChange={(e) => handleFieldChange("ambientSound", e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="none">None</option>
                    <option value="ticking">Classic Ticking</option>
                    <option value="rain">Soft Rain</option>
                    <option value="forest">Summer Forest</option>
                    <option value="cafe">London Cafe</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Volume ({selectedMode.ambientVolume}%)</label>
                  <input
                    type="range"
                    min="0" max="100"
                    value={selectedMode.ambientVolume}
                    onChange={(e) => handleFieldChange("ambientVolume", parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Alarm Notification</label>
                  <select
                    value={selectedMode.alarmSound}
                    onChange={(e) => handleFieldChange("alarmSound", e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="classic">Classic Bell</option>
                    <option value="digital">Digital Beep</option>
                    <option value="bird">Morning Bird</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}