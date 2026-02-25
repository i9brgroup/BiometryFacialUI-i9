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
