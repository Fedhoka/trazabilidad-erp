import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

/** HTTP methods → audit actions */
const METHOD_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

/**
 * Global interceptor — fires an audit log entry for every mutating request
 * (POST / PUT / PATCH / DELETE) that completes successfully (no exception).
 *
 * It does NOT inspect response bodies to infer entity IDs because that would
 * require knowledge of every service's return shape.  The entity name is
 * derived from the URL path (first segment after the base path), and the
 * entity ID from the first UUID-shaped path segment (if any).
 *
 * Example: PATCH /purchase-orders/abc-123 → entity=purchase-orders, entityId=abc-123
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      user?: { sub?: string; email?: string; tenantId?: string };
      body?: Record<string, unknown>;
      ip?: string;
      headers?: Record<string, string>;
    }>();

    const action = METHOD_ACTION[req.method];
    if (!action) return next.handle(); // GET / HEAD / OPTIONS — skip

    const user = req.user;
    if (!user?.tenantId) return next.handle(); // unauthenticated (public routes)

    // Parse URL: /purchase-orders/uuid → ['purchase-orders', 'uuid']
    const segments = req.url.split('?')[0].replace(/^\//, '').split('/');
    const entity = segments[0] ?? 'unknown';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const entityId = segments.find((s) => uuidRegex.test(s)) ?? null;

    // Capture a sanitised snapshot of the request body (strip passwords).
    const safeBody = req.body ? sanitizeBody(req.body) : null;

    const ipAddress =
      (req.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.ip ??
      null;

    return next.handle().pipe(
      tap(() => {
        this.audit.log({
          tenantId: user.tenantId!,
          userId: user.sub ?? null,
          userEmail: user.email ?? null,
          action,
          entity,
          entityId,
          metadata: safeBody,
          ipAddress,
        });
      }),
    );
  }
}

const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'newPassword', 'token', 'secret']);

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    result[k] = SENSITIVE_KEYS.has(k) ? '***' : v;
  }
  return result;
}
