// backend/src/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Get user settings (create default if not exists)
  async findOne(userId: number) {
    return this.prisma.settings.upsert({
      where: { userId },
      update: {}, // No update if found
      create: {
        userId,
        // Default values are defined in schema.prisma, so we don't need to list them here unless we want overrides
      },
    });
  }

  // Update user settings
  async update(userId: number, updateSettingDto: UpdateSettingDto) {
    return this.prisma.settings.upsert({
      where: { userId },
      update: {
        ...updateSettingDto,
      },
      create: {
        userId,
        ...updateSettingDto,
      },
    });
  }
}