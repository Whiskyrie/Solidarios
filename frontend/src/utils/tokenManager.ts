/**
 * Gerenciador de tokens com renovação automática e verificação de expiração
 * Atualizado para integrar com Redux e sistema de autenticação
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  handleRefreshTokens,
  isAuthSystemReady,
} from "../store/slices/authHelpers";

// Configuração do gerenciador de tokens
interface TokenManagerConfig {
  renewalTimeBeforeExpiry: number; // em minutos
  enableDebugLogs: boolean;
  maxRetryAttempts: number;
  retryDelay: number; // em ms
}

// Configuração padrão
const DEFAULT_CONFIG: TokenManagerConfig = {
  renewalTimeBeforeExpiry: 5,
  enableDebugLogs: __DEV__,
  maxRetryAttempts: 3,
  retryDelay: 1000,
};

let currentConfig = DEFAULT_CONFIG;
let refreshTimer: NodeJS.Timeout | null = null;
let isRefreshing = false;
let isInitializing = false; // Flag para controlar inicialização

/**
 * Configura o gerenciador de tokens
 */
export const configureTokenManager = (config: Partial<TokenManagerConfig>) => {
  currentConfig = { ...DEFAULT_CONFIG, ...config };

  if (currentConfig.enableDebugLogs) {
    console.log("[tokenManager] Configuração atualizada:", currentConfig);
  }
};

/**
 * Decodifica JWT sem verificar assinatura (apenas para leitura de dados)
 */
export const decodeJWT = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Token JWT inválido");
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    if (currentConfig.enableDebugLogs) {
      console.error("[tokenManager] Erro ao decodificar JWT:", error);
    }
    return null;
  }
};

/**
 * Verifica se um token JWT está expirado
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp <= currentTime;

    if (currentConfig.enableDebugLogs && isExpired) {
      console.log("[tokenManager] Token expirado detectado");
    }

    return isExpired;
  } catch (error) {
    if (currentConfig.enableDebugLogs) {
      console.error("[tokenManager] Erro ao verificar expiração:", error);
    }
    return true;
  }
};

/**
 * Calcula quantos minutos restam até a expiração do token
 */
export const getTokenTimeRemaining = (token: string): number => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = Math.max(0, decoded.exp - currentTime);

    return Math.floor(timeRemaining / 60); // Converter para minutos
  } catch {
    return 0;
  }
};

/**
 * Programa a renovação automática do token
 */
export const scheduleTokenRefresh = async () => {
  if (isInitializing) {
    console.log("[tokenManager] Ignorando agendamento durante inicialização");
    return;
  }

  try {
    // Verificar se o sistema está pronto
    if (!isAuthSystemReady()) {
      if (currentConfig.enableDebugLogs) {
        console.log("[tokenManager] Sistema não pronto, adiando programação");
      }
      return;
    }

    // Cancelar timer anterior se existir
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }

    // Obter token atual
    const accessToken = await AsyncStorage.getItem("@auth_token");

    if (!accessToken || isTokenExpired(accessToken)) {
      if (currentConfig.enableDebugLogs) {
        console.log("[tokenManager] Token não disponível ou expirado");
      }
      return;
    }

    const timeRemaining = getTokenTimeRemaining(accessToken);
    const scheduleTime = Math.max(
      1,
      timeRemaining - currentConfig.renewalTimeBeforeExpiry
    );

    if (scheduleTime <= 0) {
      // Token expira muito em breve, renovar imediatamente
      if (currentConfig.enableDebugLogs) {
        console.log(
          "[tokenManager] Token expira em breve, renovando imediatamente"
        );
      }
      await performTokenRefresh();
      return;
    }

    // Programar renovação
    const delayMs = scheduleTime * 60 * 1000;
    refreshTimer = setTimeout(async () => {
      await performTokenRefresh();
    }, delayMs);

    if (currentConfig.enableDebugLogs) {
      console.log(
        `[tokenManager] Renovação programada para ${scheduleTime} minutos`
      );
    }
  } catch (error) {
    console.error("[tokenManager] Erro ao programar renovação:", error);
  }
};

/**
 * Executa a renovação do token com retry automático
 */
const performTokenRefresh = async (attempt = 1): Promise<void> => {
  if (isRefreshing) {
    if (currentConfig.enableDebugLogs) {
      console.log("[tokenManager] Renovação já em andamento, ignorando");
    }
    return;
  }

  isRefreshing = true;

  try {
    if (currentConfig.enableDebugLogs) {
      console.log(
        `[tokenManager] Tentativa ${attempt} de renovação automática`
      );
    }

    // Usar o helper integrado que gerencia Redux
    await handleRefreshTokens();

    if (currentConfig.enableDebugLogs) {
      console.log("[tokenManager] Renovação automática bem-sucedida");
    }

    // Programar próxima renovação
    await scheduleTokenRefresh();
  } catch (error) {
    console.error(`[tokenManager] Erro na tentativa ${attempt}:`, error);

    // Tentar novamente se não excedeu o limite
    if (attempt < currentConfig.maxRetryAttempts) {
      setTimeout(async () => {
        await performTokenRefresh(attempt + 1);
      }, currentConfig.retryDelay * attempt);
    } else {
      console.error("[tokenManager] Máximo de tentativas excedido");
    }
  } finally {
    isRefreshing = false;
  }
};

/**
 * Cancela a renovação automática programada
 */
export const cancelTokenRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;

    if (currentConfig.enableDebugLogs) {
      console.log("[tokenManager] Renovação automática cancelada");
    }
  }

  isRefreshing = false;
};

/**
 * Força uma renovação imediata do token
 */
export const forceTokenRefresh = async (): Promise<boolean> => {
  try {
    if (isRefreshing) {
      if (currentConfig.enableDebugLogs) {
        console.log("[tokenManager] Renovação já em andamento");
      }
      return false;
    }

    await performTokenRefresh();
    return true;
  } catch (error) {
    console.error("[tokenManager] Erro na renovação forçada:", error);
    return false;
  }
};

/**
 * Obtém status atual do gerenciador de tokens
 */
export const getTokenManagerStatus = async () => {
  const accessToken = await AsyncStorage.getItem("@auth_token");

  return {
    hasActiveTimer: refreshTimer !== null,
    isCurrentlyRefreshing: isRefreshing,
    hasToken: !!accessToken,
    tokenExpired: accessToken ? isTokenExpired(accessToken) : true,
    timeRemaining: accessToken ? getTokenTimeRemaining(accessToken) : 0,
    config: currentConfig,
    systemReady: isAuthSystemReady(),
  };
};

/**
 * Para completamente o gerenciador de tokens
 */
export const stopTokenManager = () => {
  cancelTokenRefresh();
  isRefreshing = false;

  if (currentConfig.enableDebugLogs) {
    console.log("[tokenManager] Gerenciador de tokens parado");
  }
};

/**
 * Define o modo de inicialização do gerenciador de tokens
 */
export const setInitializationMode = (mode: boolean) => {
  isInitializing = mode;
  console.log(`[tokenManager] Modo inicialização: ${mode}`);
};
