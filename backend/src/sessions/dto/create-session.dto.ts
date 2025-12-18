// src/sessions/dto/create-session.dto.ts
import { IsInt, IsOptional, Min, IsPositive } from 'class-validator';

export class CreateSessionDto {
  // The duration of the focus session in seconds (e.g., 1500 for 25 mins)
  @IsInt()
  @IsPositive()
  durationSeconds: number;

  // The ID of the task this session is associated with (Optional)
  // User might just focus without linking to a specific task
  @IsInt()
  @IsOptional()
  taskId?: number;
}