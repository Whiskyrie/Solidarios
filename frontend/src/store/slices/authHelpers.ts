/**
 * Funções auxiliares para manipulação de autenticação
 * Atualizado para integrar com o novo sistema de tokens
 */
import {
  logout as logoutAction,
  updateTokens,
  refreshTokens as refreshTokensAction,
} from "./authSlice";
import {
  refreshTokens as refreshTokensUtil,
  clearTokens,
} from "../../utils/tokenUtils";
import { UnknownAction, ThunkDispatch } from "@reduxjs/toolkit";

// Tipo correto para o dispatch que pode lidar com thunks
type AppThunkDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

// Armazena a referência global do dispatch para uso em funções que não têm acesso direto ao store
let dispatchRef: AppThunkDispatch | null = null;

/**
 * Configura a referência global do dispatch
 * @param dispatch - O dispatch do store Redux
 */
export const setDispatchReference = (dispatch: AppThunkDispatch) => {
  dispatchRef = dispatch;
  console.log("[authHelpers] Referência do dispatch configurada");
};

/**
 * Obtém a referência do dispatch
 * @returns O dispatch do store Redux
 * @throws Error se o dispatch não foi configurado
 */
export const getDispatch = (): AppThunkDispatch => {
  if (!dispatchRef) {
    throw new Error(
      "Dispatch reference not set. Call setDispatchReference first."
    );
  }
  return dispatchRef;
};

/**
 * Limpa a referência do dispatch (útil em testes ou reinicialização)
 */
export const clearDispatchReference = () => {
  dispatchRef = null;
  console.log("[authHelpers] Referência do dispatch limpa");
};

/**
 * Manipula o refresh de tokens de forma inteligente
 * Usa o sistema Redux integrado com o token manager
 * @param refreshToken Token de atualização (opcional, usa do estado se não fornecido)
 */
export const handleRefreshTokens = async (refreshToken?: string) => {
  try {
    if (!dispatchRef) {
      throw new Error("Dispatch não configurado");
    }

    console.log("[authHelpers] Iniciando renovação de tokens");

    if (refreshToken) {
      // Se refresh token foi fornecido, usar diretamente os utilitários
      const tokens = await refreshTokensUtil(refreshToken);

      // Atualizar o estado Redux
      dispatchRef(updateTokens(tokens));

      console.log("[authHelpers] Tokens renovados via utilitário direto");
      return tokens;
    } else {
      // Usar o thunk do Redux que gerencia o estado automaticamente
      const result = await dispatchRef(refreshTokensAction()).unwrap();

      console.log("[authHelpers] Tokens renovados via Redux thunk");
      return result;
    }
  } catch (error) {
    console.error("[authHelpers] Erro na renovação de tokens:", error);

    // Em caso de erro, fazer logout automático
    await handleLogout();
    throw error;
  }
};

/**
 * Manipula o logout de forma limpa
 * Limpa tokens e atualiza estado Redux
 */
export const handleLogout = async () => {
  try {
    console.log("[authHelpers] Iniciando processo de logout");

    // Limpar tokens do armazenamento
    await clearTokens();

    // Despachar ação de logout para o Redux
    if (dispatchRef) {
      dispatchRef(logoutAction());
      console.log("[authHelpers] Logout processado com sucesso");
    }
  } catch (error) {
    console.error("[authHelpers] Erro durante logout:", error);

    // Mesmo com erro, garantir que o estado seja limpo
    if (dispatchRef) {
      dispatchRef(logoutAction());
    }
  }
};

/**
 * Força logout em caso de erro crítico de autenticação
 * Usado pelo token manager em situações de emergência
 */
export const forceLogoutOnError = async () => {
  console.log("[authHelpers] Forçando logout devido a erro crítico");

  try {
    await clearTokens();
  } catch (error) {
    console.error(
      "[authHelpers] Erro ao limpar tokens no logout forçado:",
      error
    );
  }

  if (dispatchRef) {
    dispatchRef({ type: "auth/forceLogout" });
  }
};

/**
 * Verifica se o sistema está pronto para operações de autenticação
 */
export const isAuthSystemReady = (): boolean => {
  return dispatchRef !== null;
};

/**
 * Obtém informações de debug do sistema de autenticação
 */
export const getAuthSystemDebugInfo = () => {
  return {
    hasDispatchRef: dispatchRef !== null,
    timestamp: new Date().toISOString(),
  };
};
