/**
 * Redux slice para gerenciamento do estado de autenticação
 * Integrado com o sistema de renovação automática de tokens
 */
import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createAction,
} from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoginDto, RegisterDto, AuthState } from "../../types/auth.types";
import { UpdateUserRequest } from "../../types/users.types";
import AuthService from "../../api/auth";
import {
  scheduleTokenRefresh,
  cancelTokenRefresh,
  isTokenExpired,
} from "../../utils/tokenManager";
import { refreshTokens as refreshTokensUtil } from "../../utils/tokenUtils";

const validateTokenPayload = (token: string): boolean => {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));

    // Verificar campos obrigatórios
    if (!payload.sub || !payload.email) {
      console.error("[authSlice] Token sem campos obrigatórios:", {
        hasSub: !!payload.sub,
        hasEmail: !!payload.email,
        sub: payload.sub,
        email: payload.email,
      });
      return false;
    }

    // Verificar se sub é um UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(payload.sub)) {
      console.error("[authSlice] Token com UUID inválido:", {
        sub: payload.sub,
        typeofSub: typeof payload.sub,
      });
      return false;
    }

    console.log("[authSlice] Token validado com sucesso:", {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    return true;
  } catch (error) {
    console.error("[authSlice] Erro ao validar token:", error);
    return false;
  }
};

const clearAuthenticationState = (state: any, reason: string) => {
  console.warn(`[authSlice] Limpando estado de autenticação: ${reason}`);

  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.isAuthenticated = false;
  state.isLoading = false;
  state.error = reason;

  cancelTokenRefresh();
};

// Estado inicial
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Thunks (ações assíncronas)
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginDto, { rejectWithValue }) => {
    try {
      console.log("[authSlice] Iniciando requisição de login");
      const response = await AuthService.login(credentials);
      console.log("[authSlice] Login bem-sucedido, tokens recebidos");

      // Salvar tokens no armazenamento persistente
      await AsyncStorage.setItem("@auth_token", response.accessToken);
      await AsyncStorage.setItem("@refresh_token", response.refreshToken);
      console.log("[authSlice] Tokens salvos no AsyncStorage");

      return response;
    } catch (error: any) {
      console.error(
        "[authSlice] Erro no login:",
        error.response?.data || error.message || error
      );
      return rejectWithValue(
        error.response?.data?.message || "Erro ao realizar login"
      );
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData: RegisterDto, { rejectWithValue }) => {
    try {
      console.log("[authSlice] Iniciando requisição de registro");
      console.log("[authSlice] Dados:", {
        ...userData,
        password: "***ESCONDIDO***",
      });

      const response = await AuthService.register(userData);
      console.log("[authSlice] Registro bem-sucedido, tokens recebidos");

      // Verificação adicional para garantir que os tokens existem
      if (!response.accessToken || !response.refreshToken) {
        console.error("[authSlice] Tokens ausentes na resposta:", response);
        return rejectWithValue("Resposta de autenticação inválida do servidor");
      }

      // Salvar tokens no armazenamento persistente
      await AsyncStorage.setItem("@auth_token", response.accessToken);
      await AsyncStorage.setItem("@refresh_token", response.refreshToken);
      console.log("[authSlice] Tokens salvos no AsyncStorage após registro");

      return response;
    } catch (error: any) {
      console.error(
        "[authSlice] Erro no registro:",
        error.response?.data || error.message || error
      );

      // Mensagem de erro mais descritiva para problemas específicos
      if (error.message === "Resposta de registro incompleta do servidor") {
        return rejectWithValue(
          "O servidor não retornou os dados de autenticação necessários. Contate o administrador."
        );
      }

      if (error.message === "Network Error") {
        console.error(
          "[authSlice] Erro de conexão com o servidor. Verifique se o backend está rodando."
        );
        return rejectWithValue(
          "Erro de conexão. Verifique sua internet ou se o servidor está disponível."
        );
      }

      return rejectWithValue(
        error.response?.data?.message || "Erro ao registrar usuário"
      );
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Chamar API para revogar tokens
      await AuthService.logout();

      // Remover tokens do armazenamento
      await AsyncStorage.removeItem("@auth_token");
      await AsyncStorage.removeItem("@refresh_token");

      return true;
    } catch (error: any) {
      // Mesmo em caso de erro, limpar tokens locais
      await AsyncStorage.removeItem("@auth_token");
      await AsyncStorage.removeItem("@refresh_token");

      return rejectWithValue(
        error.response?.data?.message || "Erro ao realizar logout"
      );
    }
  }
);

