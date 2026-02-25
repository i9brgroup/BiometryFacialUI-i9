import {inject, Injectable, WritableSignal} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {ApiError, Employee, SearchEmployee,} from './employee.model';
import {AuthService} from '../auth.service';
import {Router} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  searchEmployees(term: string): Observable<SearchEmployee[]> {
    const q = term?.trim();
    if (!q) {
      return throwError(() => this.buildApiError(400, 'Termo de busca vazio'));
    }

    const url = `http://localhost:8080/api/v1/employees/search-employees/${encodeURIComponent(q)}`;
    return this.http.get<SearchEmployee[]>(url).pipe(
      map((arr) => (arr || []).map((s) => ({ ...s, photoUrl: (s as any).photoUrl ?? (s as any).urlPhoto ?? null }))),
      catchError((err) => this.handleError(err)),
    );
  }

  sendEmployeePayload(emp: SearchEmployee, file: File): Observable<any> {
    const token = this.auth.getToken();
    let headers = new HttpHeaders();
    const formData = new FormData();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    formData.append('file', file);

    // This endpoint (FastAPI) does not expect a token in the header; send only JSON body
    const payload = {
      id: emp.id,
      name: emp.name,
      email: emp.email ?? '',
      siteId: emp.siteId ?? '',
      localId: emp.localId ?? '',
      photoKey: file.name ?? '', // assuming file name is used as key
    };

    formData.append('payload', JSON.stringify(payload));

    const url = `http://localhost:8080/api/v1/employees/process-payload`;
    return this.http.post(url, formData, { headers }).pipe(catchError((err) => this.handleError(err)));
  }

  private buildApiError(status: number, message: string): ApiError {
    return { status, message };
  }

  private handleError(err: HttpErrorResponse | ApiError): Observable<never> {
    if ((err as ApiError).message && (err as ApiError).status !== undefined) {
      return throwError(() => err as ApiError);
    }

    const httpErr = err as HttpErrorResponse;
    const apiErr: ApiError = {
      status: httpErr.status || 0,
      message: httpErr.error?.message || httpErr.statusText || 'Unknown error',
      code: httpErr.error?.code,
      errors: httpErr.error?.errors,
    };
    return throwError(() => apiErr);
  }
}
