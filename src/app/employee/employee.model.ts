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
  position?: string;
  email?: string;
  photoUrl?: string | null; // existing profile photo URL
  tem_biometria?: boolean;
  biometry?: EmployeeBiometry | null;
  updatedAt?: string;
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

