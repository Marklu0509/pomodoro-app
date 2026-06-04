// backend/src/config/env.validation.ts
// P0.3: fail fast at startup if required secrets/config are missing,
// instead of silently falling back to an insecure hardcoded value.

interface EnvVars {
  JWT_SECRET: string;
  DATABASE_URL: string;
  PORT: number;
  FRONTEND_ORIGIN?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const errors: string[] = [];

  const jwtSecret = config.JWT_SECRET;
  if (typeof jwtSecret !== 'string' || jwtSecret.length < 16) {
    errors.push('JWT_SECRET is required and must be at least 16 characters');
  }

  const databaseUrl = config.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) {
    errors.push('DATABASE_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n - ${errors.join('\n - ')}`);
  }

  const port = Number(config.PORT ?? 3000);

  return {
    JWT_SECRET: jwtSecret as string,
    DATABASE_URL: databaseUrl as string,
    PORT: Number.isNaN(port) ? 3000 : port,
    FRONTEND_ORIGIN:
      typeof config.FRONTEND_ORIGIN === 'string' ? config.FRONTEND_ORIGIN : undefined,
  };
}
