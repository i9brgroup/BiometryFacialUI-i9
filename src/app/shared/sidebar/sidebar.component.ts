import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
  <aside class="fixed top-0 left-0 bottom-0 w-64 sidebar-navy flex flex-col z-40 shadow-xl">
    <div class="p-6 flex flex-col items-center gap-3 border-b border-white/10">
      <img src="/Biometria.ico" alt="logo" class="w-12 h-12" />
      <div class="text-center">
        <div class="font-bold text-lg tracking-tight uppercase">i9 Biometria</div>
        <div class="text-[10px] text-blue-200/60 font-black uppercase tracking-[0.2em]">Controle Facial</div>
      </div>
    </div>

    <nav class="flex-1 flex flex-col py-6 px-3 gap-1" aria-label="Menu de navegação">
      <button
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 cursor-pointer group text-sm"
        [ngClass]="router.url === '/employee' ? 'bg-white/10 text-white font-bold' : 'text-blue-100/70 hover:bg-white/5 hover:text-white'"
        (click)="navTo('/employee')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Gestão Biométrica</span>
      </button>

      <button
        *ngIf="role === 'SUPER_ADMIN'"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 cursor-pointer group text-sm"
        [ngClass]="router.url === '/cadastro' ? 'bg-white/10 text-white font-bold' : 'text-blue-100/70 hover:bg-white/5 hover:text-white'"
        (click)="navTo('/cadastro')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Configurações</span>
      </button>
    </nav>

    <div class="p-4 border-t border-white/10">
      <button
        class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-200 hover:bg-red-600 hover:text-white transition-all duration-150 cursor-pointer text-xs font-bold uppercase tracking-wider"
        (click)="openLogoutModal()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Encerrar Sessão
      </button>
    </div>

    <!-- Logout confirm modal -->
    <div *ngIf="modalOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="logoutTitle" class="pro-card p-8 w-[400px] border-none shadow-2xl">
        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 id="logoutTitle" class="text-xl font-bold text-center text-slate-800 mb-2">Confirmar Saída?</h3>
        <p class="text-center text-slate-500 text-sm mb-6">Sua sessão será encerrada e você precisará se autenticar novamente.</p>
        <div class="flex gap-3">
          <button class="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer text-sm" (click)="closeLogoutModal()">Manter Logado</button>
          <button class="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all cursor-pointer text-sm" (click)="confirmLogout()">Sair Agora</button>
        </div>
      </div>
    </div>
  </aside>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  public readonly router = inject(Router);
  public readonly auth = inject(AuthService);
  modalOpen = signal(false);
  role = this.auth.getRoleByToken();

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
        // Fallback: still navigate if API logout fails
        this.modalOpen.set(false);
        this.router.navigateByUrl('/login');
      }
    });
  }
}

