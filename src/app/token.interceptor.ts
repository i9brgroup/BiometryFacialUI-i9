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
    const isLoginRequest = req.url.includes('/auth/login');

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

          // 1. Detecta se é HTML (como você já fazia)
          isHtmlResponse = typeof body === 'string' && (body.trim().startsWith('<!doctype') || body.trim().startsWith('<html'));

          // 2. Tenta extrair a mensagem do JSON (se o campo for 'message')
          if (body && typeof body === 'object' && 'message' in body) {
            message = body.message;
          } else if (typeof body === 'string' && !isHtmlResponse) {
            message = body;
          }

          if (status === 401 || status === 403 || isHtmlResponse) {
            if (!isLoginRequest) {
              shouldLogout = false; // Prevents forced logout based on issue description
              // Display error at the top via global state (AuthService)
              const displayMsg = `Erro ${status}: ${message}`;
              this.auth.apiError.set(displayMsg);
            } else {
              shouldLogout = true;
            }
          } else if (status !== 0 && !isLoginRequest) {
            // Other API errors (non-login) should also show at the top
            const displayMsg = `Erro ${status}: ${message}`;
            this.auth.apiError.set(displayMsg);
          }
        }

        if (shouldLogout) {
          this.auth.logout();
          this.router.navigateByUrl('/login');
        }

        const apiErr = { status, message };
        return throwError(() => apiErr);
      }),
    );
  }
}
