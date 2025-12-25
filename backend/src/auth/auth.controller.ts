// backend/src/settings/settings.controller.ts
import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { User } from '@prisma/client';

@UseGuards(JwtGuard) // ★ Protect all endpoints
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findOne(@GetUser() user: User) {
    return this.settingsService.findOne(user.id);
  }

  @Patch()
  update(@GetUser() user: User, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.update(user.id, updateSettingDto);
  }
}