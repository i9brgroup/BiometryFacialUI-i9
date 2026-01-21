import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  Employee,
  GetEmployeeResponse,
  UpdateBiometryResponse,
  ApiError,
} from './employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private base = '/funcionarios';

  // Toggle this to true during local development to use the mock file
  private useMock = true;
  // Toggle to true to use the mock server (node express) at /api
  private useMockServer = true;
  // When true, send the captured image to the real embedding endpoint
  private useRealEmbeddingEndpoint = true; // set to true to call http://127.0.0.1:8000

  findEmployee(term: string): Observable<Employee> {
    if (this.useMockServer) {
      const url = `/api/funcionarios/${encodeURIComponent(term)}`;
      return this.http.get<GetEmployeeResponse>(url).pipe(
        map((r) => r.employee),
        catchError((err) => this.handleError(err)),
      );
    }

    if (this.useMock) {
      // search by id or badge inside assets/dados.json
      return this.http.get<{ employees: Employee[] }>('/assets/dados.json').pipe(
        map((r) => {
          const t = term?.trim();
          if (!t) throw this.buildApiError(400, 'Termo de busca vazio');
          const emp = r.employees.find((e) => e.id === t || e.badge === t);
          if (!emp) throw this.buildApiError(404, 'Usuário não encontrado ou não pertence à sua unidade.');
          return emp;
        }),
        catchError((err) => this.handleError(err as HttpErrorResponse)),
      );
    }

    const url = `${this.base}/${encodeURIComponent(term)}`;
    return this.http.get<GetEmployeeResponse>(url).pipe(
      map((r) => r.employee),
      catchError((err) => this.handleError(err)),
    );
  }

  updateBiometry(id: string, file: Blob): Observable<Employee> {
    // If configured to send to the real embedding endpoint, do that first
    if (this.useRealEmbeddingEndpoint) {
      const fd = new FormData();
      fd.append('file', file, `${id}.jpg`);
      const embedUrl = 'http://127.0.0.1:8000/biometria/gerar-vetor';

      // POST the file to gerar-vetor. On success, attempt to fetch the updated employee
      return this.http.post<{ status: string; data: any }>(embedUrl, fd).pipe(
        switchMap(() => {
          // Try to GET the updated employee from the API (if available)
          const apiUrl = `/api/funcionarios/${encodeURIComponent(id)}`;
          return this.http.get<GetEmployeeResponse>(apiUrl).pipe(
            map((r) => r.employee),
            // If fetching from API fails, fall back to the local mock file and synthesize an updated employee
            catchError(() =>
              this.http.get<{ employees: Employee[] }>('/assets/dados.json').pipe(
                map((r) => {
                  const emp = r.employees.find((e) => e.id === id);
                  if (!emp) throw this.buildApiError(404, 'Usuário não encontrado');
                  const updated: Employee = {
                    ...emp,
                    tem_biometria: true,
                    // Assume backend saved the file under /assets/uploads/{id}.jpg for demo purposes
                    photoUrl: `/assets/uploads/${id}.jpg`,
                    biometry: {
                      type: 'face',
                      version: 'generated',
                      capturedAt: new Date().toISOString(),
                      metadata: { source: 'embedding-endpoint' },
                    },
                    updatedAt: new Date().toISOString(),
                  };
                  return updated;
                }),
              ),
            ),
          );
        }),
        catchError((err) => this.handleError(err)),
      );
    }

    if (this.useMockServer) {
      const fd = new FormData();
      fd.append('file', file, `${id}.jpg`);
      const url = `/api/funcionarios/${encodeURIComponent(id)}/biometria`;
      return this.http.put<UpdateBiometryResponse>(url, fd).pipe(
        map((r) => r.employee),
        catchError((err) => this.handleError(err)),
      );
    }

    if (this.useMock) {
      // Simulate update by returning the employee with updated biometry info
      return this.http.get<{ employees: Employee[] }>('/assets/dados.json').pipe(
        map((r) => {
          const emp = r.employees.find((e) => e.id === id);
          if (!emp) throw this.buildApiError(404, 'Usuário não encontrado');

          const updated: Employee = {
            ...emp,
            tem_biometria: true,
            photoUrl: emp.photoUrl ?? `/assets/uploads/${id}.jpg`,
            biometry: {
              type: 'face',
              version: 'mock-1.0',
              capturedAt: new Date().toISOString(),
              metadata: { device: 'webcam-mock' },
            },
            updatedAt: new Date().toISOString(),
          };

          return updated;
        }),
        catchError((err) => this.handleError(err as HttpErrorResponse)),
      );
    }

    const url = `${this.base}/${encodeURIComponent(id)}/biometria`;
    const fd = new FormData();
    fd.append('file', file, 'biometry.jpg');

    return this.http.put<UpdateBiometryResponse>(url, fd).pipe(
      map((r) => r.employee),
      catchError((err) => this.handleError(err)),
    );
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
