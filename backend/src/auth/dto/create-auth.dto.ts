// src/auth/dto/create-auth.dto.ts
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}