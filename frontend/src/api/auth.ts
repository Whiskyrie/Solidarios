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
import { User } from "../types/users.types";

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
      const response = await api.post<LoginResponse>("/auth/login", loginDto);
      console.log("[AuthService] Resposta do login recebida:", {
        status: response.status,
        success: true,
        hasUser: !!response.data.user,
        hasToken: !!response.data.accessToken,
      });
      return response.data;
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
      } else {
        console.error(
          "[AuthService] Não foi possível conectar ao servidor. Verifique se o backend está rodando e acessível."
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
      console.log("[AuthService] Tentando conexão com a API...");
      const response = await api.post<LoginResponse>(
        "/auth/register",
        registerDto
      );
      console.log("[AuthService] Resposta do registro recebida:", {
        status: response.status,
        success: true,
        hasUser: !!response.data.user,
        hasToken: !!response.data.accessToken,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "[AuthService] Erro na requisição de registro:",
        error.response?.status
      );
      console.error("[AuthService] Detalhes do erro:", error.message);
      if (error.response) {
        console.error(
          "[AuthService] Resposta do servidor:",
          error.response.data
        );
      } else {
        console.error(
          "[AuthService] Não foi possível conectar ao servidor. Verifique se:"
        );
        console.error(
          "- O backend está rodando (npm run start:dev na pasta backend)"
        );
        console.error("- A URL base está correta para sua plataforma");
        console.error("- Não há bloqueio de firewall ou rede");
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
   * Solicitar redefinição de senha
   * @param email Email do usuário que esqueceu a senha
   * @returns Void - Resposta é vazia com status 204
   */
  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
  },

  /**
   * Redefinir senha com token
   * @param token Token de redefinição recebido por email
   * @param newPassword Nova senha
   * @returns Void - Resposta é vazia com status 204
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post("/auth/reset-password", {
      token,
      password: newPassword,
    });
  },
};

export default AuthService;
