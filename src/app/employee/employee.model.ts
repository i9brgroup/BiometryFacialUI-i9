export interface EmployeeBiometry {
  type: 'face' | 'fingerprint' | 'iris';
  version?: string;
  capturedAt?: string; // ISO timestamp
  metadata?: Record<string, string | number | boolean>;
}

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
  biometry?: EmployeeBiometry | null;
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
