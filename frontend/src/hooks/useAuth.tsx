/**
 * Hook personalizado para gerenciamento de autenticação
 * Atualizado para integrar com o sistema de renovação automática
 */
import React, {
  useCallback,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { LoginDto, RegisterDto } from "../types/auth.types";
import {
  login as loginAction,
  register as registerAction,
  logout as logoutAction,
  getProfile as getProfileAction,
  refreshTokens as refreshTokensAction,
  clearError as clearErrorAction,
  updateProfile as updateProfileAction,
} from "../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { UserRole, UpdateUserRequest } from "../types/users.types";
import { useTokenManager } from "./useTokenManager";

// Definição do tipo para o contexto de autenticação
type AuthContextType = {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginDto) => Promise<boolean>;
  register: (userData: RegisterDto) => Promise<boolean>;
  logout: () => Promise<boolean>;
  getProfile: () => Promise<any | null>;
  refreshTokens: () => Promise<boolean>;
  clearErrors: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: () => boolean;
  isFuncionario: () => boolean;
  isDoador: () => boolean;
  isBeneficiario: () => boolean;
  updateProfile: (data: UpdateUserRequest) => Promise<boolean>;
  // NOVOS: informações do token manager
  tokenStatus: {
    isExpired: boolean;
    timeUntilExpiry: number;
    hasValidTokens: boolean;
  };
};

// Criar o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para o provedor de autenticação
interface AuthProviderProps {
  children: ReactNode;
}

// Provedor de autenticação
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  // Selecionar estado de autenticação do Redux
  const { user, accessToken, refreshToken, isAuthenticated, isLoading, error } =
    useAppSelector((state) => state.auth);

  // NOVO: Integrar token manager
  const tokenManager = useTokenManager();

  // Função de login
  const login = useCallback(
    async (credentials: LoginDto): Promise<boolean> => {
      try {
        console.log("[useAuth] Iniciando login");
        await dispatch(loginAction(credentials)).unwrap();
        console.log("[useAuth] Login realizado com sucesso");
        return true;
      } catch (error) {
        console.error("[useAuth] Erro no login:", error);
        return false;
      }
    },
    [dispatch]
  );

  // Função de registro
  const register = useCallback(
    async (userData: RegisterDto): Promise<boolean> => {
      try {
        console.log("[useAuth] Iniciando registro");
        await dispatch(registerAction(userData)).unwrap();
        console.log("[useAuth] Registro realizado com sucesso");
        return true;
      } catch (error) {
        console.error("[useAuth] Erro no registro:", error);
        return false;
      }
    },
    [dispatch]
  );

  // Função de logout
  const logout = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[useAuth] Iniciando logout");
      await dispatch(logoutAction()).unwrap();
      console.log("[useAuth] Logout realizado com sucesso");
      return true;
    } catch (error) {
      console.error("[useAuth] Erro no logout:", error);
      // Mesmo com erro, considerar logout bem-sucedido
      return true;
    }
  }, [dispatch]);

  // Função para obter perfil
  const getProfile = useCallback(async (): Promise<any | null> => {
    try {
      console.log("[useAuth] Obtendo perfil do usuário");
      const profile = await dispatch(getProfileAction()).unwrap();
      console.log("[useAuth] Perfil obtido com sucesso");
      return profile;
    } catch (error) {
      console.error("[useAuth] Erro ao obter perfil:", error);
      return null;
    }
  }, [dispatch]);

  // ATUALIZADA: Função para renovar tokens usando o sistema integrado
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[useAuth] Renovando tokens");
      await dispatch(refreshTokensAction()).unwrap();
      console.log("[useAuth] Tokens renovados com sucesso");
      return true;
    } catch (error) {
      console.error("[useAuth] Erro ao renovar tokens:", error);
      return false;
    }
  }, [dispatch]);

  // Função para limpar erros
  const clearErrors = useCallback(() => {
    dispatch(clearErrorAction());
  }, [dispatch]);

  // Função para verificar roles
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!user || !user.role) return false;

      if (Array.isArray(role)) {
        return role.includes(user.role);
      }

      return user.role === role;
    },
    [user]
  );

  // Helpers para verificar roles específicos
  const isAdmin = useCallback(() => hasRole(UserRole.ADMIN), [hasRole]);
  const isFuncionario = useCallback(
    () => hasRole(UserRole.FUNCIONARIO),
    [hasRole]
  );
  const isDoador = useCallback(() => hasRole(UserRole.DOADOR), [hasRole]);
  const isBeneficiario = useCallback(
    () => hasRole(UserRole.BENEFICIARIO),
    [hasRole]
  );

  // Função para atualizar perfil
  const updateProfile = useCallback(
    async (data: UpdateUserRequest): Promise<boolean> => {
      if (!user) {
        console.error("[useAuth] Usuário não autenticado");
        return false;
      }

      try {
        console.log("[useAuth] Atualizando perfil do usuário");

        const updateData = {
          userId: user.id,
          data: data,
        };

        await dispatch(updateProfileAction(updateData)).unwrap();
        console.log("[useAuth] Perfil atualizado com sucesso");
        return true;
      } catch (error) {
        console.error("[useAuth] Erro ao atualizar perfil:", error);
        return false;
      }
    },
    [user, dispatch]
  );

  // Criar o objeto de valor do contexto
  const authContextValue: AuthContextType = {
    // Estado básico
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,

    // Ações
    login,
    register,
    logout,
    getProfile,
    refreshTokens,
    clearErrors,
    updateProfile,

    // Helpers de role
    hasRole,
    isAdmin,
    isFuncionario,
    isDoador,
    isBeneficiario,

    // NOVO: Status do token manager
    tokenStatus: {
      isExpired: tokenManager.isTokenExpired,
      timeUntilExpiry: tokenManager.timeUntilExpiry,
      hasValidTokens: Boolean(tokenManager.hasValidTokens),
    },
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para utilizar o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

// Exportar o tipo do contexto para uso em outros arquivos
export type { AuthContextType };

export default AuthProvider;
