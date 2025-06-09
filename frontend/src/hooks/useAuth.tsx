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
} from "../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { UserRole } from "../types/users.types";

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
    async (credentials: LoginDto) => {
      try {
        console.log("[useAuth] Disparando ação de login");
        // Usar o tipo correto para o dispatch (AppDispatch já está tipado para suportar thunks)
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
    async (userData: RegisterDto) => {
      try {
        console.log("[useAuth] Disparando ação de registro");
        // Usar o tipo correto para o dispatch
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
  const logout = useCallback(async () => {
    try {
      // Usar o tipo correto para o dispatch
      await dispatch(logoutAction()).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  }, [dispatch]);

  // Função para obter perfil do usuário
  const getProfile = useCallback(async () => {
    try {
      // Usar o tipo correto para o dispatch
      return await dispatch(getProfileAction()).unwrap();
    } catch (error) {
      return null;
    }
  }, [dispatch]);

  // Função para renovar tokens
  const refreshTokens = useCallback(async () => {
    if (!refreshToken) return false;

    try {
      // Usar o tipo correto para o dispatch
      await dispatch(refreshTokensAction(refreshToken)).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  }, [dispatch, refreshToken]);

  // Função para limpar erros
  const clearErrors = useCallback(() => {
    dispatch(clearErrorsAction());
  }, [dispatch]);

  // Verificar se o usuário tem uma determinada role
  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!user) return false;

      if (Array.isArray(role)) {
        return role.includes(user.role);
      }

      return user.role === role;
    },
    [user]
  );

  // Verificar se o usuário é admin
  const isAdmin = useCallback(() => {
    return hasRole(UserRole.ADMIN);
  }, [hasRole]);

  // Verificar se o usuário é funcionário
  const isFuncionario = useCallback(() => {
    return hasRole(UserRole.FUNCIONARIO);
  }, [hasRole]);

  // Verificar se o usuário é doador
  const isDoador = useCallback(() => {
    return hasRole(UserRole.DOADOR);
  }, [hasRole]);

  // Verificar se o usuário é beneficiário
  const isBeneficiario = useCallback(() => {
    return hasRole(UserRole.BENEFICIARIO);
  }, [hasRole]);

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

export default AuthProvider;
