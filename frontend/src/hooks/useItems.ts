/**
 * Hook personalizado para gerenciamento de itens
 */
import { useCallback, useState } from "react";
import ItemsService from "../api/items";
import {
  Item,
  CreateItemDto,
  UpdateItemDto,
  ItemStatus,
} from "../types/items.types";
import { PageOptionsDto } from "../types/common.types";

// Hook para gerenciamento de itens
export const useItems = () => {
  // Estados locais
  const [items, setItems] = useState<Item[]>([]);
  const [item, setItem] = useState<Item | null>(null);
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

  // Função para obter todos os itens com paginação
  const fetchItems = useCallback(async (pageOptions?: PageOptionsDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ItemsService.getAll(pageOptions);
      setItems(response.data);
      setPagination({
        page: response.meta.page,
        totalPages: response.meta.pageCount,
        totalItems: response.meta.itemCount,
      });
      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Erro ao buscar itens";
      setError(errorMessage);
      throw new Error(errorMessage); // Lançar erro para ser capturado pelo componente
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para obter um item por ID
  const fetchItemById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await ItemsService.getById(id);
      setItem(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar item");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para criar um novo item
  const createItem = useCallback(async (itemData: CreateItemDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await ItemsService.create(itemData);
      setItem(data);
      // Atualizar a lista de itens se necessário
      setItems((prev) => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao criar item");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para atualizar um item existente
  const updateItem = useCallback(
    async (id: string, itemData: UpdateItemDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await ItemsService.update(id, itemData);
        setItem(data);
        // Atualizar a lista de itens se necessário
        setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao atualizar item");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para remover um item
  const removeItem = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await ItemsService.remove(id);
      // Atualizar a lista de itens
      setItems((prev) => prev.filter((i) => i.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao remover item");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para obter itens por doador
  const fetchItemsByDonor = useCallback(
    async (donorId: string, pageOptions?: PageOptionsDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ItemsService.getByDonor(donorId, pageOptions);
        setItems((prevItems) => [...prevItems, ...response.data]);
        setPagination({
          page: response.meta.page,
          totalPages: response.meta.pageCount,
          totalItems: response.meta.itemCount,
        });
        setError(null);
        return response;
      } catch (err: any) {
        setError(err.message || "Erro ao buscar itens do doador");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para obter itens por categoria
  const fetchItemsByCategory = useCallback(
    async (categoryId: string, pageOptions?: PageOptionsDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ItemsService.getByCategory(
          categoryId,
          pageOptions
        );
        setItems(response.data);
        setPagination({
          page: response.meta.page,
          totalPages: response.meta.pageCount,
          totalItems: response.meta.itemCount,
        });
        return response;
      } catch (err: any) {
        setError(err.message || "Erro ao buscar itens por categoria");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para obter itens por status
  const fetchItemsByStatus = useCallback(
    async (status: ItemStatus, pageOptions?: PageOptionsDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await ItemsService.getByStatus(status, pageOptions);
        setItems(response.data);
        setPagination({
          page: response.meta.page,
          totalPages: response.meta.pageCount,
          totalItems: response.meta.itemCount,
        });
        return response;
      } catch (err: any) {
        setError(err.message || "Erro ao buscar itens por status");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para upload de fotos para um item
  const uploadPhotos = useCallback(async (id: string, files: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await ItemsService.uploadPhotos(id, files);
      setItem(data);
      // Atualizar a lista de itens se necessário
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao fazer upload de fotos");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para remover foto de um item
  const removePhoto = useCallback(async (id: string, photoUrl: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await ItemsService.removePhoto(id, photoUrl);
      setItem(data);
      // Atualizar a lista de itens se necessário
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao remover foto");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Retornar as funções e estado
  return {
    // Estado
    items,
    item,
    isLoading,
    error,
    pagination,

    // Ações
    fetchItems,
    fetchItemById,
    createItem,
    updateItem,
    removeItem,
    fetchItemsByDonor,
    fetchItemsByCategory,
    fetchItemsByStatus,
    uploadPhotos,
    removePhoto,
    clearError,
  };
};

export default useItems;
