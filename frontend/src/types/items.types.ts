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
  id: string;
  type: ItemType;
  description: string;
  conservationState?: string;
  size?: string;
  receivedDate: string;
  status: ItemStatus;
  photos?: string[];
  donor: User;
  donorId: string;
  category?: Category;
  categoryId?: string;
}

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
