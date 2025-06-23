import api from './api';
import {
  ApiResponse,
  PageDto,
  PageOptionsDto,
} from '../types/common.types';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../types/categories.types';

class CategoriesService {
  /**
   * Busca todas as categorias com paginação.
   * @param pageOptionsDto - Opções de paginação.
   */
  async getAll(pageOptions?: PageOptionsDto): Promise<PageDto<Category>> {
    const response = await api.get<ApiResponse<PageDto<Category>>>(
      '/categories',
      {
        params: pageOptions,
      },
    );
    // CORREÇÃO: Retorna o conteúdo de 'data' de dentro do 'envelope' da API
    return response.data.data;
  }

  /**
   * Busca uma categoria pelo ID.
   * @param id - O ID da categoria.
   */
  async getById(id: string): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  }

  /**
   * Cria uma nova categoria.
   * @param categoryData - Os dados para a nova categoria.
   */
  async create(categoryData: CreateCategoryDto): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>(
      '/categories',
      categoryData,
    );
    return response.data.data;
  }

  /**
   * Atualiza uma categoria existente.
   * @param id - O ID da categoria.
   * @param categoryData - Os dados de atualização.
   */
  async update(id: string, categoryData: UpdateCategoryDto): Promise<Category> {
    const response = await api.patch<ApiResponse<Category>>(
      `/categories/${id}`,
      categoryData,
    );
    return response.data.data;
  }

  /**
   * Remove uma categoria.
   * @param id - O ID da categoria.
   */
  async remove(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

export default new CategoriesService();