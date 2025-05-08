import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// URL base da API - deve corresponder à mesma URL usada em apiClient
const API_BASE_URL = "http://10.0.2.2:3000"; // Ajustar conforme necessário

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
    // Chamada direta à API sem depender de apiClient para evitar ciclos
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Salvar os novos tokens
    await AsyncStorage.setItem("@auth_token", accessToken);
    await AsyncStorage.setItem("@refresh_token", newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    // Remover tokens em caso de erro
    await handleLogout();
    throw error;
  }
};
