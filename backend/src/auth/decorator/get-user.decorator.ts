// src/auth/decorator/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Create a custom parameter decorator to extract the user from the request
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // Switch context to HTTP and get the request object
    const request = ctx.switchToHttp().getRequest();
    
    // If a specific property is requested (e.g., @GetUser('email')), return only that
    if (data) {
      return request.user[data];
    }
    
    // Otherwise return the full user object
    return request.user;
  },
);