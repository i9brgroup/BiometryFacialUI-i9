import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateLoginPayload } from '../auth.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  createLogin(payload: CreateLoginPayload): Observable<any> {
    return this.http.post('/api/v1/user-login/create', payload);
  }
}
