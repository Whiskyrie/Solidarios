/**
 * Definição de tipos para autenticação
 * Baseado nas entidades e DTOs do backend
 */
import { User } from "./users.types";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokensResponse {
  user: User;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