export const refreshTokens = createAsyncThunk(
  "auth/refreshTokens",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentRefreshToken = state.auth.refreshToken;

      if (!currentRefreshToken) {
        throw new Error("Refresh token não disponível");
      }

      console.log("[authSlice] Renovando tokens automaticamente...");
      const tokens = await refreshTokensUtil(currentRefreshToken);

      // Salvar tokens no armazenamento
      await AsyncStorage.setItem("@auth_token", tokens.accessToken);
      await AsyncStorage.setItem("@refresh_token", tokens.refreshToken);

      console.log("[authSlice] Tokens renovados com sucesso");
      return tokens;
    } catch (error: any) {
      console.error("[authSlice] Erro ao renovar tokens:", error);
      // Em caso de erro, limpar tokens
      await AsyncStorage.removeItem("@auth_token");
      await AsyncStorage.removeItem("@refresh_token");
      return rejectWithValue(
        error.response?.data?.message || "Erro ao renovar tokens"
      );
    }
  }
);

export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.getProfile();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Erro ao obter perfil"
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (
    { userId, data }: { userId: string; data: UpdateUserRequest },
    { rejectWithValue }
  ) => {
    try {
      console.log("[authSlice] Atualizando perfil do usuário:", userId);
      const response = await AuthService.updateProfile(userId, data);
      console.log("[authSlice] Perfil atualizado com sucesso");
      return response;
    } catch (error: any) {
      console.error(
        "[authSlice] Erro ao atualizar perfil:",
        error.response?.data || error.message || error
      );
      return rejectWithValue(
        error.response?.data?.message || "Erro ao atualizar perfil"
      );
    }
  }
);

export const restoreAuthState = createAsyncThunk(
  "auth/restoreAuthState",
  async (_, { dispatch }) => {
    try {
      const accessToken = await AsyncStorage.getItem("@auth_token");
      const refreshToken = await AsyncStorage.getItem("@refresh_token");

      if (accessToken && refreshToken) {
        // Verificar se token ainda é válido
        const isExpired = isTokenExpired(accessToken);

        if (isExpired) {
          console.log(
            "[authSlice] Token expirado na inicialização, tentando renovar"
          );
          // Token expirado, tentar renovar imediatamente
          try {
            await dispatch(refreshTokens()).unwrap();
          } catch (refreshError) {
            console.error(
              "[authSlice] Falha ao renovar token na inicialização:",
              refreshError
            );
            // Se falhar o refresh, limpar tudo
            await AsyncStorage.removeItem("@auth_token");
            await AsyncStorage.removeItem("@refresh_token");
            throw new Error("Sessão expirada");
          }
        }

        // Tentar obter perfil para validar autenticação
        try {
          await dispatch(getProfile()).unwrap();

          // Se chegou até aqui, a autenticação é válida
          const currentAccessToken = await AsyncStorage.getItem("@auth_token");
          const currentRefreshToken = await AsyncStorage.getItem(
            "@refresh_token"
          );

          return {
            accessToken: currentAccessToken,
            refreshToken: currentRefreshToken,
            isAuthenticated: true,
          };
        } catch (profileError) {
          console.error(
            "[authSlice] Falha ao obter perfil na inicialização:",
            profileError
          );
          // Se falhar ao obter perfil, limpar tokens
          await AsyncStorage.removeItem("@auth_token");
          await AsyncStorage.removeItem("@refresh_token");
          throw new Error("Falha na validação da sessão");
        }
      }

      return {
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      };
    } catch (error) {
      console.error(
        "[authSlice] Erro ao restaurar estado de autenticação:",
        error
      );
      return {
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      };
    }
  }
);

// Ações adicionais para o AuthManager
export const setAuthState = createAction<{
  accessToken: string;
  refreshToken: string;
  isAuthenticated: boolean;
}>("auth/setAuthState");

export const clearAuthState = createAction("auth/clearAuthState");

export const setUser = createAction<any>("auth/setUser");

