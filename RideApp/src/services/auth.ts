import { api } from "./api";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
} from "../types/user";

export async function register(input: RegisterInput) {
  const response = await api.post<AuthResponse>("/auth/register", input);
  return response.data;
}

export async function login(input: LoginInput) {
  const response = await api.post<AuthResponse>("/auth/login", input);
  return response.data;
}

export async function getCurrentUser(token: string) {
  const response = await api.get<Pick<AuthResponse, "user">>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.user;
}
