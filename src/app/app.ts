import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './token.interceptor';
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
  `],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }],
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('cadastro-faciais-i9');
  protected readonly navigating = signal(false);

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
        // Small delay so animation doesn't flash for instant navigations
        setTimeout(() => this.navigating.set(false), 150);
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
