/**
 * Hook personalizado otimizado para gerenciamento de categorias
 * com cache e controle de requisições
 */
import { useState, useCallback, useRef, useEffect } from "react";
import CategoriesService from "../api/categories";
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../types/categories.types";
import { PageOptionsDto } from "../types/common.types";

// Cache global para categorias (compartilhado entre instâncias do hook)
const categoriesCache = {
  data: [] as Category[],
  lastFetch: 0,
  isValid: false,
};

// Tempo de cache em milissegundos (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000;

// Estado de loading global para evitar requisições simultâneas
let globalLoadingPromise: Promise<any> | null = null;

export const useCategories = () => {
  // CORREÇÃO: Inicializar sempre com array vazio
  const [categories, setCategories] = useState<Category[]>(() => {
    return Array.isArray(categoriesCache.data) ? categoriesCache.data : [];
  });

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

  // Refs para controle interno
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Função para verificar se o cache é válido
  const isCacheValid = useCallback(() => {
    const now = Date.now();
    return (
      categoriesCache.isValid &&
      Array.isArray(categoriesCache.data) &&
      categoriesCache.data.length > 0 &&
      now - categoriesCache.lastFetch < CACHE_DURATION
    );
  }, []);

  // Função para limpar erros
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // CORREÇÃO: Função para atualizar estado de forma segura
  const updateCategoriesState = useCallback((newCategories: Category[]) => {
    if (!isMountedRef.current) return;

    const safeCategories = Array.isArray(newCategories) ? newCategories : [];
    setCategories(safeCategories);

    // Atualizar cache global
    categoriesCache.data = safeCategories;
    categoriesCache.lastFetch = Date.now();
    categoriesCache.isValid = true;
  }, []);

  // Função otimizada para obter todas as categorias
  const fetchCategories = useCallback(
    async (pageOptions?: PageOptionsDto, forceRefresh = false) => {
      // Se o cache é válido e não é forceRefresh, usar cache
      if (!forceRefresh && isCacheValid()) {
        console.log("[useCategories] Usando cache de categorias");
        if (isMountedRef.current) {
          setCategories(
            Array.isArray(categoriesCache.data) ? categoriesCache.data : []
          );
        }
        return { data: categoriesCache.data };
      }

      // Se já tem uma requisição em andamento, aguardar ela
      if (globalLoadingPromise && !forceRefresh) {
        console.log("[useCategories] Aguardando requisição em andamento");
        try {
          const result = await globalLoadingPromise;
          if (isMountedRef.current && result?.data) {
            updateCategoriesState(result.data);
          }
          return result;
        } catch {
          // Se a requisição em andamento falhar, tentar novamente
          console.log(
            "[useCategories] Requisição em andamento falhou, tentando novamente"
          );
        }
      }

      // Iniciar nova requisição
      console.log("[useCategories] Iniciando nova requisição de categorias");
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      // Criar promise para controle global
      globalLoadingPromise = (async () => {
        try {
          const response = await CategoriesService.getAll(pageOptions);

          // Verificar se a resposta é válida
          if (!response || !Array.isArray(response.data)) {
            throw new Error("Resposta inválida da API");
          }

          // Atualizar estado local apenas se o componente ainda estiver montado
          if (isMountedRef.current) {
            updateCategoriesState(response.data);
            setPagination({
              page: response.meta?.page || 1,
              totalPages: response.meta?.pageCount || 1,
              totalItems: response.meta?.itemCount || 0,
            });
          }

          return response;
        } catch (err: any) {
          const errorMessage = err.message || "Erro ao buscar categorias";

          if (isMountedRef.current) {
            setError(errorMessage);
          }

          // Invalidar cache em caso de erro
          categoriesCache.isValid = false;

          console.error("[useCategories] Erro ao buscar categorias:", err);
          throw err;
        } finally {
          // Limpar promise global
          globalLoadingPromise = null;

          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      })();

      try {
        return await globalLoadingPromise;
      } catch {
        return null;
      }
    },
    [isCacheValid, updateCategoriesState]
  );

  // Carregar categorias do cache ao montar (se disponível)
  useEffect(() => {
    if (!hasInitializedRef.current && isCacheValid()) {
      console.log("[useCategories] Inicializando com cache");
      setCategories(
        Array.isArray(categoriesCache.data) ? categoriesCache.data : []
      );
      hasInitializedRef.current = true;
    }
  }, [isCacheValid]);

  // Função para obter uma categoria por ID
  const fetchCategoryById = useCallback(
    async (id: string) => {
      // Primeiro, tentar encontrar no cache local
      const safeCategories = Array.isArray(categories) ? categories : [];
      const cachedCategory = safeCategories.find((cat) => cat.id === id);
      if (cachedCategory) {
        setCategory(cachedCategory);
        return cachedCategory;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await CategoriesService.getById(id);

        if (isMountedRef.current) {
          setCategory(data);
        }

        return data;
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err.message || "Erro ao buscar categoria");
        }
        return null;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [categories]
  );

  // Função para criar uma nova categoria
  const createCategory = useCallback(
    async (categoryData: CreateCategoryDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await CategoriesService.create(categoryData);

        if (isMountedRef.current) {
          setCategory(data);
          // Atualizar lista local
          const safeCategories = Array.isArray(categories) ? categories : [];
          updateCategoriesState([...safeCategories, data]);
        }

        return data;
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err.message || "Erro ao criar categoria");
        }
        return null;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [categories, updateCategoriesState]
  );

  // Função para atualizar uma categoria existente
  const updateCategory = useCallback(
    async (id: string, categoryData: UpdateCategoryDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await CategoriesService.update(id, categoryData);

        if (isMountedRef.current) {
          setCategory(data);

          // Atualizar lista local
          const safeCategories = Array.isArray(categories) ? categories : [];
          const updatedCategories = safeCategories.map((cat) =>
            cat.id === id ? data : cat
          );
          updateCategoriesState(updatedCategories);
        }

        return data;
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err.message || "Erro ao atualizar categoria");
        }
        return null;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [categories, updateCategoriesState]
  );

  // Função para remover uma categoria
  const removeCategory = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await CategoriesService.remove(id);

        if (isMountedRef.current) {
          // Atualizar lista local
          const safeCategories = Array.isArray(categories) ? categories : [];
          const filteredCategories = safeCategories.filter(
            (cat) => cat.id !== id
          );
          updateCategoriesState(filteredCategories);
        }

        return true;
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err.message || "Erro ao remover categoria");
        }
        return false;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [categories, updateCategoriesState]
  );

  // Função para forçar atualização do cache
  const refreshCategories = useCallback(async () => {
    console.log("[useCategories] Forçando atualização do cache");
    categoriesCache.isValid = false;
    return fetchCategories(undefined, true);
  }, [fetchCategories]);

  // Retornar as funções e estado
  return {
    // Estado - garantir que categories seja sempre um array
    categories: Array.isArray(categories) ? categories : [],
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
    refreshCategories,

    // Informações do cache
    isCacheValid: isCacheValid(),
  };
};

export default useCategories;
