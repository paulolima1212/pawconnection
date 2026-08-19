import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Resolves a correlation id for the current request: reuses an inbound
 * `x-correlation-id` header when present (so a single trace spans services),
 * otherwise generates one. The value is cached on the request and echoed back
 * on the response so clients and logs can stitch the full flow together.
 */
export const CorrelationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      correlationId?: string;
    }>();
    const res = ctx.switchToHttp().getResponse<{
      setHeader?: (name: string, value: string) => void;
    }>();

    if (req.correlationId) return req.correlationId;

    const headerValue = req.headers[CORRELATION_ID_HEADER];
    const correlationId =
      (Array.isArray(headerValue) ? headerValue[0] : headerValue) || randomUUID();

    req.correlationId = correlationId;
    res.setHeader?.(CORRELATION_ID_HEADER, correlationId);
    return correlationId;
  },
);
