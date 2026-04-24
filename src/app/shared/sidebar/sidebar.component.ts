import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
  <aside class="sidebar-glass">
    <!-- Brand -->
    <div class="sidebar-brand">
      <img src="/Biometria.ico" alt="logo" class="sidebar-logo" />
      <div class="sidebar-brand-text">
        <span class="sidebar-brand-name">i9 Biometria</span>
        <span class="sidebar-brand-sub">Controle Facial</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav" aria-label="Menu de navegação">
      <button
        class="sidebar-nav-item"
        [class.active]="router.url === '/employee'"
        (click)="navTo('/employee')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Gestão Biométrica</span>
      </button>

      <!-- Funcionários Dropdown (all authenticated users) -->
      <div class="sidebar-dropdown">
        <button
          class="sidebar-nav-item"
          [class.active]="isEmployeeRoute()"
          (click)="toggleEmployeeDropdown()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Funcionários</span>
          <svg class="dropdown-chevron" [class.dropdown-open]="employeeDropdownOpen()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div *ngIf="employeeDropdownOpen()" class="dropdown-items">
          <button
            class="dropdown-item"
            [class.active]="router.url === '/gerenciar-funcionarios'"
            (click)="navTo('/gerenciar-funcionarios')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Gerenciar Funcionários
          </button>
        </div>
      </div>

      <!-- Admin Dropdown (SUPER_ADMIN only) -->
      <div *ngIf="role === 'SUPER_ADMIN'" class="sidebar-dropdown">
        <button
          class="sidebar-nav-item"
          [class.active]="isAdminRoute()"
          (click)="toggleDropdown()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Administração</span>
          <svg class="dropdown-chevron" [class.dropdown-open]="dropdownOpen()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div *ngIf="dropdownOpen()" class="dropdown-items">
          <button
            class="dropdown-item"
            [class.active]="router.url === '/cadastro'"
            (click)="navTo('/cadastro')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Criar Novo Usuário
          </button>
          <button
            class="dropdown-item"
            [class.active]="router.url === '/gerenciar-usuarios'"
            (click)="navTo('/gerenciar-usuarios')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Gerenciar Usuários
          </button>
        </div>
      </div>
    </nav>

    <!-- Logout -->
    <div class="sidebar-footer">
      <button class="sidebar-logout" (click)="openLogoutModal()">
        <svg xmlns="http://www.w3.org/2000/svg" class="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Encerrar Sessão
      </button>
    </div>

  </aside>

  <!-- Logout Confirm Modal -->
  <div *ngIf="modalOpen()" class="modal-overlay animate-fade-in">
    <div role="dialog" aria-modal="true" aria-labelledby="logoutTitle" class="modal-card">
      <div class="modal-icon-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" class="modal-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 id="logoutTitle" class="modal-title">Confirmar Saída?</h3>
      <p class="modal-desc">Sua sessão será encerrada e você precisará se autenticar novamente.</p>
      <div class="modal-actions">
        <button class="modal-btn-secondary" (click)="closeLogoutModal()">Manter Logado</button>
        <button class="modal-btn-danger" (click)="confirmLogout()">Sair Agora</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .sidebar-glass {
      position: fixed; top: 0; left: 0; bottom: 0; width: 260px;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      color: #ffffff; display: flex; flex-direction: column; z-index: 40;
    }
    .sidebar-brand { padding: 28px 24px; display: flex; align-items: center; gap: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .sidebar-logo { width: 40px; height: 40px; }
    .sidebar-brand-text { display: flex; flex-direction: column; }
    .sidebar-brand-name { font-size: 17px; font-weight: 600; letter-spacing: -0.374px; line-height: 1.24; }
    .sidebar-brand-sub { font-size: 12px; font-weight: 400; color: rgba(255,255,255,0.4); letter-spacing: -0.12px; margin-top: 2px; }

    .sidebar-nav { flex: 1; display: flex; flex-direction: column; padding: 16px 12px; gap: 2px; }
    .sidebar-nav-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px;
      font-size: 14px; font-weight: 400; letter-spacing: -0.224px;
      color: rgba(255,255,255,0.6); background: transparent; border: none;
      cursor: pointer; transition: all 0.15s ease; text-align: left; width: 100%;
    }
    .sidebar-nav-item:hover { color: #ffffff; background: rgba(255,255,255,0.08); }
    .sidebar-nav-item.active { color: #ffffff; background: rgba(255,255,255,0.12); font-weight: 600; }
    .sidebar-icon { width: 20px; height: 20px; flex-shrink: 0; }

    /* Dropdown */
    .sidebar-dropdown { display: flex; flex-direction: column; }
    .dropdown-chevron { margin-left: auto; transition: transform 0.2s ease; flex-shrink: 0; opacity: 0.5; }
    .dropdown-chevron.dropdown-open { transform: rotate(180deg); }
    .dropdown-items { display: flex; flex-direction: column; gap: 1px; padding-left: 12px; margin-top: 2px; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 8px;
      font-size: 13px; font-weight: 400; letter-spacing: -0.12px;
      color: rgba(255,255,255,0.5); background: transparent; border: none;
      cursor: pointer; transition: all 0.15s ease; text-align: left; width: 100%;
    }
    .dropdown-item:hover { color: #ffffff; background: rgba(255,255,255,0.06); }
    .dropdown-item.active { color: #ffffff; background: rgba(255,255,255,0.1); font-weight: 600; }
    .dropdown-icon { width: 16px; height: 16px; flex-shrink: 0; }

    /* Footer / Logout */
    .sidebar-footer { padding: 16px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
    .sidebar-logout {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: 400; letter-spacing: -0.12px;
      color: rgba(255,255,255,0.5); background: transparent; border: 1px solid rgba(255,255,255,0.12);
      cursor: pointer; transition: all 0.2s ease;
    }
    .sidebar-logout:hover { color: #ffffff; background: rgba(220,38,38,0.8); border-color: transparent; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
    .modal-card { background: #ffffff; border-radius: 12px; box-shadow: rgba(0,0,0,0.22) 3px 5px 30px 0px; padding: 32px; width: 400px; max-width: calc(100vw - 32px); text-align: center; }
    .modal-icon-wrap { width: 48px; height: 48px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .modal-icon { width: 24px; height: 24px; color: #dc2626; }
    .modal-title { font-size: 21px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; line-height: 1.19; margin: 0 0 8px; }
    .modal-desc { font-size: 14px; font-weight: 400; color: rgba(0,0,0,0.48); letter-spacing: -0.224px; line-height: 1.43; margin: 0 0 24px; }
    .modal-actions { display: flex; gap: 12px; }
    .modal-btn-secondary { flex: 1; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; letter-spacing: -0.224px; color: #1d1d1f; background: #f5f5f7; border: none; cursor: pointer; transition: background 0.15s; }
    .modal-btn-secondary:hover { background: #e8e8ed; }
    .modal-btn-danger { flex: 1; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; letter-spacing: -0.224px; color: #ffffff; background: #dc2626; border: none; cursor: pointer; transition: background 0.15s; }
    .modal-btn-danger:hover { background: #b91c1c; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  public readonly router = inject(Router);
  public readonly auth = inject(AuthService);
  modalOpen = signal(false);
  dropdownOpen = signal(false);
  employeeDropdownOpen = signal(false);
  role = this.auth.getRoleByToken();

  isAdminRoute(): boolean {
    return this.router.url === '/cadastro' || this.router.url === '/gerenciar-usuarios';
  }

  isEmployeeRoute(): boolean {
    return this.router.url === '/gerenciar-funcionarios';
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  toggleEmployeeDropdown(): void {
    this.employeeDropdownOpen.update(v => !v);
  }

  navTo(path: string) {
    this.auth.apiError.set(null);
    this.router.navigateByUrl(path).then(r => path === '/' && r ? this.closeLogoutModal() : null);
  }

  openLogoutModal() {
    this.modalOpen.set(true);
  }

  closeLogoutModal() {
    this.modalOpen.set(false);
  }

  confirmLogout() {
    this.auth.logout().subscribe({
      next: () => {
        this.modalOpen.set(false);
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.modalOpen.set(false);
        this.router.navigateByUrl('/login');
      }
    });
  }
}
