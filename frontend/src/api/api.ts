import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Determinar a URL base com base no ambiente e plataforma
const getBaseURL = () => {
  console.log(
    "[API Config] Ambiente:",
    __DEV__ ? "Desenvolvimento" : "Produção"
  );
  console.log("[API Config] Plataforma:", Platform.OS);

  if (__DEV__) {
    // No Android Emulator, usamos 10.0.2.2 para acessar o localhost da máquina host
    // No iOS Simulator, usamos localhost
    // Em dispositivos físicos, poderia usar o IP da máquina na rede local
    const androidUrl = "http://10.0.2.2:3000";
    const iosUrl = "http://localhost:3000";

    const baseUrl = Platform.OS === "android" ? androidUrl : iosUrl;
    console.log("[API Config] URL base selecionada:", baseUrl);
    return baseUrl;
  }

  return "https://api-solidarios.com"; // URL de produção
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // Aumentado para 15s para dar mais tempo em desenvolvimento
  headers: {
    "Content-Type": "application/json",
  },
});

// Log de requisições
api.interceptors.request.use(
  (config) => {
    console.log("[API] Requisição:", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`, // URL completa para debug
      data: config.data ? "(dados presentes)" : "(sem dados)",
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error("[API] Erro na requisição:", error);
    return Promise.reject(error);
  }
);

// Log de respostas
api.interceptors.response.use(
  (response) => {
    console.log("[API] Resposta:", {
      status: response.status,
      url: response.config.url,
      data: response.data ? "(dados presentes)" : "(sem dados)",
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

// Adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("@auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
