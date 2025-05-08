/**
 * Funções auxiliares para manipulação de autenticação
 * Refatorado para evitar ciclo de dependências
 */
import { store } from "..";
import { logout as logoutAction, updateTokens } from "./authSlice";
import { refreshTokens, clearTokens } from "../../utils/tokenUtils";
import { Dispatch } from "@reduxjs/toolkit";

// Armazena a referência global do dispatch para uso em funções que não têm acesso direto ao store
let dispatchRef: Dispatch | null = null;

/**
 * Configura a referência global do dispatch
 * @param dispatch - O dispatch do store Redux
 */
export const setDispatchReference = (dispatch: Dispatch) => {
  dispatchRef = dispatch;
};

/**
 * Obtém a referência do dispatch
 * @returns O dispatch do store Redux
 * @throws Error se o dispatch não foi configurado
 */
export const getDispatch = (): Dispatch => {
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
};

/**
 * Manipula o refresh de tokens
 * @param refreshToken Token de atualização
 */
export const handleRefreshTokens = async (refreshToken: string) => {
  try {
    // Usa a função utilitária tokenUtils em vez de auth.ts
    const tokens = await refreshTokens(refreshToken);

    // Atualiza o estado Redux
    store.dispatch(updateTokens(tokens));

    return tokens;
  } catch (error) {
    // Em caso de erro, faz logout
    await handleLogout();
    throw error;
  }
};

/**
 * Manipula o logout
 */
export const handleLogout = async () => {
  // Limpa os tokens com a função utilitária
  await clearTokens();

  // Despacha a ação de logout para o Redux
  store.dispatch(logoutAction());
};
