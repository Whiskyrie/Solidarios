/**
 * Tipos comuns utilizados em várias partes da aplicação
 */

// Enumeração para ordem de classificação
export enum Order {
  ASC = "ASC",
  DESC = "DESC",
}

// DTO para opções de paginação
export interface PageOptionsDto {
  page?: number;
  take?: number;
  order?: Order;
}

// Tipo para resposta do backend com dados transformados
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
  timestamp: string;
}

// Erro personalizado para API
export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Interface para resposta de operações de processamento assíncrono
export interface AsyncOperationResponse {
  success: boolean;
  message: string;
  operationId?: string;
}

// Interface para filtros genéricos
export interface FilterOptions {
  [key: string]: string | number | boolean | string[] | null;
}

// Interface para opções de ordenação
export interface SortOptions {
  field: string;
  order: Order;
}

// Interface para rastreamento de mudanças
export interface AuditInfo {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
