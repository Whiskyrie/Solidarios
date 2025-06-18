/**
 * Listener para eventos de autenticação
 * Gerencia redirecionamentos automáticos quando a sessão expira
 */
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { forceLogout } from "../store/slices/authSlice";
import api from "../api/api";

// Tipo para o estado do Redux (ajuste conforme sua estrutura)
interface RootState {
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    user: any | null;
  };
}

/**
 * Hook para escutar eventos de autenticação e reagir adequadamente
 * Deve ser usado no componente raiz do app ou no navigator principal
 */
export const useAuthListener = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const hasSetupInterceptor = useRef(false);

  useEffect(() => {
    // Configurar interceptador uma única vez
    if (!hasSetupInterceptor.current) {
      const cleanup = setupAuthErrorInterceptor();
      hasSetupInterceptor.current = true;

      // Retornar função de limpeza
      return cleanup;
    }
  }, [dispatch, navigation, isAuthenticated]);

  /**
   * Configura interceptador para capturar erros de autenticação
   * e redirecionar automaticamente para login
   */
  const setupAuthErrorInterceptor = () => {
    // Interceptador para capturar erros de autenticação do axios
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error: any) => {
        // Verificar se é um erro de autenticação que requer redirecionamento
        if (
          error.isAuthError &&
          error.shouldRedirectToLogin &&
          isAuthenticated
        ) {
          console.log(
            "[AuthListener] Detectado erro de autenticação, fazendo logout automático"
          );

          // Dispatch do logout forçado
          dispatch(forceLogout());

          // Redirecionar para tela de login
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (navError) {
            console.error(
              "[AuthListener] Erro ao navegar para login:",
              navError
            );
            // Fallback: tentar navigate normal
            navigation.navigate("Login");
          }
        }

        return Promise.reject(error);
      }
    );

    // Retornar função de limpeza do interceptador
    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  };
};

/**
 * Componente para ser usado no app principal
 * Automaticamente configura os listeners de autenticação
 */
export const AuthListener: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useAuthListener();
  return React.createElement(React.Fragment, null, children);
};

/**
 * Hook para verificar status de autenticação de forma reativa
 * Útil para componentes que precisam reagir a mudanças no estado de auth
 */
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, error, user } = useSelector(
    (state: RootState) => state.auth
  );

  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    isLoggedIn: isAuthenticated && user !== null,
  };
};

/**
 * Hook para ações de autenticação
 * Centraliza as principais ações relacionadas a auth
 */
export const useAuthActions = () => {
  const dispatch = useDispatch();

  return {
    forceLogout: () => dispatch(forceLogout()),
    clearError: () => dispatch({ type: "auth/clearError" }),
    setLoading: (loading: boolean) =>
      dispatch({ type: "auth/setLoading", payload: loading }),
  };
};
