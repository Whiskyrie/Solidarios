/**
 * Hook personalizado para gerenciamento de inventário
 */
import { useCallback, useState } from "react";
import InventoryService from "../api/inventory";
import {
  Inventory,
  CreateInventoryDto,
  UpdateInventoryDto,
  InventoryPage,
} from "../types/inventory.types";
import { PageOptionsDto } from "../types/common.types";

// Hook para gerenciamento de inventário
export const useInventory = () => {
  // Estados locais
  const [inventoryItems, setInventoryItems] = useState<Inventory[]>([]);
  const [inventoryItem, setInventoryItem] = useState<Inventory | null>(null);
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

  // Função para obter todo o inventário com paginação
  const fetchInventory = useCallback(async (pageOptions?: PageOptionsDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await InventoryService.getAll(pageOptions);
      setInventoryItems(response.data);
      setPagination({
        page: response.meta.page,
        totalPages: response.meta.pageCount,
        totalItems: response.meta.itemCount,
      });
      return response;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar inventário");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para obter um registro de inventário por ID
  const fetchInventoryById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await InventoryService.getById(id);
      setInventoryItem(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar item do inventário");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para obter um registro de inventário pelo ID do item
  const fetchInventoryByItemId = useCallback(async (itemId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await InventoryService.getByItemId(itemId);
      setInventoryItem(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar inventário pelo ID do item");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para adicionar item ao inventário
  const addToInventory = useCallback(
    async (inventoryData: CreateInventoryDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await InventoryService.create(inventoryData);
        setInventoryItem(data);
        // Atualizar a lista de inventário se necessário
        setInventoryItems((prev) => [...prev, data]);
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao adicionar item ao inventário");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para atualizar um registro de inventário existente
  const updateInventoryItem = useCallback(
    async (id: string, inventoryData: UpdateInventoryDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await InventoryService.update(id, inventoryData);
        setInventoryItem(data);
        // Atualizar a lista de inventário se necessário
        setInventoryItems((prev) => prev.map((i) => (i.id === id ? data : i)));
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao atualizar item do inventário");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para remover um registro de inventário
  const removeFromInventory = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await InventoryService.remove(id);
      // Atualizar a lista de inventário
      setInventoryItems((prev) => prev.filter((i) => i.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao remover item do inventário");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para atualizar a quantidade de um item no inventário
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number, isAbsolute: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await InventoryService.updateQuantity(
          itemId,
          quantity,
          isAbsolute
        );
        setInventoryItem(data);
        // Atualizar a lista de inventário se necessário
        setInventoryItems((prev) =>
          prev.map((i) => (i.itemId === itemId ? data : i))
        );
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao atualizar quantidade no inventário");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para obter itens com estoque baixo
  const fetchLowStock = useCallback(async (pageOptions?: PageOptionsDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await InventoryService.getLowStock(pageOptions);
      setInventoryItems(response.data);
      setPagination({
        page: response.meta.page,
        totalPages: response.meta.pageCount,
        totalItems: response.meta.itemCount,
      });
      return response;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar itens com estoque baixo");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para verificar disponibilidade de um item
  const checkAvailability = useCallback(
    async (itemId: string, quantity: number = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        const available = await InventoryService.checkAvailability(
          itemId,
          quantity
        );
        return available;
      } catch (err: any) {
        setError(err.message || "Erro ao verificar disponibilidade do item");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Retornar as funções e estado
  return {
    // Estado
    inventoryItems,
    inventoryItem,
    isLoading,
    error,
    pagination,

    // Ações
    fetchInventory,
    fetchInventoryById,
    fetchInventoryByItemId,
    addToInventory,
    updateInventoryItem,
    removeFromInventory,
    updateQuantity,
    fetchLowStock,
    checkAvailability,
    clearError,
  };
};

export default useInventory;
