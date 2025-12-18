// src/auth/guard/jwt.guard.ts
import { AuthGuard } from '@nestjs/passport';

// Create a custom class extending the standard JWT AuthGuard
// This avoids using magic strings like 'jwt' in controllers
export class JwtGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}