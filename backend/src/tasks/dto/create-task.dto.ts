import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

// DTO for creating a task
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedPomodoros?: number;
}
