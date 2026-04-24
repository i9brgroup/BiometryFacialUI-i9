import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { EmployeeListPage } from './employee-list.model';

@Injectable({ providedIn: 'root' })
export class EmployeeListService {
  private readonly http = inject(HttpClient);

  /** Simple page cache: cacheKey → EmployeeListPage */
  private readonly employeeCache = new Map<string, EmployeeListPage>();

  private buildCacheKey(page: number, size: number, orderBy: string, direction: string): string {
    return `${page}_${size}_${orderBy}_${direction}`;
  }

  listEmployees(
    page: number = 0,
    size: number = 15,
    orderBy: string = 'id',
    direction: string = 'ASC'
  ): Observable<EmployeeListPage> {
    const cacheKey = this.buildCacheKey(page, size, orderBy, direction);

    // Return cached data instantly if available
    const cached = this.employeeCache.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Fetch from API and store in cache
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('orderBy', orderBy)
      .set('direction', direction);

    return this.http.get<EmployeeListPage>('/api/v1/employees/list-employees', { params }).pipe(
      tap(res => this.employeeCache.set(cacheKey, res))
    );
  }

  /** Check if a specific page is already in the cache */
  isCached(
    page: number = 0,
    size: number = 15,
    orderBy: string = 'id',
    direction: string = 'ASC'
  ): boolean {
    return this.employeeCache.has(this.buildCacheKey(page, size, orderBy, direction));
  }

  /** Invalidate the entire cache */
  invalidateCache(): void {
    this.employeeCache.clear();
  }
}
