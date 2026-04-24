import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CreateLoginPayload } from '../auth.model';
import { UserService } from '../admin/user.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);

  createLogin(payload: CreateLoginPayload): Observable<any> {
    return this.http.post('/api/v1/users/create', payload).pipe(
      tap(() => this.userService.invalidateCache()) // Invalidate user list cache
    );
  }
}
