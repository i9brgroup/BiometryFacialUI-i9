export interface CreateLoginPayload {
  username: string;
  email: string;
  password: string;
  siteId: string;
  roles: string;
}

export interface CreateLoginResponse {
  status: string;
  username: string;
  email: string;
  siteId: string;
  created_at: string;
}
