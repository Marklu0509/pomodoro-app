// src/sessions/sessions.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtGuard) // Protect all endpoints
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@GetUser() user: User, @Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(user.id, createSessionDto);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.sessionsService.findAll(user.id);
  }
}