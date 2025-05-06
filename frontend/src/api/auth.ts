/**
 * Serviço de autenticação - comunicação com as rotas de auth do backend
 */
import apiClient from "./client";
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
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      loginDto
    );
    return response.data;
  },

  /**
   * Registrar um novo usuário
   * @param registerDto Objeto com dados para registro do usuário
   * @returns Resposta com tokens e dados do usuário
   */
  register: async (registerDto: RegisterDto): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/register",
      registerDto
    );
    return response.data;
  },

  /**
   * Renovar tokens de acesso usando refresh token
   * @param refreshToken O token de atualização
   * @returns Novos tokens de acesso e atualização
   */
  refreshTokens: async (refreshToken: string): Promise<TokensResponse> => {
    const refreshTokenDto: RefreshTokenDto = { refreshToken };
    const response = await apiClient.post<TokensResponse>(
      "/auth/refresh",
      refreshTokenDto
    );
    return response.data;
  },

  /**
   * Fazer logout (revogar tokens)
   * @returns Void - Resposta é vazia com status 204
   */
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  /**
   * Obter perfil do usuário autenticado
   * @returns Dados do usuário atual
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/profile");
    return response.data;
  },

  /**
   * Solicitar redefinição de senha
   * @param email Email do usuário que esqueceu a senha
   * @returns Void - Resposta é vazia com status 204
   */
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post("/auth/forgot-password", { email });
  },

  /**
   * Redefinir senha com token
   * @param token Token de redefinição recebido por email
   * @param newPassword Nova senha
   * @returns Void - Resposta é vazia com status 204
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post("/auth/reset-password", {
      token,
      password: newPassword,
    });
  },
};

export default AuthService;
