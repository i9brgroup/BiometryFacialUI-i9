export interface UserListItem {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: number[];
  siteId: string;
  role: string;
  ativo: boolean;
}

export interface UserPage {
  content: UserListItem[];
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

export interface ToggleStatusResponse {
  status: boolean;
  message: string;
}

/**
 * Converts the Java LocalDateTime array [year, month, day, hour, minute, second, nanos]
 * to Brazilian format dd/MM/yyyy HH:mm
 */
export function formatCreatedAt(arr: number[]): string {
  if (!arr || arr.length < 5) return '—';
  const [year, month, day, hour, minute] = arr;
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  return `${dd}/${mm}/${year} ${hh}:${min}`;
}
