// frontend/src/utils/profileExtractor.ts
import { User, UserRole } from "../types/users.types";

/**
 * Extrai dados do usuário de diferentes formatos de resposta da API
 * @param response Resposta da API em qualquer formato
 * @returns User limpo ou null se inválido
 */
export const extractUserFromApiResponse = (response: any): User | null => {
  try {
    // Caso 1: Resposta da API { data: User, statusCode, message, timestamp }
    if (response?.data && typeof response.data === "object") {
      const userData = response.data;

      // Validar se tem os campos obrigatórios de User
      if (userData.id && userData.email && userData.name) {
        return normalizeUserData(userData);
      }
    }

    // Caso 2: User direto (fallback)
    if (response?.id && response?.email && response?.name) {
      return normalizeUserData(response);
    }

    console.error(
      "[extractUserFromApiResponse] Formato de resposta inválido:",
      {
        hasData: !!response?.data,
        hasId: !!response?.id,
        hasEmail: !!response?.email,
        responseType: typeof response,
        response: response,
      }
    );

    return null;
  } catch (error) {
    console.error(
      "[extractUserFromApiResponse] Erro ao extrair usuário:",
      error
    );
    return null;
  }
};

/**
 * Normaliza dados do usuário garantindo estrutura consistente
 * @param userData Dados brutos do usuário
 * @returns User normalizado
 */
export const normalizeUserData = (userData: any): User => {
  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    phone: userData.phone || undefined,
    address: userData.address || undefined,
    profileImage: userData.profileImage || undefined,
    userType: userData.userType || undefined,
    role: validateUserRole(userData.role),
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updatedAt || new Date().toISOString(),
  };
};

/**
 * Valida e normaliza role do usuário
 * @param role Role bruto da API
 * @returns UserRole válido
 */
export const validateUserRole = (role: any): UserRole => {
  if (Object.values(UserRole).includes(role)) {
    return role;
  }

  console.warn(
    "[validateUserRole] Role inválido, usando DOADOR como padrão:",
    role
  );
  return UserRole.DOADOR;
};

/**
 * Valida se um objeto é um User válido
 * @param user Objeto a ser validado
 * @returns true se é um User válido
 */
export const isValidUser = (user: any): user is User => {
  return !!(
    user &&
    typeof user === "object" &&
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.name === "string" &&
    Object.values(UserRole).includes(user.role)
  );
};

/**
 * Extrai dados de login/registro da resposta da API
 * @param response Resposta da API de login/registro
 * @returns Dados de autenticação limpos
 */
export const extractAuthDataFromApiResponse = (response: any) => {
  try {
    // Caso 1: Resposta aninhada { data: { user, accessToken, refreshToken } }
    if (response?.data?.accessToken && response?.data?.user) {
      return {
        user: normalizeUserData(response.data.user),
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }

    // Caso 2: Resposta direta { user, accessToken, refreshToken }
    if (response?.accessToken && response?.user) {
      return {
        user: normalizeUserData(response.user),
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
    }

    console.error(
      "[extractAuthDataFromApiResponse] Formato inválido:",
      response
    );
    return null;
  } catch (error) {
    console.error("[extractAuthDataFromApiResponse] Erro:", error);
    return null;
  }
};
