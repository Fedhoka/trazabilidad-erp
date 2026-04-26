import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Global interceptor that forwards unhandled server-side errors (HTTP 5xx) to
 * Sentry.  4xx errors (bad request, not found, unauthorised) are deliberate
 * application responses and are NOT forwarded — they would create noise.
 *
 * The interceptor is registered as APP_INTERCEPTOR in AppModule so it wraps
 * every controller handler automatically.
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((err: unknown) => {
        if (this.shouldCapture(err)) {
          const req = context.switchToHttp().getRequest<{
            method?: string;
            url?: string;
            user?: { sub?: string; email?: string; tenantId?: string };
          }>();

          Sentry.withScope((scope) => {
            scope.setTag('method', req.method ?? 'unknown');
            scope.setTag('url', req.url ?? 'unknown');

            if (req.user) {
              scope.setUser({
                id: req.user.sub,
                email: req.user.email,
                // Include tenantId as extra context
                data: { tenantId: req.user.tenantId },
              });
            }

            Sentry.captureException(err);
          });
        }

        return throwError(() => err);
      }),
    );
  }

  private shouldCapture(err: unknown): boolean {
    // Skip deliberate HTTP 4xx responses — not bugs, not worth alerting on
    if (err instanceof HttpException) {
      return err.getStatus() >= 500;
    }
    // Non-HTTP errors (TypeORM failures, unhandled throws, etc.) → always capture
    return true;
  }
}
