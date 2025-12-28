// backend/src/stats/stats.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, subDays, format, subYears } from 'date-fns';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getUserStats(userId: number) {
    // 1. Get user settings (for Daily Goal)
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
    });
    const dailyGoalMinutes = settings?.dailyGoal || 120; // Default 120 mins

    // 2. Calculate "Today's" focus time
    const todayStart = startOfDay(new Date());
    const todaySessions = await this.prisma.pomodoroSession.findMany({
      where: {
        userId,
        startTime: { gte: todayStart },
      },
    });
    
    const todaySeconds = todaySessions.reduce((acc, session) => acc + session.durationSeconds, 0);
    const todayMinutes = Math.floor(todaySeconds / 60);

    // 3. Calculate "Last 7 Days" stats (for the chart)
    const weeklyStats: { date: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const nextDay = startOfDay(subDays(new Date(), i - 1));

      // Query sessions for this specific day
      const sessions = await this.prisma.pomodoroSession.findMany({
        where: {
          userId,
          startTime: { gte: start, lt: nextDay },
        },
      });

      const totalSeconds = sessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
      
      weeklyStats.push({
        date: format(date, 'MM/dd'), // Format: "12/25"
        minutes: Math.floor(totalSeconds / 60),
      });
    }

    return {
      today: {
        minutes: todayMinutes,
        goal: dailyGoalMinutes,
        progress: Math.min(Math.round((todayMinutes / dailyGoalMinutes) * 100), 100),
      },
      weekly: weeklyStats,
    };
  }

// ★ New Method: Get data for heatmaps (Last 365 days)
  async getHeatmapData(userId: number) {
    // 1. Define range: From 1 year ago to Today
    const endDate = new Date();
    const startDate = subYears(endDate, 1);

    // 2. Query all sessions within this range
    const sessions = await this.prisma.pomodoroSession.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        startTime: true,
        durationSeconds: true,
      },
    });

    // 3. Aggregate data by date (YYYY-MM-DD)
    // Map format: { "2023-12-25": 120, "2023-12-26": 50 }
    const dailyMap = new Map<string, number>();

    sessions.forEach((session) => {
      // Convert UTC time to YYYY-MM-DD string
      // Note: Ideally, handle timezone from client, but here we use server local or UTC
      const dateStr = format(session.startTime, 'yyyy-MM-dd');
      
      const current = dailyMap.get(dateStr) || 0;
      // Convert seconds to minutes
      dailyMap.set(dateStr, current + Math.floor(session.durationSeconds / 60));
    });

    // 4. Convert Map to Array for frontend (recharts or heatmap lib friendly)
    const heatmapData = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      count, // minutes
    }));

    return heatmapData;
  }
}
