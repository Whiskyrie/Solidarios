/**
 * Definição de tipos para itens/doações
 * Baseado nas entidades e DTOs do backend
 */
import { User } from "./users.types";
import { Category } from "./categories.types";
import { PageDto } from "./users.types";

export enum ItemType {
  ROUPA = "roupa",
  CALCADO = "calcado",
  UTENSILIO = "utensilio",
  OUTRO = "outro",
}

export enum ItemStatus {
  DISPONIVEL = "disponivel",
  RESERVADO = "reservado",
  DISTRIBUIDO = "distribuido",
}

export interface Item {
  // Campos obrigatórios com verificação de nulidade
  id: string;
  type: ItemType;
  description: string;
  receivedDate: string;
  status: ItemStatus;
  donorId: string;

  // Campos opcionais
  conservationState?: string | null;
  size?: string | null;
  photos?: string[] | null;
  categoryId?: string | null;

  // Relacionamentos que podem vir nulos da API
  donor?: User | null;
  category?: Category | null;
}

// Interface para respostas da API que incluem items
export interface ItemsResponse {
  data: Item[];
  meta: {
    page: number;
    take: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

// Interface para respostas aninhadas da API
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
  timestamp: string;
}

// Tipo combinado para diferentes possibilidades de resposta da API
export type ItemsApiResponse =
  | ApiResponse<ItemsResponse> // Resposta aninhada: {data: {data: Item[], meta: {...}}, statusCode: ...}
  | ItemsResponse // Resposta direta: {data: Item[], meta: {...}}
  | Item[]; // Apenas array de itens: Item[]

export interface CreateItemDto {
  type: ItemType;
  description: string;
  conservationState?: string;
  size?: string;
  status?: ItemStatus;
  photos?: string[];
  donorId: string;
  categoryId?: string;
}

export interface UpdateItemDto {
  type?: ItemType;
  description?: string;
  conservationState?: string;
  size?: string;
  status?: ItemStatus;
  photos?: string[];
  donorId?: string;
  categoryId?: string;
}

// Tipo para itens paginados
export type ItemsPage = PageDto<Item>;
