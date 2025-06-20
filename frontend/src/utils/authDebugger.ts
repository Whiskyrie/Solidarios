/**
 * Ferramentas de debug para sistema de autenticação
 * Útil para identificar problemas em produção
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../store";
import { getCurrentTokens } from "./authUtils";

interface AuthDebugInfo {
  timestamp: string;
  hasTokensInStorage: boolean;
  tokensValid: boolean;
  reduxState: {
    isAuthenticated: boolean;
    hasUser: boolean;
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
  };
  tokenInfo?: {
    accessTokenLength: number;
    refreshTokenLength: number;
    accessTokenParts: number;
    isAccessTokenExpired: boolean;
  };
}

class AuthDebugger {
  private logs: AuthDebugInfo[] = [];
  private maxLogs = 10;

  async captureState(context: string = "manual"): Promise<AuthDebugInfo> {
    try {
      const tokens = await getCurrentTokens();
      const reduxState = store.getState().auth;

      const debugInfo: AuthDebugInfo = {
        timestamp: new Date().toISOString(),
        hasTokensInStorage: !!tokens,
        tokensValid: this.validateTokens(tokens),
        reduxState: {
          isAuthenticated: reduxState.isAuthenticated,
          hasUser: !!reduxState.user,
          hasAccessToken: !!reduxState.accessToken,
          hasRefreshToken: !!reduxState.refreshToken,
        },
      };

      if (tokens) {
        debugInfo.tokenInfo = {
          accessTokenLength: tokens.accessToken.length,
          refreshTokenLength: tokens.refreshToken.length,
          accessTokenParts: tokens.accessToken.split(".").length,
          isAccessTokenExpired: this.isTokenExpired(tokens.accessToken),
        };
      }

      this.addLog(debugInfo);
      console.log(`[AuthDebugger] Estado capturado (${context}):`, debugInfo);

      return debugInfo;
    } catch (error) {
      console.error("[AuthDebugger] Erro ao capturar estado:", error);
      throw error;
    }
  }

  private validateTokens(
    tokens: { accessToken: string; refreshToken: string } | null
  ): boolean {
    if (!tokens) return false;

    // Verificar formato JWT básico
    const accessTokenParts = tokens.accessToken.split(".");
    return (
      accessTokenParts.length === 3 &&
      tokens.refreshToken.length > 0 &&
      accessTokenParts.every((part) => part.length > 0)
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  private addLog(info: AuthDebugInfo) {
    this.logs.push(info);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): AuthDebugInfo[] {
    return [...this.logs];
  }

  async generateReport(): Promise<string> {
    const currentState = await this.captureState("report");
    const logs = this.getLogs();

    let report = "=== RELATÓRIO DE DEBUG DE AUTENTICAÇÃO ===\n\n";

    report += "ESTADO ATUAL:\n";
    report += `- Timestamp: ${currentState.timestamp}\n`;
    report += `- Tokens no storage: ${currentState.hasTokensInStorage}\n`;
    report += `- Tokens válidos: ${currentState.tokensValid}\n`;
    report += `- Redux autenticado: ${currentState.reduxState.isAuthenticated}\n`;
    report += `- Tem usuário: ${currentState.reduxState.hasUser}\n`;

    if (currentState.tokenInfo) {
      report += `- Token expirado: ${currentState.tokenInfo.isAccessTokenExpired}\n`;
      report += `- Partes do token: ${currentState.tokenInfo.accessTokenParts}\n`;
    }

    report += "\nHISTÓRICO DE ESTADOS:\n";
    logs.slice(-5).forEach((log, index) => {
      report += `${index + 1}. ${log.timestamp} - Auth: ${
        log.reduxState.isAuthenticated
      }, User: ${log.reduxState.hasUser}\n`;
    });

    return report;
  }

  async exportDebugData(): Promise<object> {
    const currentState = await this.captureState("export");

    return {
      currentState,
      logs: this.getLogs(),
      storageKeys: await this.getStorageKeys(),
      reduxState: store.getState().auth,
    };
  }

  private async getStorageKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(
        (key) => key.includes("auth") || key.includes("token")
      );
    } catch {
      return [];
    }
  }

  clearLogs() {
    this.logs = [];
    console.log("[AuthDebugger] Logs limpos");
  }
}

export const authDebugger = new AuthDebugger();

// Hook para usar no desenvolvimento
export const useAuthDebug = () => {
  const captureState = (context?: string) => authDebugger.captureState(context);
  const getLogs = () => authDebugger.getLogs();
  const generateReport = () => authDebugger.generateReport();

  return {
    captureState,
    getLogs,
    generateReport,
    exportData: () => authDebugger.exportDebugData(),
    clearLogs: () => authDebugger.clearLogs(),
  };
};
