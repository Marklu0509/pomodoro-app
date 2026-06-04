import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { SessionsModule } from './sessions/sessions.module';
import { SettingsModule } from './settings/settings.module';
import { StatsModule } from './stats/stats.module';
import { FocusModesModule } from './focus-modes/focus-modes.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    // P0.3: load + validate env globally; fail fast if JWT_SECRET/DATABASE_URL missing.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // P0.5: rate limiting (global storage); auth endpoints apply a stricter limit.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    TasksModule,
    SessionsModule,
    SettingsModule,
    StatsModule,
    FocusModesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
