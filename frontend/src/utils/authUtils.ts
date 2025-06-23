/**
 * Utilitários de autenticação com tratamento inteligente de erros
 * Inclui funções para login, logout e renovação de tokens
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

/**
 * Salva os tokens de autenticação no armazenamento local
 * @param accessToken Token de acesso JWT
 * @param refreshToken Token de renovação
 */
export const handleLoginSuccess = async (
  accessToken: string,
  refreshToken: string
) => {
  try {
    await AsyncStorage.setItem("@auth_token", accessToken);
    await AsyncStorage.setItem("@refresh_token", refreshToken);
    console.log("[authUtils] Tokens salvos com sucesso no AsyncStorage");
  } catch (error) {
    console.error("[authUtils] Erro ao salvar tokens:", error);
    throw new Error("Falha ao salvar credenciais de autenticação");
  }
};

/**
 * Remove os tokens de autenticação do armazenamento local
 */
export const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem("@auth_token");
    await AsyncStorage.removeItem("@refresh_token");
    console.log("[authUtils] Tokens removidos com sucesso do AsyncStorage");
  } catch (error) {
    console.error("[authUtils] Erro ao remover tokens:", error);
    // Não fazer throw aqui, pois logout deve sempre "funcionar"
  }
};

/**
 * Renova os tokens de autenticação usando o refresh token
 * Implementa tratamento inteligente de erros para diferentes cenários
 * @param refreshToken Token de renovação atual
 * @returns Novos tokens de acesso e renovação
 */
export const handleRefreshTokens = async (refreshToken: string) => {
  try {
    console.log("[authUtils] Iniciando renovação de tokens");

    // Fazer requisição para renovar tokens
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    // Extrair tokens conforme estrutura da resposta do backend
    let accessToken, newRefreshToken;

    if (response.data.data) {
      // Formato aninhado (resposta com wrapper de sucesso)
      accessToken = response.data.data.accessToken;
      newRefreshToken = response.data.data.refreshToken;
    } else {
      // Formato direto
      accessToken = response.data.accessToken;
      newRefreshToken = response.data.refreshToken;
    }

    // Validar se os tokens foram recebidos
    if (!accessToken || !newRefreshToken) {
      console.error(
        "[authUtils] Tokens ausentes na resposta de refresh:",
        response.data
      );
      throw new Error("Resposta de refresh incompleta do servidor");
    }

    // Salvar novos tokens no armazenamento
    await AsyncStorage.setItem("@auth_token", accessToken);
    await AsyncStorage.setItem("@refresh_token", newRefreshToken);

    console.log("[authUtils] Tokens renovados e salvos com sucesso");
    return { accessToken, refreshToken: newRefreshToken };
  } catch (error: any) {
    console.error("[authUtils] Erro ao renovar tokens:", error);

    // Tratamento inteligente baseado no tipo de erro
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      switch (status) {
        case 401:
        case 403:
          // Refresh token inválido, expirado ou revogado
          console.log(
            "[authUtils] Refresh token inválido/expirado, limpando tokens"
          );
          await handleLogout();
          throw new Error("Sessão expirada. Faça login novamente.");

        case 404:
          // Endpoint não encontrado - possível problema de configuração
          console.error("[authUtils] Endpoint de refresh não encontrado");
          throw new Error(
            "Erro de configuração do servidor. Contate o suporte."
          );

        case 500:
        case 502:
        case 503:
          // Erro interno do servidor - não limpar tokens, pode ser temporário
          console.error(
            "[authUtils] Erro interno do servidor, mantendo tokens"
          );
          throw new Error(
            "Servidor temporariamente indisponível. Tente novamente."
          );

        default:
          // Outros erros HTTP
          console.error(
            "[authUtils] Erro HTTP não tratado:",
            status,
            errorData
          );
          throw new Error(
            errorData?.message || "Erro desconhecido ao renovar sessão"
          );
      }
    } else if (
      error.code === "NETWORK_ERROR" ||
      error.message === "Network Error"
    ) {
      // Erro de rede - não limpar tokens
      console.error("[authUtils] Erro de rede ao renovar tokens");
      throw new Error("Erro de conexão. Verifique sua internet.");
    } else {
      // Outros erros (timeout, etc.)
      console.error("[authUtils] Erro desconhecido:", error.message);
      throw new Error("Erro inesperado ao renovar sessão. Tente novamente.");
    }
  }
};

/**
 * Verifica se há um token válido no armazenamento
 * @returns Promise que resolve para true se há token, false caso contrário
 */
export const hasValidToken = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem("@auth_token");
    return token !== null && token.trim().length > 0;
  } catch (error) {
    console.error("[authUtils] Erro ao verificar token:", error);
    return false;
  }
};

/**
 * Obtém os tokens atuais do armazenamento
 * @returns Objeto com os tokens ou null se não existirem
 */
export const getCurrentTokens = async () => {
  try {
    const accessToken = await AsyncStorage.getItem("@auth_token");
    const refreshToken = await AsyncStorage.getItem("@refresh_token");

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }

    return null;
  } catch (error) {
    console.error("[authUtils] Erro ao obter tokens:", error);
    return null;
  }
};

/**
 * Verifica se o usuário está autenticado de forma segura
 * Valida tanto a presença quanto a integridade básica dos tokens
 * @returns Promise que resolve para true se autenticado, false caso contrário
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const tokens = await getCurrentTokens();

    if (!tokens) {
      return false;
    }

    // Verificação básica de formato JWT (3 partes separadas por ponto)
    const isValidJWTFormat = (token: string) => {
      const parts = token.split(".");
      return parts.length === 3 && parts.every((part) => part.length > 0);
    };

    return (
      isValidJWTFormat(tokens.accessToken) && tokens.refreshToken.length > 0
    );
  } catch (error) {
    console.error("[authUtils] Erro ao verificar autenticação:", error);
    return false;
  }
};
