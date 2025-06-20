/**
 * Utilitários para gerenciamento de tokens
 * Integra com o backend e AsyncStorage
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

/**
 * Função utilitária para renovar tokens
 * Integrada com o backend
 */
export const refreshTokens = async (refreshToken: string) => {
  try {
    console.log("[tokenUtils] Iniciando renovação de tokens");

    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    // Extrair tokens da resposta conforme estrutura do backend
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

    if (!accessToken || !newRefreshToken) {
      throw new Error("Resposta de renovação incompleta do servidor");
    }

    // Salvar novos tokens no AsyncStorage
    await AsyncStorage.setItem("@auth_token", accessToken);
    await AsyncStorage.setItem("@refresh_token", newRefreshToken);

    console.log("[tokenUtils] Tokens renovados e salvos com sucesso");

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error: any) {
    console.error("[tokenUtils] Erro ao renovar tokens:", error);

    // Se o refresh token está inválido (401), limpar tokens
    if (error.response?.status === 401) {
      console.log("[tokenUtils] Refresh token inválido, limpando tokens");
      await clearTokens();
    }

    throw error;
  }
};

/**
 * Limpar todos os tokens do armazenamento
 */
export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem("@auth_token");
    await AsyncStorage.removeItem("@refresh_token");
    console.log("[tokenUtils] Tokens removidos do armazenamento");
  } catch (error) {
    console.error("[tokenUtils] Erro ao limpar tokens:", error);
  }
};

/**
 * Obter tokens atuais do armazenamento
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
    console.error("[tokenUtils] Erro ao obter tokens:", error);
    return null;
  }
};

/**
 * Salvar tokens no armazenamento
 */
export const saveTokens = async (accessToken: string, refreshToken: string) => {
  try {
    await AsyncStorage.setItem("@auth_token", accessToken);
    await AsyncStorage.setItem("@refresh_token", refreshToken);
    console.log("[tokenUtils] Tokens salvos no armazenamento");
  } catch (error) {
    console.error("[tokenUtils] Erro ao salvar tokens:", error);
    throw error;
  }
};
