import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { UserPage, ToggleStatusResponse } from './user.model';
import { CreateLoginPayload } from '../auth.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  /** Simple page cache: cacheKey → UserPage */
  private readonly userCache = new Map<string, UserPage>();

  private buildCacheKey(page: number, size: number, orderBy: string, direction: string): string {
    return `${page}_${size}_${orderBy}_${direction}`;
  }

  listUsers(
    page: number = 0,
    size: number = 10,
    orderBy: string = 'id',
    direction: string = 'ASC'
  ): Observable<UserPage> {
    const cacheKey = this.buildCacheKey(page, size, orderBy, direction);

    // Return cached data instantly if available
    const cached = this.userCache.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Fetch from API and store in cache
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('orderBy', orderBy)
      .set('direction', direction);

    return this.http.get<UserPage>('/api/v1/users/list-users', { params }).pipe(
      tap(res => this.userCache.set(cacheKey, res))
    );
  }

  toggleStatus(userId: number): Observable<ToggleStatusResponse> {
    return this.http.patch<ToggleStatusResponse>(
      `/api/v1/users/${userId}/toggle-status`,
      {}
    ).pipe(
      tap(() => this.userCache.clear()) // Invalidate cache on mutation
    );
  }

  createLogin(payload: CreateLoginPayload): Observable<any> {
    return this.http.post('/api/v1/users/create', payload).pipe(
      tap(() => this.userCache.clear()) // Invalidate cache on mutation
    );
  }

  /** Check if a page is already in the cache */
  isCached(
    page: number = 0,
    size: number = 10,
    orderBy: string = 'id',
    direction: string = 'ASC'
  ): boolean {
    return this.userCache.has(this.buildCacheKey(page, size, orderBy, direction));
  }

  /** Manually invalidate the entire cache (called from external services) */
  invalidateCache(): void {
    this.userCache.clear();
  }
}
