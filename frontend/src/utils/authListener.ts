/**
 * Listener para eventos de autenticação
 * Gerencia redirecionamentos automáticos quando a sessão expira
 * CORRIGIDO: Verificações de segurança para NavigationContainer
 */
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { forceLogout } from "../store/slices/authSlice";
import api from "../api/api";
import { View } from "react-native";

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
 * Deve ser usado DENTRO do NavigationContainer
 */
export const useAuthListener = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const hasSetupInterceptor = useRef(false);

  useEffect(() => {
    // Verificar se o navigation está disponível
    if (!navigation) {
      console.warn("[AuthListener] Navigation não está disponível ainda");
      return;
    }

    // Configurar interceptador uma única vez
    if (!hasSetupInterceptor.current) {
      const cleanup = setupAuthErrorInterceptor();
      hasSetupInterceptor.current = true;
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

          // Redirecionar para tela de login com verificação de segurança
          try {
            if (navigation && navigation.reset) {
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } else if (navigation && navigation.navigate) {
              navigation.navigate("Login");
            } else {
              console.warn(
                "[AuthListener] Navigation não disponível para redirecionamento"
              );
            }
          } catch (navError) {
            console.error(
              "[AuthListener] Erro ao navegar para login:",
              navError
            );
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
 * DEVE ser usado DENTRO do NavigationContainer
 */
export const AuthListener: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useAuthListener();
  return React.createElement(View, { style: { flex: 1 } }, children);
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

/**
 * Hook de segurança para verificar se o navigation está disponível
 * Útil para componentes que precisam navegar condicionalmente
 */
export const useNavigationSafe = () => {
  const navigation = useNavigation<any>();

  const navigateSafe = (routeName: string, params?: any) => {
    try {
      if (navigation && navigation.navigate) {
        navigation.navigate(routeName, params);
      } else {
        console.warn(
          `[useNavigationSafe] Não foi possível navegar para ${routeName}`
        );
      }
    } catch (error) {
      console.error(
        `[useNavigationSafe] Erro ao navegar para ${routeName}:`,
        error
      );
    }
  };

  const resetSafe = (routes: any[]) => {
    try {
      if (navigation && navigation.reset) {
        navigation.reset({ index: 0, routes });
      } else {
        console.warn(
          "[useNavigationSafe] Não foi possível fazer reset da navegação"
        );
      }
    } catch (error) {
      console.error("[useNavigationSafe] Erro ao fazer reset:", error);
    }
  };

  return {
    navigateSafe,
    resetSafe,
    isNavigationAvailable: !!(navigation && navigation.navigate),
  };
};
