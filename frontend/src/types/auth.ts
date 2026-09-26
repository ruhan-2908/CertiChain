export type UserRole = "STUDENT" | "ADMIN";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface CurrentUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}