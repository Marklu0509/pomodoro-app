// backend/src/settings/settings.controller.ts
import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtGuard) // ★ Protect all endpoints: Only logged-in users can access
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Get current user's settings
  @Get()
  findOne(@GetUser() user: User) {
    return this.settingsService.findOne(user.id);
  }

  // Update current user's settings
  @Patch()
  update(@GetUser() user: User, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.update(user.id, updateSettingDto);
  }
}