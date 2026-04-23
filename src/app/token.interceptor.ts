import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  // Only attach token to requests to these hosts/prefixes (API-specific)
  private allowedPrefixes = ['/api'];

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.getToken();
    const isRefreshRequest = req.url.includes('/auth/refresh');
    const shouldAttach = this.allowedPrefixes.some((p) => req.url.startsWith(p));

    let reqToSend = req;
    if (shouldAttach) {
      const headers: Record<string, string> = { Accept: 'application/json' };
      
      // Do NOT attach the expired token to the refresh request
      if (token && !isRefreshRequest) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      reqToSend = req.clone({ 
        setHeaders: headers,
        withCredentials: true // Required for HTTPOnly cookies (refreshToken)
      });
    }

    return next.handle(reqToSend).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          const status = err.status || 0;
          const isLoginRequest = req.url.includes('/auth/login');
          const isRefreshRequest = req.url.includes('/auth/refresh');

          // If 401/403 and not a login/refresh request, try to refresh
          if ((status === 401 || status === 403) && !isLoginRequest && !isRefreshRequest) {
            console.log(`[TokenInterceptor] Interceptado erro ${status}. Iniciando rotação de token para: ${req.url}`);
            return this.handle401Error(reqToSend, next);
          }

          // Handle other errors or errors that couldn't be refreshed
          let message = 'Erro na requisição';
          const body = err.error;
          const isHtmlResponse = typeof body === 'string' && (body.trim().startsWith('<!doctype') || body.trim().startsWith('<html'));

          if (body && typeof body === 'object' && 'message' in body) {
            message = body.message;
          } else if (typeof body === 'string' && !isHtmlResponse) {
            message = body;
          }

          if (status === 401 || status === 403 || isHtmlResponse) {
            if (!isLoginRequest) {
              const displayMsg = `Sessão expirada ou sem permissão (${status})`;
              this.auth.apiError.set(displayMsg);
              
              // If it was a refresh request that failed with 401, logout
              if (isRefreshRequest) {
                this.logoutAndRedirect();
              }
            }
          } else if (status !== 0 && !isLoginRequest) {
            const displayMsg = `Erro ${status}: ${message}`;
            this.auth.apiError.set(displayMsg);
          }
        }

        return throwError(() => err);
      }),
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.auth.refreshToken().pipe(
        switchMap((newToken: string) => {
          console.log('[TokenInterceptor] Token rotacionado com sucesso. Repetindo requisição original.');
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          console.error('[TokenInterceptor] Falha ao rotacionar token. Deslogando usuário.', err);
          this.isRefreshing = false;
          this.logoutAndRedirect();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token!));
        })
      );
    }
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  private logoutAndRedirect() {
    this.auth.logout().subscribe({
      complete: () => this.router.navigateByUrl('/login')
    });
  }
}
