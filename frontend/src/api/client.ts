/**
 * Cliente HTTP baseado em Axios para comunicação com a API
 */
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../store";
import { logout, refreshTokens } from "../store/slices/authSlice";

// Criando uma instância do Axios com configurações padrão
const apiClient: AxiosInstance = axios.create({
  // A URL base deve ser ajustada para a URL do backend em produção
  baseURL: "http://localhost:3000", // Para desenvolvimento local
  timeout: 15000, // Timeout de 15 segundos
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Obter o token de acesso do AsyncStorage
    const token = await AsyncStorage.getItem("@auth_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Adicionar token CSRF para requisições que modificam dados
    if (
      ["post", "put", "patch", "delete"].includes(
        config.method?.toLowerCase() || ""
      ) &&
      config.headers
    ) {
      const csrfToken = await AsyncStorage.getItem("@csrf_token");
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respostas - trata erros e refresh de token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extrair e salvar o token CSRF se presente nos headers
    const csrfToken = response.headers["x-csrf-token"];
    if (csrfToken) {
      AsyncStorage.setItem("@csrf_token", csrfToken);
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Se o erro for de token expirado (401) e não estamos tentando fazer refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      // @ts-ignore - propriedade personalizada para evitar loop infinito
      !originalRequest._retry &&
      // Não tentar refresh em rotas de auth
      !originalRequest.url?.includes("auth/login") &&
      !originalRequest.url?.includes("auth/refresh")
    ) {
      // @ts-ignore
      originalRequest._retry = true;

      try {
        // Tentar atualizar o token
        const state = store.getState();
        const refreshToken = state.auth.refreshToken;

        if (refreshToken) {
          // Disparar a ação de refresh token
          // @ts-ignore - tipagem do thunk
          await store.dispatch(refreshTokens(refreshToken));

          // Obter o novo token
          const newState = store.getState();
          const newToken = newState.auth.accessToken;

          if (newToken && originalRequest.headers) {
            // Atualizar o token na requisição original
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            // Refazer a requisição original com o novo token
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Erro ao atualizar token:", refreshError);
        // Se falhar o refresh, fazer logout
        // @ts-ignore - tipagem do thunk
        store.dispatch(logout());
      }
    }

    // Erros de CSRF - 403 com mensagem específica
    if (
      error.response?.status === 403 &&
      (error.response?.data as any)?.message?.includes("CSRF")
    ) {
      console.error("Erro de token CSRF. Recarregando tokens...");
      // Limpar o token CSRF armazenado
      AsyncStorage.removeItem("@csrf_token");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
