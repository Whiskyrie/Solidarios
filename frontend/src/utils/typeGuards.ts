// Adicionando Type Guards para auxiliar o TypeScript

import {
  ApiResponse,
  Item,
  ItemsApiResponse,
  ItemsResponse,
} from "../types/items.types";

// Funções de verificação de tipo (Type Guards)
export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return (
    response !== null &&
    typeof response === "object" &&
    "data" in response &&
    "statusCode" in response &&
    "message" in response &&
    "timestamp" in response
  );
}

export function isItemsResponse(response: any): response is ItemsResponse {
  return (
    response !== null &&
    typeof response === "object" &&
    "data" in response &&
    "meta" in response &&
    Array.isArray(response.data)
  );
}

export function isItemArray(response: any): response is Item[] {
  return (
    Array.isArray(response) &&
    (response.length === 0 || ("id" in response[0] && "type" in response[0]))
  );
}

// Função para extrair os dados de forma segura
export function extractItemsData(response: ItemsApiResponse): Item[] {
  if (isApiResponse<ItemsResponse>(response)) {
    // Caso 1: Resposta aninhada {data: {data: [], meta: {}}, statusCode: ...}
    return Array.isArray(response.data.data) ? response.data.data : [];
  } else if (isItemsResponse(response)) {
    // Caso 2: Resposta direta {data: [], meta: {}}
    return Array.isArray(response.data) ? response.data : [];
  } else if (isItemArray(response)) {
    // Caso 3: Apenas array de items: Item[]
    return response;
  }

  // Fallback
  return [];
}

// Função para extrair os metadados de paginação
export function extractItemsMeta(response: ItemsApiResponse): {
  page: number;
  pageCount: number;
  itemCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
} {
  const defaultMeta = {
    page: 1,
    pageCount: 1,
    itemCount: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  if (isApiResponse<ItemsResponse>(response)) {
    // Caso 1: Resposta aninhada
    return response.data.meta || defaultMeta;
  } else if (isItemsResponse(response)) {
    // Caso 2: Resposta direta
    return response.meta || defaultMeta;
  }

  // Fallback para array de items
  return {
    ...defaultMeta,
    itemCount: isItemArray(response) ? response.length : 0,
  };
}
