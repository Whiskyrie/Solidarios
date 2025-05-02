/**
 * Hook personalizado para gerenciamento de autenticação
 */
import { useCallback } from "react";
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

// Hook personalizado para autenticação
export const useAuth = () => {
  const dispatch = useAppDispatch();

  // Selecionar estado de autenticação da store
  const { user, accessToken, refreshToken, isAuthenticated, isLoading, error } =
    useAppSelector((state) => state.auth);

  // Função para fazer login
  const login = useCallback(
    async (credentials: LoginDto) => {
      try {
        // @ts-ignore - thunk action com dispatch
        await dispatch(loginAction(credentials)).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  // Função para registrar novo usuário
  const register = useCallback(
    async (userData: RegisterDto) => {
      try {
        // @ts-ignore - thunk action com dispatch
        await dispatch(registerAction(userData)).unwrap();
        return true;
      } catch (error) {
        return false;
      }
    },
    [dispatch]
  );

  // Função para fazer logout
  const logout = useCallback(async () => {
    try {
      // @ts-ignore - thunk action com dispatch
      await dispatch(logoutAction()).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  }, [dispatch]);

  // Função para obter perfil do usuário
  const getProfile = useCallback(async () => {
    try {
      // @ts-ignore - thunk action com dispatch
      return await dispatch(getProfileAction()).unwrap();
    } catch (error) {
      return null;
    }
  }, [dispatch]);

  // Função para renovar tokens
  const refreshTokens = useCallback(async () => {
    if (!refreshToken) return false;

    try {
      // @ts-ignore - thunk action com dispatch
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

  // Retornar as funções e estado
  return {
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
};

export default useAuth;
