/**
 * Configuração da API com interceptadores para autenticação automática
 * Inclui renovação automática de tokens em caso de erro 401
 */
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configuração de URLs para diferentes ambientes
const API_URLS = {
  LOCAL: "http://localhost:3000",
  CLOUD: "https://api-solidarios.onrender.com",
} as const;

type ApiEnvironment = keyof typeof API_URLS;

// Função para obter o ambiente padrão do .env
const getDefaultEnvironment = (): ApiEnvironment => {
  const envValue = process.env.EXPO_PUBLIC_API_ENVIRONMENT?.toUpperCase();
  return envValue && envValue in API_URLS
    ? (envValue as ApiEnvironment)
    : "CLOUD";
};

// Variável para controlar qual ambiente usar
let currentEnvironment: ApiEnvironment = getDefaultEnvironment();

// Função para obter a URL base atual
export const getApiBaseUrl = () => API_URLS[currentEnvironment];

// Função para alternar entre ambientes
export const toggleApiEnvironment = async () => {
  currentEnvironment = currentEnvironment === "CLOUD" ? "LOCAL" : "CLOUD";
  await AsyncStorage.setItem("@api_environment", currentEnvironment);
  api.defaults.baseURL = getApiBaseUrl();
  console.log(
    `[API Config] Ambiente alterado para: ${currentEnvironment} (${getApiBaseUrl()})`
  );
  return currentEnvironment;
};

// Função para inicializar ambiente da API
export const initApiEnvironment = async () => {
  try {
    // Primeiro tenta do AsyncStorage (para sobrescrever a configuração quando alterada pelo usuário)
    const savedEnvironment = await AsyncStorage.getItem("@api_environment");
    if (savedEnvironment && savedEnvironment in API_URLS) {
      currentEnvironment = savedEnvironment as ApiEnvironment;
    } else {
      // Se não houver configuração no AsyncStorage, usa o valor do .env
      currentEnvironment = getDefaultEnvironment();
    }

    api.defaults.baseURL = getApiBaseUrl();
    console.log(
      `[API Config] URL base configurada: ${currentEnvironment} (${getApiBaseUrl()})`
    );
  } catch (error) {
    console.error("[API Config] Erro ao inicializar ambiente:", error);
  }
};

const api = axios.create({
  baseURL: API_URLS[currentEnvironment],
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Inicializa o ambiente (chamado na inicialização do app)
initApiEnvironment();

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

// Interceptador de resposta com renovação automática de token
api.interceptors.response.use(
  (response) => {
    console.log("[API] Resposta:", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 (não autorizado) e não for uma rota de auth, tentar renovar token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        console.log(
          "[API] Detectado erro 401, tentando renovar token automaticamente"
        );
        const refreshToken = await AsyncStorage.getItem("@refresh_token");

        if (refreshToken) {
          // Importação dinâmica para evitar dependência circular
          const { handleRefreshTokens } = await import("../utils/authUtils");
          const newTokens = await handleRefreshTokens(refreshToken);

          // Atualizar o header da requisição original com o novo token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

          console.log(
            "[API] Token renovado com sucesso, repetindo requisição original"
          );
          // Repetir a requisição original com o novo token
          return api(originalRequest);
        } else {
          console.log(
            "[API] Refresh token não encontrado, redirecionamento necessário"
          );
        }
      } catch (refreshError) {
        console.error(
          "[API] Falha ao renovar token automaticamente:",
          refreshError
        );

        // Se falhar ao renovar, limpar tokens e sinalizar necessidade de login
        await AsyncStorage.removeItem("@auth_token");
        await AsyncStorage.removeItem("@refresh_token");

        // Aqui você pode disparar uma ação do Redux ou evento para redirecionar ao login
        // Por exemplo: store.dispatch(logout()) ou navigation.navigate('Login')
        // Como não temos acesso direto aqui, vamos adicionar uma propriedade ao erro
        const authError = new Error("Sessão expirada. Faça login novamente.");
        (authError as any).isAuthError = true;
        (authError as any).shouldRedirectToLogin = true;
        throw authError;
      }
    }

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
      config.url?.includes("/auth/register") ||
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
