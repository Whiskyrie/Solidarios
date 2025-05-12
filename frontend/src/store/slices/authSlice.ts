/**
 * Redux slice para gerenciamento do estado de autenticação
 */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LoginDto,
  RegisterDto,
  AuthState,
  LoginResponse,
  TokensResponse,
} from "../../types/auth.types";
import AuthService from "../../api/auth";

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
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const response = await AuthService.refreshTokens(refreshToken);

      // Atualizar tokens no armazenamento
      await AsyncStorage.setItem("@auth_token", response.accessToken);
      await AsyncStorage.setItem("@refresh_token", response.refreshToken);

      return response;
    } catch (error: any) {
      // Em caso de erro ao atualizar token, fazer logout
      await AsyncStorage.removeItem("@auth_token");
      await AsyncStorage.removeItem("@refresh_token");

      return rejectWithValue(
        error.response?.data?.message || "Erro ao atualizar tokens"
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

export const restoreAuthState = createAsyncThunk(
  "auth/restoreAuthState",
  async (_, { dispatch }) => {
    const accessToken = await AsyncStorage.getItem("@auth_token");
    const refreshToken = await AsyncStorage.getItem("@refresh_token");

    if (accessToken && refreshToken) {
      try {
        // Tentar obter o perfil para validar o token
        await dispatch(getProfile()).unwrap();

        return {
          accessToken,
          refreshToken,
          isAuthenticated: true,
        };
      } catch (error) {
        // Se falhar ao obter perfil, tentar refresh token
        try {
          await dispatch(refreshTokens(refreshToken)).unwrap();
          await dispatch(getProfile()).unwrap();

          const newAccessToken = await AsyncStorage.getItem("@auth_token");
          const newRefreshToken = await AsyncStorage.getItem("@refresh_token");

          return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
          };
        } catch (refreshError) {
          // Se falhar o refresh, limpar tudo
          await AsyncStorage.removeItem("@auth_token");
          await AsyncStorage.removeItem("@refresh_token");

          return {
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          };
        }
      }
    }

    return {
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }
);

// Função auxiliar para formatação de erros
const formatErrorMessage = (error: any): string => {
  if (!error) return "Ocorreu um erro desconhecido";

  if (typeof error === "string") return error;

  // Tratamento de estruturas aninhadas de erro
  if (error.message) {
    if (typeof error.message === "object" && error.message.message) {
      return error.message.message;
    }
    return error.message;
  }

  return "Falha na comunicação com o servidor";
};

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
    updateTokens: (state, action: PayloadAction<TokensResponse>) => {
      state.isLoading = false;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        console.log("[authSlice] Login pendente");
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          console.log(
            "[authSlice] Login concluído com sucesso, atualizando estado"
          );
          state.isLoading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.error = null;
        }
      )
      .addCase(login.rejected, (state, action) => {
        console.log("[authSlice] Login rejeitado, erro:", action.payload);
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = formatErrorMessage(action.payload);
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        console.log("[authSlice] Registro pendente");
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        register.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          console.log(
            "[authSlice] Registro concluído com sucesso, atualizando estado"
          );
          state.isLoading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.error = null;
        }
      )
      .addCase(register.rejected, (state, action) => {
        console.log("[authSlice] Registro rejeitado, erro:", action.payload);
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = formatErrorMessage(action.payload);
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        // Reset para o estado inicial
        return initialState;
      })
      .addCase(logout.rejected, (state) => {
        // Mesmo em caso de erro, resetar o estado
        return initialState;
      });

    // Refresh tokens
    builder
      .addCase(refreshTokens.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        refreshTokens.fulfilled,
        (state, action: PayloadAction<TokensResponse>) => {
          state.isLoading = false;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
          state.error = null;
        }
      )
      .addCase(refreshTokens.rejected, (state) => {
        // Falha no refresh leva a logout
        return initialState;
      });

    // Get profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = formatErrorMessage(action.payload);
      });

    // Restore auth state
    builder
      .addCase(restoreAuthState.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = action.payload.isAuthenticated;
      });
  },
});

export const { clearErrors, updateTokens } = authSlice.actions;

export default authSlice.reducer;
