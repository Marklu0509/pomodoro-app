// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes this module available globally via dependency injection
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export the service so other modules can use it
})
export class PrismaModule {}