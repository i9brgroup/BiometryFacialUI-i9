import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { AuthService } from '../auth.service';
import { UserService } from './user.service';
import { UserListItem, formatCreatedAt } from './user.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, SidebarComponent, MatSnackBarModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageUsersComponent implements OnInit {
  public readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);

  users = signal<UserListItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = signal(10);

  // Toggle modal
  modalOpen = signal(false);
  modalUser = signal<UserListItem | null>(null);
  toggling = signal(false);

  ngOnInit(): void {
    this.loadUsers();
  }

  async loadUsers(page: number = 0): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const res = await firstValueFrom(
        this.userService.listUsers(page, this.pageSize())
      );
      this.users.set(res.content);
      this.currentPage.set(res.number);
      this.totalPages.set(res.totalPages);
      this.totalElements.set(res.totalElements);
    } catch (err: any) {
      const msg =
        err?.error?.detail || err?.message || 'Erro ao carregar usuários';
      this.error.set(String(msg));
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(arr: number[]): string {
    return formatCreatedAt(arr);
  }

  // --- Pagination ---
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadUsers(page);
    }
  }

  // --- Toggle Status Modal ---
  openToggleModal(user: UserListItem): void {
    this.modalUser.set(user);
    this.modalOpen.set(true);
  }

  closeToggleModal(): void {
    this.modalOpen.set(false);
    this.modalUser.set(null);
  }

  async confirmToggle(): Promise<void> {
    const user = this.modalUser();
    if (!user) return;

    this.toggling.set(true);
    try {
      const res = await firstValueFrom(
        this.userService.toggleStatus(user.id)
      );
      this.snackBar.open(res.message, 'Fechar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      this.closeToggleModal();
      await this.loadUsers(this.currentPage());
    } catch (err: any) {
      const msg =
        err?.error?.detail || err?.message || 'Erro ao alterar status';
      this.snackBar.open(msg, 'Fechar', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    } finally {
      this.toggling.set(false);
    }
  }
}

export default ManageUsersComponent;
