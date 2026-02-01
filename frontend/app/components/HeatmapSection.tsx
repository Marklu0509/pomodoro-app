// frontend/app/components/HeatmapSection.tsx
"use client";

import { useState, useEffect } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css"; // Import default styles
import { 
  format, 
  subYears, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay 
} from "date-fns";
import api from "../../utils/api";

interface HeatmapData {
  date: string;  // "YYYY-MM-DD"
  count: number; // minutes
}

interface HeatmapSectionProps {
  className?: string;
}

export default function HeatmapSection({ className = "" }: HeatmapSectionProps) {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View Toggle: "YEAR" or "MONTH"
  const [viewMode, setViewMode] = useState<"YEAR" | "MONTH">("MONTH");
  
  // Current Month for Monthly View (Default to Today)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/stats/heatmap");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load heatmap data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper: Get color scale based on minutes focused
  const getColorClass = (minutes: number) => {
    if (minutes === 0) return "bg-white/60 dark:bg-white/5";
    if (minutes < 30) return "bg-slate-200/70 dark:bg-slate-800/50";
    if (minutes < 60) return "bg-slate-400/70 dark:bg-slate-700/60";
    if (minutes < 120) return "bg-slate-600/70 dark:bg-slate-500/60";
    return "bg-slate-900/80 dark:bg-slate-300/80";
  };

  // Helper: Find data for a specific date
  const getDataForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return data.find((d) => d.date === dateStr)?.count || 0;
  };

  // --- Render Functions ---

  // A. Yearly View (GitHub Style)
  const renderYearView = () => {
    const today = new Date();
    const oneYearAgo = subYears(today, 1);

    return (
      <div className="overflow-x-auto">
         {/* Using react-calendar-heatmap library */}
        <div className="min-w-[800px]"> 
          <CalendarHeatmap
            startDate={oneYearAgo}
            endDate={today}
            values={data}
            classForValue={(value) => {
              if (!value || value.count === 0) return "color-empty";
              // Custom logic to map minutes to library's scale-1 to scale-4
              if (value.count < 30) return "color-scale-1";
              if (value.count < 60) return "color-scale-2";
              if (value.count < 120) return "color-scale-3";
              return "color-scale-4";
            }}
            tooltipDataAttrs={(value: any) => {
              // Tooltip helper
              const minutes = value.count ? value.count : 0;
              const date = value.date ? value.date : "";
              return {
                "data-tip": `${date}: ${minutes} mins`,
              } as any;
            }}
            showWeekdayLabels={true}
          />
        </div>
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span>Less</span>
          <div className="w-3 h-3 bg-slate-100"></div>
          <div className="w-3 h-3 bg-slate-300"></div>
          <div className="w-3 h-3 bg-slate-500"></div>
          <div className="w-3 h-3 bg-slate-700"></div>
          <div className="w-3 h-3 bg-slate-900 dark:bg-slate-200"></div>
          <span>More</span>
        </div>
      </div>
    );
  };

  // B. Monthly View (Custom Calendar Grid)
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = monthStart; 
    const endDate = monthEnd;

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Calculate empty slots for grid alignment (if month starts on Tuesday, we need empty slots for Sun/Mon)
    // getDay returns 0 for Sunday, 1 for Monday...
    const startDayOfWeek = getDay(monthStart); // 0-6
    const emptySlots = Array.from({ length: startDayOfWeek });

    return (
      <div>
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-full glass-pill hover:brightness-110"
          >
            ←
          </button>
          <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-full glass-pill hover:brightness-110"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Weekday Labels */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
              {d}
            </div>
          ))}

          {/* Empty Slots for Previous Month */}
          {emptySlots.map((_, i) => (
            <div key={`empty-${i}`} className="h-10 md:h-14"></div>
          ))}

          {/* Days */}
          {days.map((day) => {
            const minutes = getDataForDate(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toString()}
                className={`
                  h-10 md:h-14 rounded-md border border-white/50 dark:border-white/10 flex flex-col items-center justify-center relative group
                  ${getColorClass(minutes)}
                  ${isToday ? "ring-2 ring-slate-400" : ""}
                `}
                title={`${format(day, "yyyy-MM-dd")}: ${minutes} mins`}
              >
                <span className={`text-xs ${minutes > 60 ? 'text-white' : 'text-slate-600 dark:text-slate-300'} font-medium z-10`}>
                  {format(day, "d")}
                </span>
                
                {/* Tooltip on Hover */}
                {minutes > 0 && (
                  <div className="absolute -top-8 glass-panel text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {minutes} mins
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-4 text-center text-slate-500 dark:text-slate-400">Loading heatmap...</div>;

  return (
    <div className={className ? className : "glass-card rounded-2xl p-6"}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">Focus History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Daily intensity across the year.</p>
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex glass-pill p-1 rounded-lg">
          <button
            onClick={() => setViewMode("MONTH")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
              viewMode === "MONTH" ? "bg-white/90 dark:bg-white/15 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode("YEAR")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
              viewMode === "YEAR" ? "bg-white/90 dark:bg-white/15 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {viewMode === "MONTH" ? renderMonthView() : renderYearView()}

      {/* Styles for Year View (react-calendar-heatmap override) */}
      <style jsx global>{`
        .react-calendar-heatmap text { font-size: 10px; fill: #94a3b8; }
        .react-calendar-heatmap .color-empty { fill: rgba(148, 163, 184, 0.15); }
        .react-calendar-heatmap .color-scale-1 { fill: #cbd5f5; }
        .react-calendar-heatmap .color-scale-2 { fill: #94a3b8; }
        .react-calendar-heatmap .color-scale-3 { fill: #64748b; }
        .react-calendar-heatmap .color-scale-4 { fill: #1e293b; }
        .dark .react-calendar-heatmap text { fill: #64748b; }
        .dark .react-calendar-heatmap .color-empty { fill: rgba(148, 163, 184, 0.12); }
        .dark .react-calendar-heatmap .color-scale-1 { fill: #1f2937; }
        .dark .react-calendar-heatmap .color-scale-2 { fill: #334155; }
        .dark .react-calendar-heatmap .color-scale-3 { fill: #475569; }
        .dark .react-calendar-heatmap .color-scale-4 { fill: #e2e8f0; }
        .react-calendar-heatmap rect:hover { stroke: rgba(148,163,184,0.6); stroke-width: 1px; }
      `}</style>
    </div>
  );
}
