// src/sessions/sessions.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateSessionDto) {
    // 1. Check Task ownership (Security)
    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.taskId },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${dto.taskId} not found`);
      }

      if (task.userId !== userId) {
        throw new ForbiddenException('You do not own this task');
      }
    }

    // --- FIX STARTS HERE ---
    // 2. Calculate Timestamps manually
    const startTime = new Date(); // startTime = current time 
    const endTime = new Date(startTime.getTime() + dto.durationSeconds * 1000); 
    // --- FIX ENDS HERE ---

    // 3. Database Transaction
    return this.prisma.$transaction(async (tx) => {
      // Step A: Create session with calculated times
      const session = await tx.pomodoroSession.create({
        data: {
          userId,
          taskId: dto.taskId,
          durationSeconds: dto.durationSeconds,
          startTime: startTime,
          endTime: endTime,
        },
      });

      // Step B: Update task progress
      if (dto.taskId) {
        await tx.task.update({
          where: { id: dto.taskId },
          data: {
            completedPomodoros: {
              increment: 1,
            },
          },
        });
      }

      return session;
    });
  }

  async findAll(userId: number) {
    return this.prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        task: true,
      },
    });
  }
}