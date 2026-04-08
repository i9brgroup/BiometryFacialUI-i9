export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  badge?: string;
  siteID?: string;
  localID?: string;
  email?: string;
  photoUrl?: string | null; // existing profile photo URL
  tem_biometria?: boolean;
  updatedAt?: string;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset?: number;
  paged?: boolean;
  unpaged?: boolean;
}

export interface Page<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: Pageable;
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

// Represents the external search API shape
export interface SearchEmployee {
  id: string;
  name: string;
  email?: string;
  siteId?: string;
  localId?: string;
  faceTemplate?: string | null;
  photoUrl?: string | null;
}

export interface GetEmployeeResponse {
  employee: Employee;
}

export interface UpdateBiometryResponse {
  employee: Employee;
  message?: string;
}

export interface ApiError {
  status: number;
  code?: string;
  message: string;
  errors?: Record<string, string[]>;
}

export class EmployeeMapper {
  static fromSearchEmployee(emp: SearchEmployee): Employee {
    const split = (emp.name || '').split(' ');
    return {
      id: emp.id,
      firstName: split[0] ?? emp.name ?? '',
      lastName: split.slice(1).join(' ') ?? '',
      badge: emp.id,
      siteID: emp.siteId,
      localID: emp.localId,
      tem_biometria: !!emp.faceTemplate,
      photoUrl: (emp as any).photoUrl ?? null,
      email: emp.email,
    } as Employee;
  }
}

