import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api"; // Use a mesma instância do axios
import { ApiResponse } from "../types/common.types";

// URL base da API - deve corresponder à mesma URL usada em apiClient
const API_BASE_URL = "https://solidarios-app-dwus7.ondigitalocean.app/api"; // Ajustar conforme necessário

export const handleLoginSuccess = async (
  accessToken: string,
  refreshToken: string
) => {
  await AsyncStorage.setItem("@auth_token", accessToken);
  await AsyncStorage.setItem("@refresh_token", refreshToken);
};

export const handleLogout = async () => {
  await AsyncStorage.removeItem("@auth_token");
  await AsyncStorage.removeItem("@refresh_token");
};

export const handleRefreshTokens = async (refreshToken: string) => {
  try {
    // Use a instância api em vez de axios diretamente e formate corretamente o payload
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    // Verificar se a resposta está no formato esperado (pode estar dentro de data.data)
    let accessToken, newRefreshToken;

    if (response.data.data) {
      // Formato aninhado (resposta real do servidor)
      accessToken = response.data.data.accessToken;
      newRefreshToken = response.data.data.refreshToken;
    } else {
      // Formato direto
      accessToken = response.data.accessToken;
      newRefreshToken = response.data.refreshToken;
    }

    // Verificar se os tokens foram obtidos
    if (!accessToken || !newRefreshToken) {
      console.error("Tokens ausentes na resposta de refresh:", response.data);
      throw new Error("Resposta de refresh incompleta");
    }

    console.log("[authUtils] Tokens renovados com sucesso");

    // Salvar os novos tokens
    await AsyncStorage.setItem("@auth_token", accessToken);
    await AsyncStorage.setItem("@refresh_token", newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.error("[authUtils] Erro ao renovar tokens:", error);
    await handleLogout();
    throw error;
  }
};

// Função para verificar se há um token válido
export const hasValidToken = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem("@auth_token");
  return token !== null;
};
