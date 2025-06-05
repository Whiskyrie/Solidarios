import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENVIRONMENT } from "@env";

// URLs disponíveis
const API_URLS = {
  CLOUD: "http://walrus-app-tyhbw.ondigitalocean.app",
  LOCAL: "http://10.0.2.2:3000", // Para emuladores Android
  // LOCAL: "http://localhost:3000", // Para web ou iOS
};

// Define o tipo para o ambiente
type ApiEnvironment = keyof typeof API_URLS;

//  Obter o ambiente padrão do arquivo .env ou usar CLOUD como fallback
const getDefaultEnvironment = (): ApiEnvironment => {
  const envValue = API_ENVIRONMENT?.toUpperCase();
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
