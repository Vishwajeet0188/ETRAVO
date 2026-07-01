export type UserRole = "driver" | "passenger";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
  role: UserRole;
}
