import {Injectable, inject, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {jwtDecode} from 'jwt-decode';
import {TokenPayload} from './login/TokenPayload';
import {MatSnackBar} from '@angular/material/snack-bar';

export interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'app_token';
  error = signal<string | null>(null);
  apiError: any;

  login(payload: LoginPayload): Observable<{ token: string }> {
    return this.http.post<{ token: string }>('http://localhost:8080/api/v1/auth/login', payload).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem(this.STORAGE_KEY, res.token);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getRoleByToken() {
    try {
      const token = this.getToken();
      if (token) {
        const decoded = jwtDecode<TokenPayload>(token);
        console.log("ROLE DO USUARIO - ", decoded.role);
        return decoded.role;
      }
    }catch (error: any){
      const message = error?.error?.detail || error?.message || 'Erro ao decodificar token';
      this.error.set(String(message));
      return null;
    }
    return null;
  }
}

