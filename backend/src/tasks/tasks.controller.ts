// src/tasks/tasks.controller.ts
import { Controller, Get, Post, Body, UseGuards, Delete, Param, ParseIntPipe } from '@nestjs/common';
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
// DELETE /tasks/all (Notice: Put this BEFORE /:id to avoid route conflict)
  @Delete('all')
  removeAllTasks(@GetUser('id') userId: number) {
    return this.tasksService.removeAll(userId);
  }

  // DELETE /tasks/:id
  @Delete(':id')
  removeTask(@Param('id', ParseIntPipe) id: number, @GetUser('id') userId: number) {
    return this.tasksService.remove(id, userId);
  }
}
