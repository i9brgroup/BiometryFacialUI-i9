import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './token.interceptor';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <!-- Route Transition Loading Bar -->
    <div *ngIf="navigating()" class="route-loading-overlay">
      <div class="route-loading-bar"></div>
      <div class="route-loading-backdrop"></div>
    </div>

    <!-- Session Expired Alert (full-screen blocking card) -->
    <div *ngIf="auth.sessionExpired()" class="session-expired-overlay">
      <div class="session-expired-card animate-fade-in">
        <div class="session-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" class="session-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 class="session-title">Sessão Expirada</h2>
        <p class="session-desc">
          Sua sessão foi encerrada por inatividade ou falta de permissão.
          Não foi possível renovar automaticamente o acesso após múltiplas tentativas.
        </p>
        <button class="session-btn" (click)="handleRelogin()">
          Fazer Login Novamente
        </button>
      </div>
    </div>

    <router-outlet />
  `,
  styles: [`
    /* ── Apple-style top loading bar ── */
    .route-loading-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
    }

    .route-loading-bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 3px;
      width: 100%;
      background: linear-gradient(90deg, transparent, #0b3b66 30%, #4d8bbf 60%, #0b3b66 80%, transparent);
      background-size: 300% 100%;
      animation: route-bar-slide 1.2s ease-in-out infinite;
      box-shadow: 0 0 12px rgba(11, 59, 102, 0.4);
    }

    .route-loading-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(245, 245, 247, 0.3);
      backdrop-filter: blur(1px);
      animation: route-backdrop-in 0.15s ease forwards;
    }

    @keyframes route-bar-slide {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    @keyframes route-backdrop-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ── Session Expired Overlay ── */
    .session-expired-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .session-expired-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
      padding: 48px 40px;
      width: 440px;
      max-width: calc(100vw - 32px);
      text-align: center;
    }

    .session-icon-wrap {
      width: 64px;
      height: 64px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .session-icon {
      width: 32px;
      height: 32px;
      color: #dc2626;
    }

    .session-title {
      font-size: 24px;
      font-weight: 700;
      color: #1d1d1f;
      letter-spacing: -0.5px;
      line-height: 1.14;
      margin: 0 0 12px;
    }

    .session-desc {
      font-size: 15px;
      font-weight: 400;
      color: rgba(0, 0, 0, 0.5);
      letter-spacing: -0.3px;
      line-height: 1.5;
      margin: 0 0 32px;
    }

    .session-btn {
      width: 100%;
      padding: 14px 24px;
      border-radius: 12px;
      background: #0b3b66;
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.3px;
      border: none;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.1s ease;
    }

    .session-btn:hover {
      background: #082d4f;
    }

    .session-btn:active {
      transform: scale(0.97);
    }
  `],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }],
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('cadastro-faciais-i9');
  protected readonly navigating = signal(false);

  public readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private routerSub!: Subscription;

  ngOnInit(): void {
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.navigating.set(true);
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        setTimeout(() => this.navigating.set(false), 150);
      }
    });
  }

  handleRelogin(): void {
    this.auth.sessionExpired.set(false);
    this.auth.apiError.set(null);
    this.router.navigateByUrl('/login');
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
