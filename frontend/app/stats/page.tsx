// frontend/app/stats/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Navbar from "../components/Navbar";
import HeatmapSection from "../components/HeatmapSection"; // Import the new heatmap component
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

// Data Types definition
interface StatsData {
  today: {
    minutes: number;
    goal: number;
    progress: number;
  };
  weekly: {
    date: string;
    minutes: number;
  }[];
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Stats Data on Component Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/stats");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading stats...</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">No data available.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Productivity Insights</h1>

        {/* 1. Today's Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card: Focus Time */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Today's Focus</h3>
            <div className="text-4xl font-bold text-blue-600">
              {data.today.minutes}<span className="text-lg text-gray-400 font-normal"> min</span>
            </div>
          </div>

          {/* Card: Daily Goal */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Daily Goal</h3>
            <div className="text-4xl font-bold text-gray-800">
              {data.today.goal}<span className="text-lg text-gray-400 font-normal"> min</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Target set in Settings
            </div>
          </div>

          {/* Card: Progress % */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Completion</h3>
            <div className={`text-4xl font-bold ${data.today.progress >= 100 ? "text-green-500" : "text-indigo-600"}`}>
              {data.today.progress}%
            </div>
            {/* Simple Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div 
                className={`h-2.5 rounded-full ${data.today.progress >= 100 ? "bg-green-500" : "bg-indigo-600"}`}
                style={{ width: `${Math.min(data.today.progress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 3. Weekly Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Last 7 Days Activity</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  unit="m"
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                {/* Custom Bars: Green if target met, Blue otherwise */}
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                  {data.weekly.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.minutes >= data.today.goal ? "#10b981" : "#3b82f6"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* 2. Heatmap Section (Yearly/Monthly View) */}
        {/* This component handles its own data fetching for the yearly/monthly data */}
        <HeatmapSection />
      </div>
    </div>
  );
}