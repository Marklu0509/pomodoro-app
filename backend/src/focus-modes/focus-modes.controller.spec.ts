// backend/src/focus-modes/focus-modes.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { FocusModesService } from './focus-modes.service';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';

@UseGuards(JwtGuard)
@Controller('focus-modes')
export class FocusModesController {
  constructor(private readonly focusModesService: FocusModesService) {}

  // ★ Endpoint to get all profiles for the logged-in user
  @Get()
  async getModes(@GetUser('id') userId: number) {
    return this.focusModesService.findAll(userId);
  }
}