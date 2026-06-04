// src/auth/dto/create-auth.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  // P0.2: name is optional — the frontend only sends it conditionally, so
  // requiring it here made signup fail with a misleading "email already used" error.
  @IsOptional()
  @IsString()
  name?: string;
}
