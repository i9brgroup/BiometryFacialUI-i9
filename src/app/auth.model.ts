export interface LoginPayload {
  email: string;
  password?: string;
}

export interface TokenPayload {
  sub?: string;
  username: string;
  siteId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface CreateLoginPayload {
  username?: string;
  email?: string;
  password?: string;
  siteId?: string;
  roles?: string;
}

export interface CreateLoginResponse {
  status: string;
  message: string;
}
