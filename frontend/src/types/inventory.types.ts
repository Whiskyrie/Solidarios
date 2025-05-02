/**
 * Definição de tipos para o inventário
 * Baseado nas entidades e DTOs do backend
 */
import { Item } from "./items.types";
import { PageDto } from "./users.types";

export interface Inventory {
  id: string;
  item: Item;
  itemId: string;
  quantity: number;
  location?: string;
  alertLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryDto {
  itemId: string;
  quantity?: number;
  location?: string;
  alertLevel?: number;
}

export interface UpdateInventoryDto {
  itemId?: string;
  quantity?: number;
  location?: string;
  alertLevel?: number;
}

// Tipo para inventário paginado
export type InventoryPage = PageDto<Inventory>;
