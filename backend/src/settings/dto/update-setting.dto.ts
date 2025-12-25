// backend/src/settings/dto/update-setting.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateSettingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  workDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  shortBreakDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  longBreakDuration?: number;

  @IsOptional()
  @IsBoolean()
  autoStartBreaks?: boolean;

  @IsOptional()
  @IsBoolean()
  autoStartPomodoros?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  tickVolume?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  notificationVolume?: number;

  @IsOptional()
  @IsString()
  backgroundSound?: string;

  @IsOptional()
  @IsString()
  tickingSound?: string;

  @IsOptional()
  @IsBoolean()
  alertAt25Percent?: boolean;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  miniClockMode?: boolean;

  @IsOptional()
  @IsBoolean()
  lockWindow?: boolean;
}