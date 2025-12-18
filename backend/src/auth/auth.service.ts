// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // --- Login Logic ---
  async login(dto: LoginDto) {
    // 1. Find the user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    
    // Throw error if user doesn't exist
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // 2. Compare passwords (input vs hashed)
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // 3. Generate and return the JWT token
    return this.signToken(user.id, user.email);
  }

  // --- Signup Logic ---
  async signup(dto: CreateAuthDto) {
    // 1. Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(dto.password, salt);

    try {
      // 2. Save new user to the database
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hash,
          name: dto.name,
        },
      });

      // 3. Return the token immediately upon successful signup
      return this.signToken(user.id, user.email);
    } catch (error) {
      // Handle unique constraint violation (P2002 code from Prisma)
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already exists');
        }
      }
      throw error;
    }
  }

  // --- Helper: Generate JWT Token ---
  private async signToken(userId: number, email: string) {
    const payload = { sub: userId, email };
    
    // Sign the token with a secret key
    // Note: In a real production app, use ConfigService to load this from .env
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1d', // Token expires in 1 day
      secret: 'super-secret-key',
    });

    return {
      accessToken: token,
      user: { id: userId, email },
    };
  }
}