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

export default function HeatmapSection() {
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
    if (minutes === 0) return "bg-gray-100";
    if (minutes < 30) return "bg-green-200";
    if (minutes < 60) return "bg-green-400";
    if (minutes < 120) return "bg-green-600";
    return "bg-green-800"; // Deep green for heavy focus
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
        <div className="flex items-center justify-end gap-2 text-xs text-gray-500 mt-2">
          <span>Less</span>
          <div className="w-3 h-3 bg-[#ebedf0]"></div>
          <div className="w-3 h-3 bg-[#c6e48b]"></div>
          <div className="w-3 h-3 bg-[#7bc96f]"></div>
          <div className="w-3 h-3 bg-[#239a3b]"></div>
          <div className="w-3 h-3 bg-[#196127]"></div>
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
             className="p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
          <h3 className="font-bold text-lg text-gray-700">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <button 
             onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
             className="p-2 hover:bg-gray-100 rounded-full"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Weekday Labels */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
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
                  h-10 md:h-14 rounded-md border border-gray-50 flex flex-col items-center justify-center relative group
                  ${getColorClass(minutes)}
                  ${isToday ? "ring-2 ring-blue-500" : ""}
                `}
                title={`${format(day, "yyyy-MM-dd")}: ${minutes} mins`}
              >
                <span className={`text-xs ${minutes > 60 ? 'text-white' : 'text-gray-600'} font-medium z-10`}>
                  {format(day, "d")}
                </span>
                
                {/* Tooltip on Hover */}
                {minutes > 0 && (
                  <div className="absolute -top-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
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

  if (loading) return <div className="p-4 text-center text-gray-400">Loading heatmap...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Focus History</h2>
        
        {/* Toggle Buttons */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("MONTH")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === "MONTH" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode("YEAR")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === "YEAR" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {viewMode === "MONTH" ? renderMonthView() : renderYearView()}

      {/* Styles for Year View (react-calendar-heatmap override) */}
      <style jsx global>{`
        .react-calendar-heatmap text { font-size: 10px; fill: #9ca3af; }
        .react-calendar-heatmap .color-empty { fill: #ebedf0; }
        .react-calendar-heatmap .color-scale-1 { fill: #c6e48b; }
        .react-calendar-heatmap .color-scale-2 { fill: #7bc96f; }
        .react-calendar-heatmap .color-scale-3 { fill: #239a3b; }
        .react-calendar-heatmap .color-scale-4 { fill: #196127; }
        .react-calendar-heatmap rect:hover { stroke: #555; stroke-width: 1px; }
      `}</style>
    </div>
  );
}