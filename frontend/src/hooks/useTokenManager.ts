/**
 * Hook para gerenciar renovação automática de tokens
 * Integra o sistema de tokens com o Redux
 */
import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  scheduleTokenRefresh,
  cancelTokenRefresh,
  isTokenExpired,
} from "../utils/tokenManager";
import { logout, refreshTokens } from "../store/slices/authSlice"; // Importe suas ações do Redux

/**
 * Hook customizado para gerenciamento inteligente de tokens
 * Monitora mudanças no estado de autenticação e programa renovações automáticas
 */
export const useTokenManager = () => {
  const dispatch = useAppDispatch();
  const { accessToken, refreshToken, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  // Programar renovação automática quando tokens mudarem
  useEffect(() => {
    if (isAuthenticated && accessToken && refreshToken) {
      console.log(
        "[useTokenManager] Verificando necessidade de renovação automática"
      );

      // Verificar se o token não está expirado
      if (!isTokenExpired(accessToken)) {
        scheduleTokenRefresh();
        console.log("[useTokenManager] Renovação automática programada");
      } else {
        console.log("[useTokenManager] Token já expirado, tentando renovar");
        // Disparar ação para renovar tokens
        dispatch(refreshTokens());
      }
    } else {
      // Cancelar renovação se não autenticado
      cancelTokenRefresh();
      console.log(
        "[useTokenManager] Renovação automática cancelada - usuário não autenticado"
      );
    }

    // Cleanup: cancelar ao desmontar componente
    return () => {
      cancelTokenRefresh();
    };
  }, [accessToken, refreshToken, isAuthenticated, dispatch]);

  // Função para verificar se token está expirado
  const checkTokenExpiry = useCallback(() => {
    if (!accessToken) return true;
    return isTokenExpired(accessToken);
  }, [accessToken]);

  // Função para forçar logout quando tokens são inválidos
  const forceLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  // Função para renovar tokens manualmente
  const refreshTokensManually = useCallback(() => {
    if (refreshToken) {
      dispatch(refreshTokens());
    } else {
      forceLogout();
    }
  }, [dispatch, refreshToken, forceLogout]);

  // Função para obter tempo restante até expiração (em minutos)
  const getTimeUntilExpiry = useCallback(() => {
    if (!accessToken) return 0;

    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      const expTime = payload.exp * 1000; // Converter para ms
      const now = Date.now();
      const timeLeft = Math.max(0, expTime - now);
      return Math.floor(timeLeft / (1000 * 60)); // Converter para minutos
    } catch (error) {
      console.error(
        "[useTokenManager] Erro ao calcular tempo de expiração:",
        error
      );
      return 0;
    }
  }, [accessToken]);

  return {
    isTokenExpired: checkTokenExpiry(),
    timeUntilExpiry: getTimeUntilExpiry(),
    hasValidTokens:
      isAuthenticated && accessToken && refreshToken && !checkTokenExpiry(),
    forceLogout,
    refreshTokensManually,
  };
};
