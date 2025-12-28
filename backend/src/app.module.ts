import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { SessionsModule } from './sessions/sessions.module';
import { SettingsModule } from './settings/settings.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [PrismaModule, AuthModule, TasksModule, SessionsModule, SettingsModule, StatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
