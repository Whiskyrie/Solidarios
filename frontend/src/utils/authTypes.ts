/**
 * Extensão de tipos para o sistema de autenticação
 * Adiciona tipos que podem estar faltando no projeto
 */

// Extensão do tipo Error para incluir propriedades customizadas
declare global {
  interface Error {
    isAuthError?: boolean;
    shouldRedirectToLogin?: boolean;
  }
}

// Tipo para configuração de ambiente Node.js no React Native
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_ENVIRONMENT?: string;
    }
  }
}

// Extensão do módulo axios para incluir propriedades customizadas na configuração
declare module "axios" {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// Tipos para o estado de autenticação estendido
export interface ExtendedAuthState {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastTokenRefresh?: string;
  tokenExpiresAt?: string;
}

// Tipos para configuração do token manager
export interface TokenManagerConfig {
  renewalTimeBeforeExpiry: number;
  enableDebugLogs: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
}

// Tipos para resposta de status do sistema
export interface AuthSystemStatus {
  hasTokens: boolean;
  isAuthenticated: boolean;
  config: any;
  hasActiveCheckTimer: boolean;
  tokenExpiry: Date | null;
}

// Tipos para eventos de autenticação
export type AuthEvent =
  | "TOKEN_REFRESH_SUCCESS"
  | "TOKEN_REFRESH_FAILED"
  | "SESSION_EXPIRED"
  | "LOGOUT_REQUIRED"
  | "AUTH_ERROR";

// Interface para listener de eventos de auth
export interface AuthEventListener {
  (event: AuthEvent, data?: any): void;
}

// Tipos para navegação (ajuste conforme sua estrutura)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  // Adicione outras rotas conforme necessário
};

// Tipo para hooks de navegação
export interface NavigationHook {
  navigate: (name: keyof RootStackParamList, params?: any) => void;
  reset: (state: any) => void;
  goBack: () => void;
}
