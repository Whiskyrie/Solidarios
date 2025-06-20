/**
 * Configuração da API com interceptors inteligentes
 * Integrado com o sistema de renovação automática de tokens
 */
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../store";
import { forceLogout, refreshTokens } from "../store/slices/authSlice";

const BASE_URL = "https://walrus-app-tyhbw.ondigitalocean.app/api";

// Criar instância do axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag para evitar múltiplas tentativas de refresh simultâneas
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: any) => void;
}> = [];

/**
 * Processa a fila de requisições pendentes após renovação de token
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });

  failedQueue = [];
};

/**
 * Interceptor de requisição - adiciona token de autorização
 */
api.interceptors.request.use(
  async (config) => {
    // Não adicionar token para endpoints de auth
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/refresh")
    ) {
      return config;
    }

    try {
      const token = await AsyncStorage.getItem("@auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("[API] Erro ao obter token para requisição:", error);
    }

    return config;
  },
  (error) => {
    console.error("[API] Erro no interceptor de requisição:", error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de resposta - trata erros de autenticação e renovação automática
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Verificar se é erro 401 e se não é uma tentativa de retry
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/")
    ) {
      console.log("[API] Erro 401 detectado, iniciando processo de renovação");

      // Se já está renovando, adicionar à fila de espera
      if (isRefreshing) {
        console.log("[API] Renovação em andamento, adicionando à fila");

        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers!.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Marcar como tentativa de retry
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("[API] Iniciando renovação de tokens...");

        // Tentar renovar tokens usando Redux
        await store.dispatch(refreshTokens()).unwrap();

        // Obter novo token
        const newToken = await AsyncStorage.getItem("@auth_token");

        if (newToken) {
          console.log("[API] Token renovado com sucesso");

          // Processar fila de requisições pendentes
          processQueue(null, newToken);

          // Refazer requisição original com novo token
          originalRequest.headers!.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          throw new Error("Novo token não disponível após renovação");
        }
      } catch (refreshError) {
        console.error("[API] Falha na renovação de tokens:", refreshError);

        // Processar fila com erro
        processQueue(refreshError, null);

        // Fazer logout forçado
        store.dispatch(forceLogout());

        // Criar erro personalizado para redirecionamento
        const authError = new Error("Sessão expirada") as any;
        authError.isAuthError = true;
        authError.shouldRedirectToLogin = true;

        return Promise.reject(authError);
      } finally {
        isRefreshing = false;
      }
    }

    // Para outros tipos de erro, rejeitar normalmente
    return Promise.reject(error);
  }
);

/**
 * Função utilitária para fazer requisições com retry automático
 */
export const makeAuthenticatedRequest = async (
  requestConfig: AxiosRequestConfig
) => {
  return await api(requestConfig);
};

/**
 * Limpa a fila de requisições pendentes (útil para logout)
 */
export const clearRequestQueue = () => {
  failedQueue.forEach(({ reject }) => {
    reject(new Error("Request cancelled due to logout"));
  });
  failedQueue = [];
  isRefreshing = false;
};

/**
 * Obtém status atual do sistema de requisições
 */
export const getApiStatus = () => {
  return {
    isRefreshing,
    queueLength: failedQueue.length,
    baseURL: BASE_URL,
  };
};

export default api;
