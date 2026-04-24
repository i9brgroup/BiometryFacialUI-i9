/**
 * Represents a single employee item returned by the list-employees API.
 */
export interface ListEmployeeItem {
  id: string;
  completeName: string;
  siteId: string;
  badgeNumber: string | null;
  active: boolean;
  biometricHash: string | null;
}

/**
 * Spring Boot Page<ListEmployeePageResponse> shape.
 */
export interface EmployeeListPage {
  content: ListEmployeeItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: { empty: boolean; sorted: boolean; unsorted: boolean };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: { empty: boolean; sorted: boolean; unsorted: boolean };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

/**
 * Check if employee has valid biometric data.
 * Valid = hash exists AND length > 650.
 */
export function hasBiometricData(hash: string | null): boolean {
  return !!hash && hash.length > 650;
}
