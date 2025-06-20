/**
 * Hook para recuperação automática de problemas de autenticação
 */
import { useEffect, useCallback } from "react";
import { useAppSelector } from "../store";
import { authManager } from "../utils/authManager";
import { authDebugger } from "../utils/authDebugger";

interface RecoveryOptions {
  maxAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

export const useAuthRecovery = (options: RecoveryOptions = {}) => {
  const {
    maxAttempts = 3,
    retryDelay = 2000,
    enableLogging = __DEV__,
  } = options;

  const { isAuthenticated, user, accessToken } = useAppSelector(
    (state) => state.auth
  );

  // Detectar inconsistências no estado
  const hasInconsistentState = useCallback(() => {
    // Caso 1: Autenticado mas sem usuário
    if (isAuthenticated && !user) {
      return "authenticated_no_user";
    }

    // Caso 2: Tem token mas não está autenticado
    if (accessToken && !isAuthenticated) {
      return "has_token_not_authenticated";
    }

    // Caso 3: Autenticado mas sem token
    if (isAuthenticated && !accessToken) {
      return "authenticated_no_token";
    }

    return null;
  }, [isAuthenticated, user, accessToken]);

  // Função de recuperação
  const attemptRecovery = useCallback(
    async (issue: string) => {
      if (enableLogging) {
        console.log(`[AuthRecovery] Tentando recuperar do problema: ${issue}`);
        await authDebugger.captureState(`recovery_attempt_${issue}`);
      }

      try {
        switch (issue) {
          case "authenticated_no_user":
            // Tentar recarregar o perfil do usuário
            console.log("[AuthRecovery] Recarregando perfil do usuário...");
            await authManager.initialize();
            break;

          case "has_token_not_authenticated":
          case "authenticated_no_token":
            // Re-inicializar todo o sistema de auth
            console.log(
              "[AuthRecovery] Re-inicializando sistema de autenticação..."
            );
            await authManager.forceLogout();
            await authManager.initialize();
            break;

          default:
            console.warn(`[AuthRecovery] Problema não reconhecido: ${issue}`);
        }

        if (enableLogging) {
          await authDebugger.captureState(`recovery_completed_${issue}`);
        }

        return true;
      } catch (error) {
        console.error(
          `[AuthRecovery] Falha na recuperação de ${issue}:`,
          error
        );
        return false;
      }
    },
    [enableLogging]
  );

  // Monitorar e recuperar automaticamente
  useEffect(() => {
    const issue = hasInconsistentState();

    if (issue) {
      console.warn(`[AuthRecovery] Estado inconsistente detectado: ${issue}`);

      let attempts = 0;

      const recover = async () => {
        attempts++;

        if (attempts > maxAttempts) {
          console.error(
            `[AuthRecovery] Máximo de tentativas excedido para ${issue}`
          );
          await authManager.forceLogout();
          return;
        }

        const success = await attemptRecovery(issue);

        if (!success) {
          console.log(
            `[AuthRecovery] Tentativa ${attempts} falhou, tentando novamente em ${retryDelay}ms`
          );
          setTimeout(recover, retryDelay);
        } else {
          console.log(
            `[AuthRecovery] Recuperação bem-sucedida após ${attempts} tentativa(s)`
          );
        }
      };

      // Aguardar um pouco antes da primeira tentativa
      setTimeout(recover, 1000);
    }
  }, [hasInconsistentState, attemptRecovery, maxAttempts, retryDelay]);

  return {
    hasInconsistentState: hasInconsistentState(),
    attemptRecovery,
  };
};
