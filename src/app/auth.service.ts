import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { LoginPayload, TokenPayload } from './auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly ACCESS_TOKEN_KEY = 'app_access_token';
  isAuthenticated = signal<boolean>(!!this.getToken());
  apiError = signal<string | null>(null);

  login(payload: LoginPayload): Observable<any> {
    return this.http.post<any>('/api/v1/auth/login', payload).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>('/api/v1/auth/refresh', {}, { withCredentials: true }).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  private handleAuthResponse(res: any) {
    const token = res?.token || res?.accessToken || res?.access_token;
    if (token) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      this.isAuthenticated.set(true);
    }
  }

  logout(): Observable<void> {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.getToken()}` });
    return this.http.post<void>('/api/v1/auth/logout', {}, { headers, withCredentials: true }).pipe(
      tap(() => this.clearStorage())
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  private clearStorage() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    this.isAuthenticated.set(false);
  }

  getRoleByToken(): string | null {
    try {
      const token = this.getToken();
      return token ? jwtDecode<TokenPayload>(token).role : null;
    } catch {
      return null;
    }
  }
}

