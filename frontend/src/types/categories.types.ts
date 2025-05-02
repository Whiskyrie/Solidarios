/**
 * Definição de tipos para categorias
 * Baseado nas entidades e DTOs do backend
 */
import { Item } from "./items.types";
import { PageDto } from "./users.types";

export interface Category {
  id: string;
  name: string;
  description?: string;
  items?: Item[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

// Tipo para categorias paginadas
export type CategoriesPage = PageDto<Category>;
