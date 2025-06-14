/**
 * Hook personalizado para gerenciamento de autenticação
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
  clearErrors as clearErrorsAction,
  updateProfile as updateProfileAction,
} from "../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { UserRole, UpdateUserRequest } from "../types/users.types";

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

  // Selecionar estado de autenticação da store
  const { user, accessToken, refreshToken, isAuthenticated, isLoading, error } =
    useAppSelector((state) => state.auth);

  // Função para login
  const login = useCallback(
    async (credentials: LoginDto): Promise<boolean> => {
      try {
        console.log("[useAuth] Disparando ação de login");
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

  // Função para registrar novo usuário
  const register = useCallback(
    async (userData: RegisterDto): Promise<boolean> => {
      try {
        console.log("[useAuth] Disparando ação de registro");
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

  // Função para fazer logout
  const logout = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[useAuth] Fazendo logout");
      await dispatch(logoutAction()).unwrap();
      return true;
    } catch (error) {
      console.error("[useAuth] Erro no logout:", error);
      return false;
    }
  }, [dispatch]);

  // Função para obter perfil do usuário
  const getProfile = useCallback(async (): Promise<any | null> => {
    try {
      console.log("[useAuth] Obtendo perfil do usuário");
      const profile = await dispatch(getProfileAction()).unwrap();
      return profile;
    } catch (error) {
      console.error("[useAuth] Erro ao obter perfil:", error);
      return null;
    }
  }, [dispatch]);

  // Função para renovar tokens
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      console.warn("[useAuth] Refresh token não disponível");
      return false;
    }

    try {
      console.log("[useAuth] Renovando tokens");
      await dispatch(refreshTokensAction(refreshToken)).unwrap();
      return true;
    } catch (error) {
      console.error("[useAuth] Erro ao renovar tokens:", error);
      return false;
    }
  }, [dispatch, refreshToken]);

  // Função para limpar erros
  const clearErrors = useCallback(() => {
    dispatch(clearErrorsAction());
  }, [dispatch]);

  // Verificar se o usuário tem uma determinada role
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!user) return false;

      if (Array.isArray(role)) {
        return role.includes(user.role);
      }

      return user.role === role;
    },
    [user]
  );

  // Verificar se o usuário é admin
  const isAdmin = useCallback((): boolean => {
    return hasRole(UserRole.ADMIN);
  }, [hasRole]);

  // Verificar se o usuário é funcionário
  const isFuncionario = useCallback((): boolean => {
    return hasRole(UserRole.FUNCIONARIO);
  }, [hasRole]);

  // Verificar se o usuário é doador
  const isDoador = useCallback((): boolean => {
    return hasRole(UserRole.DOADOR);
  }, [hasRole]);

  // Verificar se o usuário é beneficiário
  const isBeneficiario = useCallback((): boolean => {
    return hasRole(UserRole.BENEFICIARIO);
  }, [hasRole]);

  // Função para atualizar perfil do usuário
  const updateProfile = useCallback(
    async (data: UpdateUserRequest): Promise<boolean> => {
      if (!user) {
        console.error("[useAuth] Usuário não autenticado");
        return false;
      }

      try {
        console.log("[useAuth] Atualizando perfil do usuário");

        // Preparar dados para atualização
        const updateData = {
          userId: user.id,
          data: data,
        };

        // Disparar ação de atualização
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
    // Estado
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

    // Helpers
    hasRole,
    isAdmin,
    isFuncionario,
    isDoador,
    isBeneficiario,
  };

  // Retornar o provedor com o valor do contexto
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
