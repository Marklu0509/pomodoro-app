// backend/src/focus-modes/focus-modes.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { FocusModesService } from './focus-modes.service';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';

@UseGuards(JwtGuard)
@Controller('focus-modes')
export class FocusModesController {
  constructor(private readonly focusModesService: FocusModesService) {}

  @Get()
  getModes(@GetUser('id') userId: number) {
    return this.focusModesService.findAll(userId);
  }

  @Post()
  createMode(@GetUser('id') userId: number, @Body() dto: any) {
    return this.focusModesService.create(userId, dto);
  }

  @Patch(':id')
  updateMode(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @Body() dto: any
  ) {
    return this.focusModesService.update(id, userId, dto);
  }

  @Delete(':id')
  removeMode(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number
  ) {
    return this.focusModesService.remove(id, userId);
  }
}
