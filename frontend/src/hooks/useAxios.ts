/**
 * Hook personalizado para fazer requisições HTTP com Axios
 * Gerencia estado de loading e erros de forma consistente
 */
import { useState, useCallback } from "react";
import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import apiClient from "../api/client";
import { ApiError } from "../types/common.types";

interface UseAxiosState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseAxiosActions<T> {
  request: (config: AxiosRequestConfig) => Promise<AxiosResponse<T> | null>;
  clear: () => void;
}

/**
 * Hook para gerenciar estados de requisições HTTP
 * @param initialData Dados iniciais (opcional)
 * @returns Estado e ações para realizar requisições
 */
function useAxios<T = any>(
  initialData: T | null = null
): [UseAxiosState<T>, UseAxiosActions<T>] {
  // Estado para armazenar dados, loading e erros
  const [state, setState] = useState<UseAxiosState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  /**
   * Realizar uma requisição HTTP
   */
  const request = useCallback(
    async (config: AxiosRequestConfig): Promise<AxiosResponse<T> | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.request<T>(config);
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        return response;
      } catch (err) {
        const error = err as AxiosError;
        let apiError: ApiError;

        if (error.response) {
          // Resposta do servidor com erro
          const status = error.response.status;
          const responseData = error.response.data as any;
          const message =
            responseData?.message || "Ocorreu um erro na requisição";

          apiError = new ApiError(message, status, responseData);
        } else if (error.request) {
          // Requisição feita mas sem resposta
          apiError = new ApiError(
            "Não foi possível obter resposta do servidor",
            0,
            error.request
          );
        } else {
          // Erro ao configurar a requisição
          apiError = new ApiError(
            error.message || "Erro na configuração da requisição",
            0
          );
        }

        setState({
          data: null,
          loading: false,
          error: apiError,
        });

        return null;
      }
    },
    []
  );

  /**
   * Limpar o estado
   */
  const clear = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  return [state, { request, clear }];
}

/**
 * Versão simplificada do hook para métodos HTTP comuns
 * @param url URL base para requisições
 * @param initialData Dados iniciais (opcional)
 */
export function useAxiosResource<T = any>(
  url: string,
  initialData: T | null = null
) {
  const [state, { request, clear }] = useAxios<T>(initialData);

  // Ações para cada método HTTP
  const actions = {
    get: useCallback(
      async (id?: string, params?: any) => {
        const fullUrl = id ? `${url}/${id}` : url;
        return request({
          method: "GET",
          url: fullUrl,
          params,
        });
      },
      [url, request]
    ),

    getAll: useCallback(
      async (params?: any) => {
        return request({
          method: "GET",
          url,
          params,
        });
      },
      [url, request]
    ),

    post: useCallback(
      async (data: any) => {
        return request({
          method: "POST",
          url,
          data,
        });
      },
      [url, request]
    ),

    patch: useCallback(
      async (id: string, data: any) => {
        return request({
          method: "PATCH",
          url: `${url}/${id}`,
          data,
        });
      },
      [url, request]
    ),

    put: useCallback(
      async (id: string, data: any) => {
        return request({
          method: "PUT",
          url: `${url}/${id}`,
          data,
        });
      },
      [url, request]
    ),

    delete: useCallback(
      async (id: string) => {
        return request({
          method: "DELETE",
          url: `${url}/${id}`,
        });
      },
      [url, request]
    ),

    custom: request,
    clear,
  };

  return [state, actions] as const;
}

export default useAxios;
