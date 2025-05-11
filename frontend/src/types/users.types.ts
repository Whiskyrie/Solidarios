/**
 * Definição de tipos para usuários
 * Baseado nas entidades do backend
 */

export enum UserRole {
  ADMIN = "ADMIN",
  FUNCIONARIO = "FUNCIONARIO",
  DOADOR = "DOADOR",
  BENEFICIARIO = "BENEFICIARIO",
}

export interface User {
  phone: string;
  address: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

// Tipo para a resposta paginada
export interface PageMetaDto {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PageDto<T> {
  data: T[];
  meta: PageMetaDto;
}

// Tipo para usuários paginados
export type UsersPage = PageDto<User>;
