/**
 * Serviço de categorias - comunicação com as rotas de categorias do backend
 */
import api from "./api";
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoriesPage,
} from "../types/categories.types";
import { PageOptionsDto } from "../types/common.types";

// Namespace para agrupar as funções do serviço
const CategoriesService = {
  /**
   * Obter todas as categorias com paginação
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de categorias
   */
  getAll: async (pageOptions?: PageOptionsDto): Promise<CategoriesPage> => {
    const response = await api.get<CategoriesPage>("/categories", {
      params: pageOptions,
    });
    return response.data;
  },

  /**
   * Obter categoria por ID
   * @param id ID da categoria
   * @returns Categoria encontrada
   */
  getById: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  /**
   * Criar nova categoria
   * @param categoryData Dados da nova categoria
   * @returns Categoria criada
   */
  create: async (categoryData: CreateCategoryDto): Promise<Category> => {
    const response = await api.post<Category>("/categories", categoryData);
    return response.data;
  },

  /**
   * Atualizar categoria existente
   * @param id ID da categoria
   * @param categoryData Dados atualizados
   * @returns Categoria atualizada
   */
  update: async (
    id: string,
    categoryData: UpdateCategoryDto
  ): Promise<Category> => {
    const response = await api.patch<Category>(
      `/categories/${id}`,
      categoryData
    );
    return response.data;
  },

  /**
   * Remover categoria
   * @param id ID da categoria a ser removida
   * @returns void
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

export default CategoriesService;
