import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUserPayload {
  userId: string;
  email?: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUserPayload }>();
    return request.user;
  },
);
