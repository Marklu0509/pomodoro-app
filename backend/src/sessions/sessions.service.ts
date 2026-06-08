// backend/src/sessions/sessions.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateSessionDto) {
    // 1. Check Task ownership
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

    // 2. Real timestamps: the session just ENDED now, so it started
    //    `durationSeconds` ago. (Previously endTime was set in the future.)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - dto.durationSeconds * 1000);
    const status = dto.status ?? 'COMPLETED';

    // 3. Database Transaction
    return this.prisma.$transaction(async (tx) => {
      // Step A: Create session record
      const session = await tx.pomodoroSession.create({
        data: {
          userId,
          taskId: dto.taskId,
          durationSeconds: dto.durationSeconds,
          startTime: startTime,
          endTime: endTime,
          status: status,
        },
      });

      // Step B: Update task progress & Check completion
      if (dto.taskId) {
        // First, increment the counter and get the updated task
        const updatedTask = await tx.task.update({
          where: { id: dto.taskId },
          data: {
            completedPomodoros: {
              increment: 1,
            },
          },
        });

        // P7.2: keep isCompleted in sync with progress in BOTH directions, so
        // it can flip back to false if the estimate later exceeds completed.
        const isCompleted =
          updatedTask.completedPomodoros >= updatedTask.estimatedPomodoros;
        if (updatedTask.isCompleted !== isCompleted) {
          await tx.task.update({
            where: { id: dto.taskId },
            data: { isCompleted },
          });
        }
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
