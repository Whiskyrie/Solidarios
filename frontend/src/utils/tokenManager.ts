/**
 * Gerenciador de tokens para renovação automática
 * Controla a expiração e renovação preventiva dos tokens JWT
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleRefreshTokens } from "./authUtils";

let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Decodifica um JWT para extrair informações sem validação
 * @param token Token JWT a ser decodificado
 * @returns Payload decodificado ou null se inválido
 */
const decodeJWT = (token: string) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error("[TokenManager] Erro ao decodificar token:", error);
    return null;
  }
};

/**
 * Programa renovação automática do token antes da expiração
 * Verifica a expiração do access token atual e agenda a renovação
 * para 5 minutos antes do vencimento
 */
export const scheduleTokenRefresh = async () => {
  try {
    const accessToken = await AsyncStorage.getItem("@auth_token");
    const refreshToken = await AsyncStorage.getItem("@refresh_token");

    if (!accessToken || !refreshToken) {
      console.log(
        "[TokenManager] Tokens não encontrados, cancelando agendamento"
      );
      return;
    }

    const decoded = decodeJWT(accessToken);
    if (!decoded?.exp) {
      console.log("[TokenManager] Token sem data de expiração válida");
      return;
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // Renovar 5 minutos antes da expiração (ou imediatamente se já expirou)
    const renewalTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);

    // Limpar timer anterior se existir
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    // Se o token já expirou ou expira muito em breve, renovar imediatamente
    if (renewalTime <= 0) {
      console.log(
        "[TokenManager] Token expirado ou prestes a expirar, renovando imediatamente"
      );
      try {
        await handleRefreshTokens(refreshToken);
        scheduleTokenRefresh(); // Reprogramar após renovação
      } catch (error) {
        console.error("[TokenManager] Falha na renovação imediata:", error);
      }
      return;
    }

    refreshTimer = setTimeout(async () => {
      try {
        console.log(
          "[TokenManager] Executando renovação automática programada"
        );
        const currentRefreshToken = await AsyncStorage.getItem(
          "@refresh_token"
        );

        if (currentRefreshToken) {
          await handleRefreshTokens(currentRefreshToken);
          // Reprogramar próxima renovação após sucesso
          scheduleTokenRefresh();
        }
      } catch (error) {
        console.error("[TokenManager] Falha na renovação automática:", error);
        // Em caso de erro, tentar novamente em 1 minuto
        setTimeout(() => scheduleTokenRefresh(), 60000);
      }
    }, renewalTime);

    console.log(
      `[TokenManager] Renovação programada para ${Math.round(
        renewalTime / 1000
      )}s (${new Date(Date.now() + renewalTime).toLocaleTimeString()})`
    );
  } catch (error) {
    console.error("[TokenManager] Erro ao programar renovação:", error);
  }
};

/**
 * Cancela a renovação automática programada
 * Deve ser chamado ao fazer logout ou quando não há mais necessidade
 */
export const cancelTokenRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
    console.log("[TokenManager] Renovação automática cancelada");
  }
};

/**
 * Verifica se o token atual está próximo do vencimento
 * @param token Token JWT a ser verificado
 * @param minutesBeforeExpiry Minutos antes do vencimento para considerar "próximo"
 * @returns true se está próximo do vencimento ou já expirou
 */
export const isTokenNearExpiry = (
  token: string,
  minutesBeforeExpiry: number = 5
): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded?.exp) return true;

  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const timeUntilExpiry = expirationTime - currentTime;
  const thresholdTime = minutesBeforeExpiry * 60 * 1000;

  return timeUntilExpiry <= thresholdTime;
};

/**
 * Verifica se o token está expirado
 * @param token Token JWT a ser verificado
 * @returns true se o token está expirado
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded?.exp) return true;

  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();

  return currentTime >= expirationTime;
};
