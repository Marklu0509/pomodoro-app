// backend/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ★★★ NEW: Enable CORS (Cross-Origin Resource Sharing) ★★★
  // This allows the frontend (running on a different port) to communicate with this backend.
  app.enableCors(); 
  
  await app.listen(3000);
}
bootstrap();