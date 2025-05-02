/**
 * Hook personalizado para gerenciamento de categorias
 */
import { useCallback, useState } from "react";
import CategoriesService from "../api/categories";
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoriesPage,
} from "../types/categories.types";
import { PageOptionsDto } from "../types/common.types";

// Hook para gerenciamento de categorias
export const useCategories = () => {
  // Estados locais
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    totalPages: number;
    totalItems: number;
  }>({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Função para limpar erros
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Função para obter todas as categorias com paginação
  const fetchCategories = useCallback(async (pageOptions?: PageOptionsDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await CategoriesService.getAll(pageOptions);
      setCategories(response.data);
      setPagination({
        page: response.meta.page,
        totalPages: response.meta.pageCount,
        totalItems: response.meta.itemCount,
      });
      return response;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar categorias");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para obter uma categoria por ID
  const fetchCategoryById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await CategoriesService.getById(id);
      setCategory(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar categoria");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para criar uma nova categoria
  const createCategory = useCallback(
    async (categoryData: CreateCategoryDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await CategoriesService.create(categoryData);
        setCategory(data);
        // Atualizar a lista de categorias se necessário
        setCategories((prev) => [...prev, data]);
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao criar categoria");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para atualizar uma categoria existente
  const updateCategory = useCallback(
    async (id: string, categoryData: UpdateCategoryDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await CategoriesService.update(id, categoryData);
        setCategory(data);
        // Atualizar a lista de categorias se necessário
        setCategories((prev) =>
          prev.map((cat) => (cat.id === id ? data : cat))
        );
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao atualizar categoria");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para remover uma categoria
  const removeCategory = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await CategoriesService.remove(id);
      // Atualizar a lista de categorias
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao remover categoria");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Retornar as funções e estado
  return {
    // Estado
    categories,
    category,
    isLoading,
    error,
    pagination,

    // Ações
    fetchCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    removeCategory,
    clearError,
  };
};

export default useCategories;