export const updateTokensAction = createAction<{
  accessToken: string;
  refreshToken: string;
}>("auth/updateTokens");

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Ação para forçar logout em caso de erro de autenticação
    forceLogout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = "Sessão expirada. Faça login novamente.";

      // Cancelar renovação automática no logout forçado
      cancelTokenRefresh();
      console.log(
        "[authSlice] Logout forçado e renovação automática cancelada"
      );
    },
    // Nova ação para atualizar tokens diretamente
    updateTokens: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      // Programar próxima renovação automaticamente
      scheduleTokenRefresh();
      console.log(
        "[authSlice] Tokens atualizados e próxima renovação programada"
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken } = action.payload || {};

        if (!user || !accessToken || !refreshToken) {
          console.error(
            "[authSlice] Dados de login incompletos:",
            action.payload
          );
          clearAuthenticationState(state, "Dados de login incompletos");
          return;
        }

        if (!validateTokenPayload(accessToken)) {
          console.error("[authSlice] Token de login inválido");
          clearAuthenticationState(state, "Token de login inválido");
          return;
        }

        try {
          const tokenPayload = JSON.parse(atob(accessToken.split(".")[1]));
          if (tokenPayload.sub !== user.id) {
            console.error("[authSlice] Inconsistência login token/user:", {
              tokenSub: tokenPayload.sub,
              userId: user.id,
            });
            clearAuthenticationState(
              state,
              "Inconsistência token/user no login"
            );
            return;
          }
        } catch (error) {
          console.error(
            "[authSlice] Erro ao validar consistência login:",
            error
          );
        }

        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;

        // Programar renovação automática após login bem-sucedido
        scheduleTokenRefresh();

        console.log("[authSlice] Login validado e realizado com sucesso:", {
          userId: user.id,
          email: user.email,
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
        cancelTokenRefresh();
      })

      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;

        // Programar renovação automática após registro bem-sucedido
        scheduleTokenRefresh();
        console.log(
          "[authSlice] Registro realizado e renovação automática programada"
        );
      })
      .addCase(register.rejected, (state, action) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;
        cancelTokenRefresh();
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;

        // Cancelar renovação automática após logout
        cancelTokenRefresh();
        console.log(
          "[authSlice] Logout realizado e renovação automática cancelada"
        );
      })
      .addCase(logout.rejected, (state, action) => {
        // Mesmo em caso de erro no logout, limpar estado local
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;

        // Cancelar renovação automática mesmo em caso de erro
        cancelTokenRefresh();
        console.log(
          "[authSlice] Logout forçado e renovação automática cancelada"
        );
      })

      // Refresh Tokens - casos atualizados
      .addCase(refreshTokens.pending, (state) => {
        // Não mostrar loading para renovação automática de tokens
        state.error = null;
      })

      .addCase(refreshTokens.fulfilled, (state, action) => {
        console.log("[authSlice] Tokens renovados recebidos:", {
          hasAccessToken: !!action.payload?.accessToken,
          hasRefreshToken: !!action.payload?.refreshToken,
        });

        const { accessToken, refreshToken } = action.payload || {};

        if (!accessToken || !refreshToken) {
          console.error(
            "[authSlice] Tokens renovados inválidos:",
            action.payload
          );
          clearAuthenticationState(state, "Tokens renovados inválidos");
          return;
        }

        if (!validateTokenPayload(accessToken)) {
          console.error("[authSlice] Access token renovado inválido");
          clearAuthenticationState(state, "Access token renovado inválido");
          return;
        }

        if (state.accessToken === accessToken) {
          console.warn(
            "[authSlice] Token renovado é idêntico ao anterior - possível problema"
          );
        }

        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isLoading = false;
        state.error = null;

        scheduleTokenRefresh();

        console.log("[authSlice] Tokens renovados e validados com sucesso");
      })
      .addCase(refreshTokens.rejected, (state, action) => {
        // Se falhar ao renovar tokens, fazer logout
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = action.payload as string;

        // Cancelar renovação automática
        cancelTokenRefresh();
        console.log(
          "[authSlice] Falha na renovação de tokens, logout automático"
        );
      })

      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })

      .addCase(getProfile.fulfilled, (state, action) => {
        if (!action.payload) {
          console.error("[authSlice] Perfil vazio recebido");
          state.isLoading = false;
          state.error = "Dados do perfil inválidos";
          return;
        }

        if (!action.payload.id) {
          console.error("[authSlice] Perfil sem ID válido:", action.payload);
          state.isLoading = false;
          state.error = "Perfil sem ID válido";
          return;
        }

        if (state.accessToken) {
          try {
            const tokenPayload = JSON.parse(
              atob(state.accessToken.split(".")[1])
            );
            if (tokenPayload.sub !== action.payload.id) {
              console.error(
                "[authSlice] Inconsistência entre token e perfil:",
                {
                  tokenSub: tokenPayload.sub,
                  profileId: action.payload.id,
                }
              );
              clearAuthenticationState(
                state,
                "Inconsistência entre token e perfil"
              );
              return;
            }
          } catch (error) {
            console.error(
              "[authSlice] Erro ao validar consistência token/perfil:",
              error
            );
          }
        }

        state.user = action.payload;
        state.isLoading = false;
        state.error = null;

        console.log("[authSlice] Perfil validado e carregado:", {
          userId: action.payload.id,
          email: action.payload.email,
        });
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        state.isLoading = false;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Restore Auth State
      .addCase(restoreAuthState.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreAuthState.fulfilled, (state, action) => {
        if (action.payload.isAuthenticated) {
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;

          // Programar renovação automática após restaurar estado
          scheduleTokenRefresh();
          console.log(
            "[authSlice] Estado de autenticação restaurado e renovação automática programada"
          );
        } else {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          cancelTokenRefresh();
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(restoreAuthState.rejected, (state, _action) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null; // Não mostrar erro na restauração
        cancelTokenRefresh();
        console.log(
          "[authSlice] Falha ao restaurar estado, usuário não autenticado"
        );
      })
      .addCase(setAuthState, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(clearAuthState, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(setUser, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateTokensAction, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      });
  },
});

export const { clearError, setLoading, forceLogout, updateTokens } =
  authSlice.actions;
export default authSlice.reducer;
