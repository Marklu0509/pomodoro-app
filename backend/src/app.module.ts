import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [PrismaModule, AuthModule, TasksModule, SessionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
