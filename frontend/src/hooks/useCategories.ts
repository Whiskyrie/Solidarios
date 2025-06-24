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

// Cache global para categorias
const categoriesCache = {
  data: [] as Category[],
  lastFetch: 0,
  isValid: false,
};

const CACHE_DURATION = 5 * 60 * 1000;
let globalLoadingPromise: Promise<any> | null = null;

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>(() =>
    Array.isArray(categoriesCache.data) ? categoriesCache.data : []
  );
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

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isCacheValid = useCallback(() => {
    const now = Date.now();
    return (
      categoriesCache.isValid &&
      Array.isArray(categoriesCache.data) &&
      categoriesCache.data.length > 0 &&
      now - categoriesCache.lastFetch < CACHE_DURATION
    );
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const updateCategoriesState = useCallback((newCategories: Category[]) => {
    if (!isMountedRef.current) return;
    const safeCategories = Array.isArray(newCategories) ? newCategories : [];
    setCategories(safeCategories);
    categoriesCache.data = safeCategories;
    categoriesCache.lastFetch = Date.now();
    categoriesCache.isValid = true;
  }, []);

  const fetchCategories = useCallback(
    async (pageOptions?: PageOptionsDto, forceRefresh = false) => {
      if (!forceRefresh && isCacheValid()) {
        console.log("[useCategories] Usando cache de categorias");
        if (isMountedRef.current) {
          setCategories(
            Array.isArray(categoriesCache.data) ? categoriesCache.data : []
          );
        }
        return { data: categoriesCache.data };
      }

      if (globalLoadingPromise && !forceRefresh) {
        console.log("[useCategories] Aguardando requisição em andamento");
        return globalLoadingPromise;
      }

      console.log("[useCategories] Iniciando nova requisição de categorias");
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      globalLoadingPromise = (async () => {
        try {
          const response = await CategoriesService.getAll(pageOptions);

          let categoriesData: Category[] = [];

          // Handle different response formats
          if (Array.isArray(response)) {
            categoriesData = response;
          } else if (response && typeof response === "object") {
            if (Array.isArray(response.data)) {
              categoriesData = response.data;
            }
          }

          // Validate each category object
          const validCategories = categoriesData.filter(
            (cat) => cat && typeof cat === "object" && cat.id && cat.name
          );

          if (isMountedRef.current) {
            setCategories(validCategories);
            setError(null);

            // Set basic pagination if available
            if (response && response.meta) {
              setPagination({
                page: response.meta.page || 1,
                totalPages: response.meta.pageCount || 1,
                totalItems: response.meta.itemCount || validCategories.length,
              });
            } else {
              setPagination({
                page: 1,
                totalPages: 1,
                totalItems: validCategories.length,
              });
            }
          }

          return { data: validCategories, meta: response?.meta };
        } catch (err) {
          console.error("[useCategories] Erro ao buscar categorias:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Erro ao buscar categorias";

          if (isMountedRef.current) {
            setError(errorMessage);
            setCategories([]); // Ensure categories is always an array
          }

          throw new Error(errorMessage);
        } finally {
          globalLoadingPromise = null;
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      })();

      return globalLoadingPromise;
    },
    [isCacheValid, updateCategoriesState]
  );

  useEffect(() => {
    if (isCacheValid()) {
      console.log("[useCategories] Inicializando com cache");
      setCategories(
        Array.isArray(categoriesCache.data) ? categoriesCache.data : []
      );
    }
  }, [isCacheValid]);

  const fetchCategoryById = useCallback(
    async (id: string) => {
      const cachedCategory = categories.find((cat) => cat.id === id);
      if (cachedCategory) {
        setCategory(cachedCategory);
        return cachedCategory;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await CategoriesService.getById(id);
        if (isMountedRef.current) setCategory(data);
        return data;
      } catch (err: any) {
        if (isMountedRef.current)
          setError(err.message || "Erro ao buscar categoria");
        return null;
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [categories]
  );

  const createCategory = useCallback(
    async (categoryData: CreateCategoryDto) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await CategoriesService.create(categoryData);
        if (isMountedRef.current) {
          setCategory(data);
          updateCategoriesState([...categories, data]);
        }
        return data;
      } catch (err: any) {
        if (isMountedRef.current)
          setError(err.message || "Erro ao criar categoria");
        return null;
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [categories, updateCategoriesState]
  );

  const updateCategory = useCallback(
    async (id: string, categoryData: UpdateCategoryDto) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await CategoriesService.update(id, categoryData);
        if (isMountedRef.current) {
          setCategory(data);
          const updated = categories.map((cat) => (cat.id === id ? data : cat));
          updateCategoriesState(updated);
        }
        return data;
      } catch (err: any) {
        if (isMountedRef.current)
          setError(err.message || "Erro ao atualizar categoria");
        return null;
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [categories, updateCategoriesState]
  );

  const removeCategory = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await CategoriesService.remove(id);
        if (isMountedRef.current) {
          const filtered = categories.filter((cat) => cat.id !== id);
          updateCategoriesState(filtered);
        }
        return true;
      } catch (err: any) {
        if (isMountedRef.current)
          setError(err.message || "Erro ao remover categoria");
        return false;
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [categories, updateCategoriesState]
  );

  const refreshCategories = useCallback(async () => {
    console.log("[useCategories] Forçando atualização do cache");
    categoriesCache.isValid = false;
    return fetchCategories(undefined, true);
  }, [fetchCategories]);

  return {
    categories: Array.isArray(categories) ? categories : [],
    category,
    isLoading,
    error,
    pagination,
    fetchCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    removeCategory,
    clearError,
    refreshCategories,
    isCacheValid: isCacheValid(),
  };
};

export default useCategories;
