// frontend/src/utils/authManager.ts
/**
 * Gerenciador centralizado de autenticação - VERSÃO CORRIGIDA
 * Solução unificada para problemas de inicialização e sincronização
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../store";
import {
  setAuthState,
  clearAuthState,
  getProfile,
} from "../store/slices/authSlice";
import { getCurrentTokens } from "./authUtils";
import {
  scheduleTokenRefresh,
  cancelTokenRefresh,
  isTokenExpired,
} from "./tokenManager";
import { authDebugger } from "./authDebugger";
import {
  extractUserFromResponse,
  normalizeUserData,
  type GetProfileResult,
} from "../types/users.types";

interface AuthInitResult {
  success: boolean;
  isAuthenticated: boolean;
  user?: any;
  error?: string;
}

interface RefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

class AuthManager {
  private isInitializing = false;
  private initializationPromise: Promise<AuthInitResult> | null = null;
  private isRefreshing = false;

  /**
   * Inicialização principal do sistema de autenticação
   * Garante que seja executado apenas uma vez por sessão
   */
  async initialize(): Promise<AuthInitResult> {
    // Evitar múltiplas inicializações simultâneas
    if (this.isInitializing && this.initializationPromise) {
      console.log("[AuthManager] Aguardando inicialização em andamento...");
      return this.initializationPromise;
    }

    this.isInitializing = true;
    console.log("[AuthManager] Iniciando sistema de autenticação...");

    if (__DEV__) {
      await authDebugger.captureState("initialize_start");
    }

    this.initializationPromise = this.performInitialization();
    const result = await this.initializationPromise;

    this.isInitializing = false;

    if (__DEV__) {
      await authDebugger.captureState(
        result.success ? "initialize_success" : "initialize_failed"
      );
    }

    return result;
  }

  private async performInitialization(): Promise<AuthInitResult> {
    try {
      // 1. Verificar se existem tokens válidos
      const tokens = await getCurrentTokens();

      if (!tokens) {
        console.log("[AuthManager] Nenhum token encontrado");
        await this.clearAuthenticationState();
        return { success: true, isAuthenticated: false };
      }

      console.log("[AuthManager] Tokens encontrados, validando...");

      // 2. Verificar formato dos tokens
      if (!this.isValidTokenFormat(tokens.accessToken)) {
        console.log("[AuthManager] Tokens com formato inválido");
        await this.clearAuthenticationState();
        return { success: true, isAuthenticated: false };
      }

      // 3. Verificar se token está expirado ANTES de tentar usar
      let currentTokens = tokens;
      if (isTokenExpired(tokens.accessToken)) {
        console.log(
          "[AuthManager] Token expirado, tentando renovar antes de restaurar usuário"
        );

        const refreshResult = await this.safeRefreshTokens(tokens.refreshToken);
        if (!refreshResult.success) {
          console.log("[AuthManager] Falha ao renovar token expirado");
          await this.clearAuthenticationState();
          return { success: true, isAuthenticated: false };
        }

        // Usar os novos tokens
        currentTokens = {
          accessToken: refreshResult.accessToken!,
          refreshToken: refreshResult.refreshToken!,
        };
      }

      // 4. Configurar estado no Redux com tokens válidos
      store.dispatch(
        setAuthState({
          accessToken: currentTokens.accessToken,
          refreshToken: currentTokens.refreshToken,
          isAuthenticated: true,
        })
      );

      // 5. Tentar obter perfil do usuário
      const userRestoreResult = await this.restoreUserProfile();

      if (userRestoreResult.success) {
        // 6. Configurar renovação automática APENAS após sucesso total
        scheduleTokenRefresh();
        console.log("[AuthManager] Inicialização completa com sucesso");

        return {
          success: true,
          isAuthenticated: true,
          user: userRestoreResult.user,
        };
      } else {
        console.log("[AuthManager] Falha ao restaurar estado do usuário");
        await this.clearAuthenticationState();
        return {
          success: false,
          isAuthenticated: false,
          error: userRestoreResult.error,
        };
      }
    } catch (error) {
      console.error("[AuthManager] Erro durante inicialização:", error);
      await this.clearAuthenticationState();
      return {
        success: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Renovação segura de tokens sem interceptors
   */
  private async safeRefreshTokens(
    refreshToken: string
  ): Promise<RefreshResult> {
    if (this.isRefreshing) {
      console.log("[AuthManager] Renovação já em andamento, aguardando...");

      // Aguardar renovação atual finalizar
      let attempts = 0;
      const maxAttempts = 10; // 10 segundos máximo

      while (this.isRefreshing && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      if (this.isRefreshing) {
        return { success: false, error: "Timeout na renovação" };
      }

      // Verificar se tokens foram atualizados
      const tokens = await getCurrentTokens();
      return tokens
        ? {
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }
        : { success: false, error: "Tokens não encontrados após renovação" };
    }

    this.isRefreshing = true;

    try {
      console.log("[AuthManager] Iniciando renovação segura de tokens");

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("URL da API não configurada");
      }

      // Fazer chamada direta ao endpoint sem passar pelo interceptor
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Extrair tokens da resposta (suporte a diferentes formatos)
      const accessToken = data.data?.accessToken || data.accessToken;
      const newRefreshToken = data.data?.refreshToken || data.refreshToken;

      if (!accessToken || !newRefreshToken) {
        console.error("[AuthManager] Resposta de refresh incompleta:", data);
        throw new Error("Resposta de refresh incompleta do servidor");
      }

      // Salvar tokens no storage
      await AsyncStorage.setItem("@auth_token", accessToken);
      await AsyncStorage.setItem("@refresh_token", newRefreshToken);

      console.log("[AuthManager] Tokens renovados com sucesso");

      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error("[AuthManager] Erro na renovação segura:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro na renovação",
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Restaura o perfil do usuário usando a ação Redux getProfile
   */
  private async restoreUserProfile(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      console.log("[AuthManager] Obtendo perfil do usuário via Redux...");

      // Usar a ação getProfile do Redux que já possui toda a lógica
      const profileResult: GetProfileResult = await store
        .dispatch(getProfile())
        .unwrap();

      console.log(
        "[AuthManager] Resposta do getProfile:",
        JSON.stringify(profileResult, null, 2)
      );

      // Extrair dados do usuário usando função utilitária
      const user = extractUserFromResponse(profileResult);

      if (!user) {
        console.error(
          "[AuthManager] Não foi possível extrair dados do usuário da resposta"
        );
        throw new Error("Estrutura de dados do usuário não reconhecida");
      }

      // Normalizar dados do usuário
      const normalizedUser = normalizeUserData(user);

      if (!normalizedUser) {
        console.error(
          "[AuthManager] Falha ao normalizar dados do usuário:",
          user
        );
        throw new Error(
          "Dados essenciais do usuário não encontrados ou inválidos"
        );
      }

      console.log("[AuthManager] Perfil do usuário obtido com sucesso:", {
        id: normalizedUser.id,
        email: normalizedUser.email,
        name: normalizedUser.name,
        role: normalizedUser.role,
      });

      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error("[AuthManager] Erro ao obter perfil via Redux:", error);

      // Verificar se é erro de token expirado
      if (
        error instanceof Error &&
        (error.message.includes("401") ||
          error.message.includes("token") ||
          error.message.includes("unauthorized"))
      ) {
        return {
          success: false,
          error: "Token inválido ou expirado",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Falha ao obter perfil",
      };
    }
  }

  /**
   * Limpa completamente o estado de autenticação
   */
  private async clearAuthenticationState(): Promise<void> {
    try {
      console.log("[AuthManager] Limpando estado de autenticação...");

      // Limpar storage
      await Promise.all([
        AsyncStorage.removeItem("@auth_token"),
        AsyncStorage.removeItem("@refresh_token"),
      ]);

      // Limpar Redux
      store.dispatch(clearAuthState());

      // Cancelar renovação automática
      cancelTokenRefresh();

      console.log("[AuthManager] Estado de autenticação limpo");
    } catch (error) {
      console.error("[AuthManager] Erro ao limpar estado:", error);
    }
  }

  /**
   * Valida formato básico de JWT
   */
  private isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== "string") {
      return false;
    }

    const parts = token.split(".");
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  /**
   * Força logout completo do sistema
   */
  async forceLogout(): Promise<void> {
    console.log("[AuthManager] Executando logout forçado");

    // Reset flags de controle
    this.isRefreshing = false;
    this.isInitializing = false;
    this.initializationPromise = null;

    // Limpar estado de autenticação
    await this.clearAuthenticationState();

    if (__DEV__) {
      await authDebugger.captureState("after_force_logout");
    }
  }

  /**
   * Verifica se o sistema está inicializado e autenticado
   */
  async isReady(): Promise<boolean> {
    if (this.isInitializing && this.initializationPromise) {
      await this.initializationPromise;
    }

    const state = store.getState().auth;
    return state.isAuthenticated && state.user !== null;
  }

  /**
   * Verifica se há uma renovação em andamento
   */
  isRefreshingTokens(): boolean {
    return this.isRefreshing;
  }

  /**
   * Verifica se há uma inicialização em andamento
   */
  isInitializingAuth(): boolean {
    return this.isInitializing;
  }

  /**
   * Obtém informações de debug do sistema
   */
  getDebugInfo(): {
    isInitializing: boolean;
    isRefreshing: boolean;
    hasInitPromise: boolean;
  } {
    return {
      isInitializing: this.isInitializing,
      isRefreshing: this.isRefreshing,
      hasInitPromise: this.initializationPromise !== null,
    };
  }
}

// Instância singleton
export const authManager = new AuthManager();

// Exportar para uso em desenvolvimento/debug
if (__DEV__) {
  (window as any).authManager = authManager;
}
