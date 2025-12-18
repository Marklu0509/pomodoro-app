// src/tasks/tasks.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';
// FIX: Change 'import' to 'import type' for the User model
import type { User } from '@prisma/client'; 

@UseGuards(JwtGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@GetUser() user: User, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(user.id, createTaskDto);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.tasksService.findAll(user.id);
  }
}