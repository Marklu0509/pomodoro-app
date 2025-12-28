// backend/src/stats/stats.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, subDays, format } from 'date-fns';

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
    const weeklyStats = [];
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
}