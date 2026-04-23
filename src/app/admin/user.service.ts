import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPage, ToggleStatusResponse } from './user.model';
import { CreateLoginPayload } from '../auth.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  listUsers(
    page: number = 0,
    size: number = 10,
    orderBy: string = 'id',
    direction: string = 'ASC'
  ): Observable<UserPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('orderBy', orderBy)
      .set('direction', direction);

    return this.http.get<UserPage>('/api/v1/users/list-users', { params });
  }

  toggleStatus(userId: number): Observable<ToggleStatusResponse> {
    return this.http.patch<ToggleStatusResponse>(
      `/api/v1/users/${userId}/toggle-status`,
      {}
    );
  }

  createLogin(payload: CreateLoginPayload): Observable<any> {
    return this.http.post('/api/v1/user-login/create', payload);
  }
}
