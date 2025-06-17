/**
 * Serviço de autenticação - comunicação com as rotas de auth do backend
 */
import api from "./api";
import {
  LoginDto,
  RegisterDto,
  LoginResponse,
  TokensResponse,
  RefreshTokenDto,
} from "../types/auth.types";
import { User, UpdateUserRequest } from "../types/users.types";

// Namespace para agrupar as funções do serviço
const AuthService = {
  /**
   * Autenticar um usuário com email e senha
   * @param loginDto Objeto com credenciais do usuário
   * @returns Resposta com tokens e dados do usuário
   */
  login: async (loginDto: LoginDto): Promise<LoginResponse> => {
    console.log("[AuthService] Enviando requisição de login para a API");
    try {
      console.log("[AuthService] Tentando conexão com a API...");
      const response = await api.post<any>("/auth/login", loginDto);

      // Extrair os dados da estrutura correta
      let authData;

      if (response.data.data && response.data.data.accessToken) {
        // Formato da resposta real do servidor
        console.log("[AuthService] Extraindo dados da estrutura aninhada");
        authData = {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          user: response.data.data.user,
        };
      } else {
        // Formato esperado originalmente
        authData = response.data;
      }

      console.log("[AuthService] Login bem-sucedido");
      return authData;
    } catch (error: any) {
      console.error(
        "[AuthService] Erro na requisição de login:",
        error.response?.status
      );
      console.error("[AuthService] Detalhes do erro:", error.message);
      if (error.response) {
        console.error(
          "[AuthService] Resposta do servidor:",
          error.response.data
        );
      }
      throw error;
    }
  },

  /**
   * Registrar um novo usuário
   * @param registerDto Objeto com dados para registro do usuário
   * @returns Resposta com tokens e dados do usuário
   */
  register: async (registerDto: RegisterDto): Promise<LoginResponse> => {
    console.log("[AuthService] Enviando requisição de registro para a API");

    try {
      const response = await api.post("/auth/register", registerDto);

      console.log("[AuthService] Resposta do registro recebida:", {
        status: response.status,
        success: true,
      });

      // Extrair os dados da estrutura correta
      let authData;

      if (response.data.data && response.data.data.accessToken) {
        // Formato da resposta real do servidor
        console.log("[AuthService] Extraindo dados da estrutura aninhada");
        authData = {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          user: response.data.data.user,
        };
      } else {
        // Formato esperado originalmente
        authData = response.data;
      }

      console.log("[AuthService] Dados processados:", {
        hasUser: !!authData.user,
        hasToken: !!authData.accessToken,
      });

      // Verificar se os dados processados contêm os valores necessários
      if (!authData.accessToken || !authData.refreshToken || !authData.user) {
        console.error("[AuthService] Resposta incompleta da API:", authData);
        throw new Error("Resposta de registro incompleta do servidor");
      }

      return authData;
    } catch (error: any) {
      console.error(
        "[AuthService] Erro na requisição de registro:",
        error.response?.status
      );
      console.error("[AuthService] Detalhes do erro:", error.message);
      console.error(
        "[AuthService] URL completa:",
        api.defaults.baseURL + "/auth/register"
      );
      if (error.response) {
        console.error(
          "[AuthService] Resposta do servidor:",
          error.response.data
        );
      }
      throw error;
    }
  },

  /**
   * Renovar tokens de acesso usando refresh token
   * @param refreshToken O token de atualização
   * @returns Novos tokens de acesso e atualização
   */
  refreshTokens: async (refreshToken: string): Promise<TokensResponse> => {
    console.log("[AuthService] Tentando renovar token");
    try {
      const refreshTokenDto: RefreshTokenDto = { refreshToken };
      const response = await api.post<TokensResponse>(
        "/auth/refresh",
        refreshTokenDto
      );
      console.log("[AuthService] Token renovado com sucesso");
      return response.data;
    } catch (error: any) {
      console.error(
        "[AuthService] Erro ao renovar token:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * Fazer logout (revogar tokens)
   * @returns Void - Resposta é vazia com status 204
   */
  logout: async (): Promise<void> => {
    console.log("[AuthService] Enviando requisição de logout");
    try {
      await api.post("/auth/logout");
      console.log("[AuthService] Logout bem-sucedido");
    } catch (error: any) {
      console.error(
        "[AuthService] Erro no logout:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * Obter perfil do usuário autenticado
   * @returns Dados do usuário atual
   */
  getProfile: async (): Promise<User> => {
    console.log("[AuthService] Buscando perfil do usuário");
    try {
      const response = await api.get<User>("/auth/profile");
      console.log("[AuthService] Perfil obtido com sucesso:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "[AuthService] Erro ao buscar perfil:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * Atualizar perfil do usuário
   * @param userId ID do usuário a ser atualizado
   * @param data Dados para atualização
   * @returns Dados do usuário atualizado
   */
  updateProfile: async (
    userId: string,
    data: UpdateUserRequest
  ): Promise<User> => {
    console.log("[AuthService] Atualizando perfil do usuário:", userId);
    try {
      const response = await api.put<User>(`/users/${userId}`, data);

      // Verificar se a resposta está aninhada
      let userData;
      if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        // Formato aninhado
        userData = (response.data as any).data;
      } else {
        // Formato direto
        userData = response.data;
      }

      console.log("[AuthService] Perfil atualizado com sucesso");
      return userData;
    } catch (error: any) {
      console.error(
        "[AuthService] Erro ao atualizar perfil:",
        error.response?.data || error.message
      );
      if (error.response) {
        console.error("[AuthService] Status do erro:", error.response.status);
        console.error("[AuthService] Dados do erro:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Solicitar redefinição de senha
   * @param email Email do usuário que esqueceu a senha
   * @returns Void - Resposta é vazia com status 204
   */
  forgotPassword: async (email: string): Promise<void> => {
    console.log("[AuthService] Solicitando redefinição de senha para:", email);
    try {
      await api.post("/auth/forgot-password", { email });
      console.log(
        "[AuthService] Solicitação de redefinição enviada com sucesso"
      );
    } catch (error: any) {
      console.error(
        "[AuthService] Erro ao solicitar redefinição:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * Redefinir senha com token
   * @param token Token de redefinição recebido por email
   * @param newPassword Nova senha
   * @returns Void - Resposta é vazia com status 204
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    console.log("[AuthService] Redefinindo senha com token");
    try {
      await api.post("/auth/reset-password", {
        token,
        password: newPassword,
      });
      console.log("[AuthService] Senha redefinida com sucesso");
    } catch (error: any) {
      console.error(
        "[AuthService] Erro ao redefinir senha:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default AuthService;
