import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiError, Employee, EmployeeMapper, SearchEmployee } from './employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);

  searchEmployees(term: string): Observable<Employee> {
    const q = term?.trim();
    if (!q) {
      return throwError(() => this.buildApiError(400, 'Termo de busca vazio'));
    }
    const url = `/api/v1/employees/search-employees/${encodeURIComponent(q)}`;
    return this.http.get<SearchEmployee>(url).pipe(
      map(s => EmployeeMapper.fromSearchEmployee(s)),
      catchError((err) => this.handleError(err)),
    );
  }

  sendEmployeePayload(emp: Employee, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const payload = {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email ?? '',
      siteId: emp.siteID ?? '',
      localId: emp.localID ?? '',
      photoKey: file.name ?? '',
    };

    formData.append('payload', JSON.stringify(payload));

    const url = `/api/v1/employees/process-payload`;
    return this.http.post(url, formData).pipe(catchError((err) => this.handleError(err)));
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
