/**
 * Utilitários para gerenciamento de tokens sem depender da API auth diretamente
 * para evitar ciclos de dependência
 */
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "../api/api"; // Importe a função

/**
 * Atualiza tokens usando o refresh token sem depender do módulo auth.ts
 * @param refreshToken O token de atualização
 * @returns Promise contendo os novos tokens
 */
export const refreshTokens = async (refreshToken: string) => {
  try {
    const response = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Salvar os novos tokens no AsyncStorage
    await AsyncStorage.setItem("@auth_token", accessToken);
    await AsyncStorage.setItem("@refresh_token", newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    // Remover tokens caso ocorra um erro
    await clearTokens();
    throw error;
  }
};

/**
 * Remove os tokens de autenticação sem depender do módulo auth.ts
 */
export const clearTokens = async () => {
  await AsyncStorage.removeItem("@auth_token");
  await AsyncStorage.removeItem("@refresh_token");
};
