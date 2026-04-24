import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { AuthService } from '../auth.service';
import { EmployeeListService } from './employee-list.service';
import { ListEmployeeItem, hasBiometricData } from './employee-list.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListComponent implements OnInit {
  public readonly auth = inject(AuthService);
  private readonly employeeListService = inject(EmployeeListService);

  employees = signal<ListEmployeeItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  readonly pageSize = 15;

  // Filters
  orderBy = signal<string>('id');
  direction = signal<string>('ASC');

  // Filter options
  readonly orderByOptions = [
    { value: 'id', label: 'ID' },
    { value: 'completeName', label: 'Nome' },
    { value: 'siteId', label: 'Site ID' },
    { value: 'badgeNumber', label: 'Badge' },
    { value: 'active', label: 'Status' },
  ];

  readonly directionOptions = [
    { value: 'ASC', label: 'Crescente' },
    { value: 'DESC', label: 'Decrescente' },
  ];

  ngOnInit(): void {
    this.loadEmployees();
  }

  async loadEmployees(page: number = 0): Promise<void> {
    this.error.set(null);

    const isCached = this.employeeListService.isCached(
      page, this.pageSize, this.orderBy(), this.direction()
    );
    if (!isCached) {
      this.loading.set(true);
    }

    try {
      const res = await firstValueFrom(
        this.employeeListService.listEmployees(
          page, this.pageSize, this.orderBy(), this.direction()
        )
      );
      this.employees.set(res.content);
      this.currentPage.set(res.number);
      this.totalPages.set(res.totalPages);
      this.totalElements.set(res.totalElements);
    } catch (err: any) {
      const msg =
        err?.error?.detail || err?.error?.message || err?.message || 'Erro ao carregar funcionários';
      this.error.set(String(msg));
    } finally {
      this.loading.set(false);
    }
  }

  hasBiometric(hash: string | null): boolean {
    return hasBiometricData(hash);
  }

  // --- Pagination ---
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadEmployees(page);
    }
  }

  // --- Filters ---
  onOrderByChange(value: string): void {
    this.orderBy.set(value);
    this.employeeListService.invalidateCache();
    this.loadEmployees(0);
  }

  onDirectionChange(value: string): void {
    this.direction.set(value);
    this.employeeListService.invalidateCache();
    this.loadEmployees(0);
  }
}

export default EmployeeListComponent;
