import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // Create a new task linked to the user
  async create(userId: number, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        // Manual assignment instead of spread operator (...dto)
        // This ensures TypeScript knows 'title' is definitely present
        title: dto.title,
        description: dto.description,
        estimatedPomodoros: dto.estimatedPomodoros,
      },
    });
  }

  // Get all tasks belonging to the logged-in user
  async findAll(userId: number) {
    return this.prisma.task.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc', // Sort by newest first
      },
    });
  }
}