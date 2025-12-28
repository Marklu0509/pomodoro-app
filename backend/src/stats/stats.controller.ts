// backend/src/stats/stats.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  getStats(@GetUser() user: User) {
    return this.statsService.getUserStats(user.id);
  }

  @Get('heatmap')
  getHeatmap(@GetUser() user: User) {
    return this.statsService.getHeatmapData(user.id);
  }
}