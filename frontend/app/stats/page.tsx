// frontend/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Navbar from "../components/Navbar";

/**
 * FocusMode Interface 
 * MUST be synchronized with your Prisma Schema and Timer component.
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
}

export default function SettingsPage() {
  const [modes, setModes] = useState<FocusMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<FocusMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    fetchModes();
  }, []);

  /**
   * Fetches all focus profiles from the backend
   */
  const fetchModes = async () => {
    try {
      const res = await api.get("/focus-modes");
      setModes(res.data);
      if (res.data.length > 0) {
        setSelectedMode(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load modes", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generic handler for updating local state fields
   * @param field - Must be a valid key of the FocusMode interface
   */
  const handleFieldChange = (field: keyof FocusMode, value: any) => {
    if (!selectedMode) return;
    setSelectedMode({ ...selectedMode, [field]: value });
  };

  /**
   * Persists changes to the backend
   */
  const handleSave = async () => {
    if (!selectedMode) return;
    setIsSaving(true);
    try {
      await api.patch(`/focus-modes/${selectedMode.id}`, selectedMode);
      setModes(modes.map(m => m.id === selectedMode.id ? selectedMode : m));
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
      alert("Failed to create profile.");
    }
  };

  const handleDelete = async () => {
    if (!selectedMode || modes.length <= 1) return;
    if (!confirm("Delete this profile?")) return;
    try {
      await api.delete(`/focus-modes/${selectedMode.id}`);
      const remaining = modes.filter(m => m.id !== selectedMode.id);
      setModes(remaining);
      setSelectedMode(remaining[0]);
    } catch (err) {
      alert("Delete failed.");
    }
  };

  if (isLoading) return <div className="p-8 text-center dark:text-white">Loading Profiles...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar: List of Profiles */}
        <div className="w-full lg:w-64 space-y-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Profiles</h3>
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode)}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                selectedMode?.id === mode.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {mode.name}
            </button>
          ))}
          <button onClick={handleAddNew} className="w-full mt-4 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-bold text-sm hover:border-blue-500 hover:text-blue-500 transition-all">
            + ADD NEW
          </button>
        </div>

        {/* Right Editor: Detailed Settings */}
        {selectedMode && (
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-10">
              <input
                type="text"
                value={selectedMode.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className="text-2xl font-black bg-transparent border-none focus:ring-0 dark:text-white w-2/3"
              />
              <div className="flex gap-3">
                <button onClick={handleDelete} disabled={modes.length <= 1} className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-30">DELETE</button>
                <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-black text-xs tracking-widest hover:shadow-lg disabled:opacity-50">
                  {isSaving ? "SAVING..." : "SAVE CHANGES"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* --- Timer Logic --- */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intervals (Min)</h4>
                <div className="grid grid-cols-3 gap-4">
                  {["workDuration", "shortBreakDuration", "longBreakDuration"].map((field) => (
                    <div key={field}>
                      <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">{field.replace('Duration', '')}</label>
                      <input
                        type="number"
                        value={selectedMode[field as keyof FocusMode] as number}
                        onChange={(e) => handleFieldChange(field as keyof FocusMode, parseInt(e.target.value))}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                      />
                    </div>
                  ))}
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={selectedMode.alertAt25Percent}
                    onChange={(e) => handleFieldChange("alertAt25Percent", e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">Chime at 75%, 50%, 25%</span>
                </label>
              </div>

              {/* --- Audio Selection --- */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Audio Notification</h4>
                <select
                  value={selectedMode.alarmSound}
                  onChange={(e) => handleFieldChange("alarmSound", e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold text-sm"
                >
                  <option value="classic">Classic Bell</option>
                  <option value="digital">Digital Beep</option>
                  <option value="bird">Morning Bird</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
