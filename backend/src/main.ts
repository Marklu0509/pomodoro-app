// backend/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // All routes are served under /api so a single Nginx origin can route
  // /api -> NestJS and /stats-api -> Go service (matches the frontend baseURL).
  app.setGlobalPrefix('api');

  // P0.4: restrict CORS to known origins instead of allowing everyone.
  // FRONTEND_ORIGIN is comma-separated; chrome-extension:// origins are allowed
  // so the browser extension (Phase 6) can call the same API.
  const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // allow requests with no Origin (same-origin, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.startsWith('chrome-extension://')) return callback(null, true);
      return callback(
        new Error(`Origin not allowed by CORS: ${origin}`),
        false,
      );
    },
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
