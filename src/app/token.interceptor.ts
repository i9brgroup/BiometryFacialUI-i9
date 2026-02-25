import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Only attach token to requests to these hosts/prefixes (API-specific)
  private allowedPrefixes = ['http://localhost:8080/api', 'http://127.0.0.1:8000', '/api'];

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.getToken();

    // Decide whether to attach Authorization header
    const shouldAttach = this.allowedPrefixes.some((p) => req.url.startsWith(p));

    let reqToSend = req;
    if (shouldAttach) {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      reqToSend = req.clone({ setHeaders: headers });
    }

    return next.handle(reqToSend).pipe(
      catchError((err: unknown) => {
        // Normalize many error shapes and trigger logout when appropriate
        let shouldLogout = false;
        let isHtmlResponse = false;
        let message = 'Erro na requisição';
        let status = 0;

        if (err instanceof HttpErrorResponse) {
          status = err.status || 0;
          const body = err.error;
          // HTML detection
          isHtmlResponse = typeof body === 'string' && (body.trim().startsWith('<!doctype') || body.trim().startsWith('<html'));

          // Unauthorized/forbidden
          if (status === 401 || status === 403) shouldLogout = true;

          // Some servers reply with HTML (login page) or redirect to login causing parser issues
          if (isHtmlResponse) shouldLogout = true;

          // Collect message
          message = err.message || (typeof body === 'string' ? body : JSON.stringify(body));
        } else if (err instanceof Error) {
          // Generic JS Error — HttpClient parsing issues surface here with messages like "Http failure during parsing for ..."
          const m = err.message || '';
          if (m.includes('Http failure during parsing') || m.includes('Unexpected token') || m.includes('Unexpected end of JSON input')) {
            shouldLogout = true;
          }
          message = m;
        }

        if (shouldLogout) {
          try {
            this.auth.logout();
            this.router.navigateByUrl('/login');
          } catch {}
          const apiErr = { status, message: 'Sessão inválida ou servidor retornou conteúdo inesperado. Faça login novamente.' };
          return throwError(() => apiErr);
        }

        return throwError(() => err);
      }),
    );
  }
}
