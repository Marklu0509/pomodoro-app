// frontend/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { Settings } from "../types/setting";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        setSettings(res.data);
      } catch (err) {
        console.error("Failed to load settings", err);
        // If 401, redirect to login
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handle changes
  const handleChange = (field: keyof Settings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  // Save changes
  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      // Remove ID and userId from payload
      const { id, userId, ...payload } = settings;
      await api.patch("/settings", payload);
      alert("Settings saved successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;
  if (!settings) return <div className="p-8 text-center">Error loading settings.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-4 mb-10">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Preferences</h1>

        <div className="space-y-8">
          
          {/* Section 1: Timer Durations */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Timer (Minutes)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Focus Time</label>
                <input
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) => handleChange("workDuration", parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Short Break</label>
                <input
                  type="number"
                  value={settings.shortBreakDuration}
                  onChange={(e) => handleChange("shortBreakDuration", parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Long Break</label>
                <input
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) => handleChange("longBreakDuration", parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Automation */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Automation</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.autoStartBreaks}
                  onChange={(e) => handleChange("autoStartBreaks", e.target.checked)}
                  className="h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">Auto-start Breaks after Focus ends</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.autoStartPomodoros}
                  onChange={(e) => handleChange("autoStartPomodoros", e.target.checked)}
                  className="h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">Auto-start Focus after Break ends</span>
              </label>
            </div>
          </div>

          {/* Section 3: Sound & Notifications */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Sound & Notifications</h2>
            
            {/* Ticking Volume */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Ticking Volume ({settings.tickVolume}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.tickVolume}
                onChange={(e) => handleChange("tickVolume", parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Notification Volume */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Alarm Volume ({settings.notificationVolume}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.notificationVolume}
                onChange={(e) => handleChange("notificationVolume", parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Alarm Sound Selection */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Alarm Sound</label>
              <select
                value={settings.alarmSoundString || "classic"} // Default fallback
                onChange={(e) => handleChange("alarmSoundString", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="classic">Classic Alarm</option>
                <option value="digital">Digital Beep</option>
                <option value="bird">Morning Birds</option>
              </select>
            </div>
            
            {/* 25% Alert */}
            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={settings.alertAt25Percent}
                onChange={(e) => handleChange("alertAt25Percent", e.target.checked)}
                className="h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700">Play sound at 25% progress intervals</span>
            </label>

             {/* Browser Notifications */}
             <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleChange("notificationsEnabled", e.target.checked)}
                className="h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700">Show Desktop Notifications</span>
            </label>
          </div>

           {/* Section 4: Interface */}
           <div>
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Interface (Experimental)</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.miniClockMode}
                  onChange={(e) => handleChange("miniClockMode", e.target.checked)}
                  className="h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">Start in Mini-Clock Mode</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.lockWindow}
                  onChange={(e) => handleChange("lockWindow", e.target.checked)}
                  className="h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">Lock Window Position (PWA only)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}