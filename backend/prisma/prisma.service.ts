// backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // connect to db when module turns on
  async onModuleInit() {
    await this.$connect();
  }

  // disconnect to db when module turns off
  async onModuleDestroy() {
    await this.$disconnect();
  }
}