import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// URL base consistente para todos os ambientes
const API_BASE_URL = "https://solidarios-app-dwus7.ondigitalocean.app/api";

console.log("[API Config] URL base configurada:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log de requisições
api.interceptors.request.use(
  (config) => {
    console.log("[API] Requisição:", {
      method: config.method?.toUpperCase(),
      url: `${config.url}`,
      params: config.params,
    });
    return config;
  },
  (error) => {
    console.error("[API] Erro na requisição:", error);
    return Promise.reject(error);
  }
);

// Log de respostas e handling de refresh token
api.interceptors.response.use(
  (response) => {
    console.log("[API] Resposta:", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error("[API] Erro na resposta:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
    });
    return Promise.reject(error);
  }
);

// Adicionar token de autenticação em cada requisição
api.interceptors.request.use(
  async (config) => {
    // Não adicionar token para rotas de autenticação
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/refresh")
    ) {
      return config;
    }

    const token = await AsyncStorage.getItem("@auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
