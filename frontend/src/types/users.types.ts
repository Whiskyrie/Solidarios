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
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: UserAddress;
  profileImage?: string;
  userType: UserType;
  role: UserRole; // Adicionar propriedade role para consistência
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export enum UserType {
  DOADOR = "doador",
  RECEPTOR = "receptor",
  ADMIN = "admin",
}

export interface UserProfile extends User {
  donationStats?: DonorStats;
  receivedDonationsStats?: ReceiverStats;
}

export interface DonorStats {
  totalDonations: number;
  distributedItems: number;
  activeItems: number;
  peopleHelped: number;
  impactScore: number;
  averageRating?: number;
  completionRate: number;
}

export interface ReceiverStats {
  totalReceived: number;
  completedRequests: number;
  averageRating?: number;
}

export interface CreateUserDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  address?: Partial<UserAddress>;
  profileImage?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    newItems: boolean;
    statusUpdates: boolean;
    messages: boolean;
  };
  privacy: {
    showProfile: boolean;
    showStats: boolean;
    showLocation: boolean;
  };
}

// Tipo para estatísticas do usuário
export interface UserStats {
  userId: string;
  totalDonations: number;
  peopleHelped: number;
  impactScore: number;
  lastUpdated: Date;
}

// Paginação
export interface PageMeta {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PageDto<T> {
  data: T[];
  meta: PageMeta;
}

// Tipo para usuários paginados
export type UsersPage = PageDto<User>;

// Erros de validação do perfil
export interface ProfileValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}
