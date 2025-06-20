/**
 * Configuração e inicialização do sistema de autenticação
 * Centraliza a configuração inicial e verificações de segurança
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  scheduleTokenRefresh,
  cancelTokenRefresh,
  isTokenExpired,
} from "./tokenManager";
import { getCurrentTokens, isAuthenticated } from "./authUtils";

/**
 * Interface para configuração de autenticação
 */
interface AuthConfig {
  /** Tempo em minutos antes da expiração para renovar token (padrão: 5) */
  renewalTimeBeforeExpiry?: number;
  /** Habilitar logs detalhados (padrão: __DEV__) */
  enableDebugLogs?: boolean;
  /** Nome da rota de login para redirecionamento (padrão: 'Login') */
  loginRouteName?: string;
  /** Intervalo de verificação de token em minutos (padrão: 30) */
  tokenCheckInterval?: number;
}

/**
 * Configuração padrão do sistema de autenticação
 */
const DEFAULT_CONFIG: Required<AuthConfig> = {
  renewalTimeBeforeExpiry: 5,
  enableDebugLogs: __DEV__,
  loginRouteName: "Login",
  tokenCheckInterval: 30,
};

let currentConfig: Required<AuthConfig> = DEFAULT_CONFIG;
let tokenCheckTimer: NodeJS.Timeout | null = null;

/**
 * Inicializa o sistema de autenticação com configurações personalizadas
 * Deve ser chamado na inicialização do app, preferencialmente no App.tsx
 * @param config Configurações opcionais para o sistema de auth
 */
export const initializeAuth = async (config: AuthConfig = {}) => {
  try {
    // Mesclar configuração fornecida com padrões
    currentConfig = { ...DEFAULT_CONFIG, ...config };

    if (currentConfig.enableDebugLogs) {
      console.log(
        "[AuthInit] Inicializando sistema de autenticação com config:",
        currentConfig
      );
    }

    // Verificar se existem tokens válidos
    const tokens = await getCurrentTokens();

    if (tokens) {
      const { accessToken, refreshToken } = tokens;

      // Verificar integridade básica dos tokens
      if (isValidTokenFormat(accessToken) && refreshToken.length > 0) {
        // Verificar se o token está expirado
        if (isTokenExpired(accessToken)) {
          if (currentConfig.enableDebugLogs) {
            console.log(
              "[AuthInit] Token expirado encontrado, será renovado automaticamente na próxima requisição"
            );
          }
        } else {
          // Token válido, programar renovação automática
          await scheduleTokenRefresh();

          if (currentConfig.enableDebugLogs) {
            console.log(
              "[AuthInit] Token válido encontrado, renovação automática programada"
            );
          }
        }

        // Iniciar verificação periódica
        startPeriodicTokenCheck();

        return true; // Usuário possivelmente autenticado
      } else {
        // Tokens com formato inválido, limpar
        await clearInvalidTokens();
        return false;
      }
    }

    if (currentConfig.enableDebugLogs) {
      console.log(
        "[AuthInit] Nenhum token encontrado, usuário não autenticado"
      );
    }

    return false; // Usuário não autenticado
  } catch (error) {
    console.error(
      "[AuthInit] Erro ao inicializar sistema de autenticação:",
      error
    );

    // Em caso de erro, limpar tokens potencialmente corrompidos
    await clearInvalidTokens();
    return false;
  }
};

/**
 * Limpa tokens inválidos ou corrompidos
 */
const clearInvalidTokens = async () => {
  try {
    await AsyncStorage.removeItem("@auth_token");
    await AsyncStorage.removeItem("@refresh_token");

    if (currentConfig.enableDebugLogs) {
      console.log("[AuthInit] Tokens inválidos removidos");
    }
  } catch (error) {
    console.error("[AuthInit] Erro ao limpar tokens inválidos:", error);
  }
};

/**
 * Verifica se um token tem formato válido de JWT
 * @param token Token a ser verificado
 * @returns true se o formato for válido
 */
const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
};

/**
 * Inicia verificação periódica do status dos tokens
 * Útil para detectar problemas ou inconsistências
 */
const startPeriodicTokenCheck = () => {
  // Limpar timer anterior se existir
  if (tokenCheckTimer) {
    clearTimeout(tokenCheckTimer);
  }

  const checkInterval = currentConfig.tokenCheckInterval * 60 * 1000; // Converter para ms

  tokenCheckTimer = setTimeout(async () => {
    try {
      const authenticated = await isAuthenticated();

      if (!authenticated) {
        if (currentConfig.enableDebugLogs) {
          console.log(
            "[AuthInit] Verificação periódica detectou usuário não autenticado"
          );
        }

        // Cancelar renovação automática se usuário não estiver mais autenticado
        cancelTokenRefresh();
      } else {
        // Reagendar próxima verificação
        startPeriodicTokenCheck();
      }
    } catch (error) {
      console.error(
        "[AuthInit] Erro na verificação periódica de tokens:",
        error
      );

      // Tentar novamente em 5 minutos em caso de erro
      setTimeout(() => startPeriodicTokenCheck(), 5 * 60 * 1000);
    }
  }, checkInterval);

  if (currentConfig.enableDebugLogs) {
    console.log(
      `[AuthInit] Verificação periódica programada para ${currentConfig.tokenCheckInterval} minutos`
    );
  }
};

/**
 * Para todas as verificações e timers do sistema de autenticação
 * Deve ser chamado ao fazer logout ou quando não precisar mais do sistema
 */
export const stopAuthSystem = () => {
  cancelTokenRefresh();

  if (tokenCheckTimer) {
    clearTimeout(tokenCheckTimer);
    tokenCheckTimer = null;
  }

  if (currentConfig.enableDebugLogs) {
    console.log("[AuthInit] Sistema de autenticação parado");
  }
};

/**
 * Obtém a configuração atual do sistema de autenticação
 * @returns Configuração atual
 */
export const getAuthConfig = (): Required<AuthConfig> => {
  return { ...currentConfig };
};

/**
 * Atualiza a configuração do sistema de autenticação em tempo de execução
 * @param newConfig Novas configurações a serem aplicadas
 */
export const updateAuthConfig = (newConfig: Partial<AuthConfig>) => {
  currentConfig = { ...currentConfig, ...newConfig };

  if (currentConfig.enableDebugLogs) {
    console.log("[AuthInit] Configuração atualizada:", currentConfig);
  }
};

/**
 * Verifica o status atual do sistema de autenticação
 * Útil para debug e monitoramento
 * @returns Status detalhado do sistema
 */
export const getAuthSystemStatus = async () => {
  const tokens = await getCurrentTokens();
  const authenticated = await isAuthenticated();

  return {
    hasTokens: !!tokens,
    isAuthenticated: authenticated,
    config: currentConfig,
    hasActiveCheckTimer: tokenCheckTimer !== null,
    tokenExpiry: tokens?.accessToken
      ? (() => {
          const decoded = decodeJWT(tokens.accessToken);
          return decoded?.exp ? new Date(decoded.exp * 1000) : null;
        })()
      : null,
  };
};

/**
 * Decodifica JWT sem validação (apenas para extração de dados)
 */
const decodeJWT = (token: string) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};
