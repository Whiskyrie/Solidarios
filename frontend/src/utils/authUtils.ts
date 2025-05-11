import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api"; // Use a mesma instância do axios

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
    // Use a instância api em vez de axios diretamente
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Salvar os novos tokens
    await AsyncStorage.setItem("@auth_token", accessToken);
    await AsyncStorage.setItem("@refresh_token", newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    await handleLogout();
    throw error;
  }
};
