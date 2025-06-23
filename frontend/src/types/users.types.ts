// frontend/src/types/user.ts
/**
 * Definição de tipos para usuários
 * Baseado nas entidades do backend com suporte a respostas da API
 */

export enum UserRole {
  ADMIN = "ADMIN",
  FUNCIONARIO = "FUNCIONARIO",
  DOADOR = "DOADOR",
  BENEFICIARIO = "BENEFICIARIO",
}

export enum UserType {
  DOADOR = "doador",
  RECEPTOR = "receptor",
  ADMIN = "admin",
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

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: UserAddress | string; // Pode vir como string do backend
  profileImage?: string;
  userType?: UserType; // Opcional pois pode não vir sempre
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  password?: string; // Opcional, geralmente não retornado
}

// Tipos para respostas da API
export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string | string[];
  statusCode: number;
  timestamp: string;
}

// Resposta específica para perfil do usuário
export interface ProfileApiResponse {
  data: {
    data: User;
    message: string;
    statusCode: number;
    timestamp: string;
  };
}

// Tipo para o resultado da ação getProfile do Redux
export type GetProfileResult = User | ProfileApiResponse | ApiResponse<User>;

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

export type UsersPage = PageDto<User>;

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

// Utility functions para extrair dados de diferentes formatos de resposta
export const extractUserFromResponse = (
  response: GetProfileResult
): User | null => {
  try {
    // Caso 1: Resposta aninhada { data: { data: User } }
    if ("data" in response && response.data && "data" in response.data) {
      return response.data.data as User;
    }

    // Caso 2: Resposta com wrapper { data: User }
    if (
      "data" in response &&
      response.data &&
      typeof response.data === "object"
    ) {
      // Verificar se data tem propriedades de User
      const userData = response.data as any;
      if (userData.id && userData.email) {
        return userData as User;
      }
    }

    // Caso 3: User direto
    if ("id" in response && "email" in response) {
      return response as User;
    }

    return null;
  } catch (error) {
    console.error("[extractUserFromResponse] Erro ao extrair usuário:", error);
    return null;
  }
};

// Type guards para verificar tipos
export const isUser = (obj: any): obj is User => {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.email === "string" &&
    typeof obj.name === "string"
  );
};

export const isApiResponse = <T>(obj: any): obj is ApiResponse<T> => {
  return (
    obj &&
    typeof obj === "object" &&
    "data" in obj &&
    "message" in obj &&
    "statusCode" in obj
  );
};

export const isProfileApiResponse = (obj: any): obj is ProfileApiResponse => {
  return (
    obj &&
    typeof obj === "object" &&
    "data" in obj &&
    obj.data &&
    "data" in obj.data &&
    isUser(obj.data.data)
  );
};

// Função para normalizar dados do usuário vindos da API
export const normalizeUserData = (userData: any): User | null => {
  if (!userData) return null;

  try {
    // Garantir que role seja do enum correto
    const role = userData.role || userData.userType || UserRole.DOADOR;

    const normalizedUser: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || undefined,
      address: userData.address || undefined,
      profileImage: userData.profileImage || undefined,
      userType: userData.userType || undefined,
      role: Object.values(UserRole).includes(role) ? role : UserRole.DOADOR,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
    };

    return normalizedUser;
  } catch (error) {
    console.error("[normalizeUserData] Erro ao normalizar dados:", error);
    return null;
  }
};
