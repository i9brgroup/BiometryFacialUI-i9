import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import {jwtDecode} from 'jwt-decode';
import {TokenPayload} from '../../login/TokenPayload';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
  <aside class="h-screen w-56 bg-linear-to-b from-[#0b3b66] via-[#ED2100] to-[#FF2C2C] text-white p-6 flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <img src="/Biometria.ico" alt="logo" class="inline w-16 h-16" />
      <div class="font-semibold text-lg leading-none">i9<br/><span class="text-sm">Biometria</span></div>
    </div>

    <nav class="flex flex-col gap-2 mt-4" aria-label="Menu de navegação">
      <button class="text-left px-3 py-2 rounded hover:bg-white/10 text-sm hidden" (click)="navTo('/')">Dashboard</button>
      <button class="text-left px-3 py-2 rounded hover:text-blue-950 text-[16px] cursor-pointer" (click)="navTo('/employee')">Biometria</button>
      <button *ngIf="role === 'SUPER_ADMIN'" class="text-left px-3 py-2 rounded hover:text-blue-950 text-[16px] cursor-pointer" (click)="navTo('/cadastro')">Cadastro de E-mail</button>
      <button class="text-left px-3 py-2 rounded hover:bg-white/10 text-sm hidden" (click)="navTo('/logs')">Logs</button>
    </nav>

    <div class="mt-auto">
      <button class="text-left px-3 py-2 rounded-2xl hover:text-blue-950 text-[16px] cursor-pointer" (click)="openLogoutModal()">Sair</button>
    </div>

    <!-- Logout confirm modal -->
    <div *ngIf="modalOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div role="dialog" aria-modal="true" aria-labelledby="logoutTitle" class="bg-white rounded-lg shadow p-4 w-[360px]">
        <h3 id="logoutTitle" class="text-lg font-medium text-gray-900">Confirmar logout</h3>
        <p class="mt-2 text-sm text-gray-600">Tem certeza que deseja sair? Suas credenciais serão removidas.</p>
        <div class="mt-4 flex justify-end gap-2">
          <button class="px-3 py-2 rounded bg-[#0b3b66] border" (click)="closeLogoutModal()">Cancelar</button>
          <button class="px-3 py-2 rounded bg-red-500 text-white" (click)="confirmLogout()">Sair</button>
        </div>
      </div>
    </div>
  </aside>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  modalOpen = signal(false);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  error = signal<string | null>(null);
  role = inject(AuthService).getRoleByToken();

  navTo(path: string) {
    this.router.navigateByUrl(path).then(r => path === '/' && r ? this.closeLogoutModal() : null);
  }

  openLogoutModal() {
    this.modalOpen.set(true);
  }

  closeLogoutModal() {
    this.modalOpen.set(false);
  }

  confirmLogout() {
    // remove credentials
    this.auth.logout();
    this.modalOpen.set(false);
    // navigate to login
    this.router.navigateByUrl('/login');
  }
}

