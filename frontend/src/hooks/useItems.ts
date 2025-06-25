/**
 * Hook personalizado para gerenciamento de itens
 */
import { useCallback, useState } from "react";
import ItemsService from "../api/items";
import { Item, CreateItemDto, UpdateItemDto } from "../types/items.types";
import { PageOptionsDto } from "../types/common.types";
import { extractItemsData, extractItemsMeta } from "../utils/typeGuards";

// Enum para tipos de erro específicos
enum ItemsError {
  NETWORK_ERROR = "network_error",
  VALIDATION_ERROR = "validation_error",
  PERMISSION_ERROR = "permission_error",
  NOT_FOUND_ERROR = "not_found_error",
  PHOTO_UPLOAD_ERROR = "photo_upload_error",
}

// Interface para resultado de criação de item
interface CreateItemResult {
  success: boolean;
  item?: Item;
  error?: string;
  errorType?: ItemsError;
}

// Interface para resultado de upload de fotos
interface PhotoUploadResult {
  success: boolean;
  item?: Item;
  uploadedCount?: number;
  failedCount?: number;
  error?: string;
}

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

  // ✅ Função auxiliar para mapear erros
  const mapErrorToType = (error: any): ItemsError => {
    if (error.response?.status === 400) return ItemsError.VALIDATION_ERROR;
    if (error.response?.status === 403) return ItemsError.PERMISSION_ERROR;
    if (error.response?.status === 404) return ItemsError.NOT_FOUND_ERROR;
    if (error.code === "NETWORK_ERROR") return ItemsError.NETWORK_ERROR;
    return ItemsError.NETWORK_ERROR;
  };

  // ✅ Função auxiliar para gerar mensagens de erro amigáveis
  const getErrorMessage = (error: any, context: string): string => {
    const errorType = mapErrorToType(error);

    switch (errorType) {
      case ItemsError.VALIDATION_ERROR:
        return error.response?.data?.message || "Dados inválidos fornecidos";
      case ItemsError.PERMISSION_ERROR:
        return "Você não tem permissão para esta ação";
      case ItemsError.NOT_FOUND_ERROR:
        return "Item não encontrado";
      case ItemsError.NETWORK_ERROR:
        return "Erro de conexão. Verifique sua internet";
      case ItemsError.PHOTO_UPLOAD_ERROR:
        return "Erro ao fazer upload das fotos";
      default:
        return `Erro ao ${context}`;
    }
  };

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

      // Garantir que response.data seja um array
      const responseData = Array.isArray(response.data) ? response.data : [];
      setItems(responseData);

      // Verificar se meta existe antes de acessar suas propriedades
      setPagination({
        page: response.meta?.page || 1,
        totalPages: response.meta?.pageCount || 1,
        totalItems: response.meta?.itemCount || 0,
      });

      return response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Erro ao buscar itens";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // NOVA FUNÇÃO: Buscar apenas itens disponíveis (para beneficiários)
  const fetchAvailableItems = useCallback(
    async (pageOptions?: PageOptionsDto) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(
          "[useItems] Buscando itens disponíveis com opções:",
          pageOptions
        );

        // Usar getByStatus com status "disponivel"
        const response = await ItemsService.getByStatus(
          "disponivel",
          pageOptions
        );

        console.log("[useItems] Resposta da API:", response);

        // Extrair dados com validação aprimorada
        const items = extractItemsData(response);
        const meta = extractItemsMeta(response);

        // Validação adicional
        if (!Array.isArray(items)) {
          console.warn("[useItems] Dados retornados não são um array:", items);
          setItems([]);
          setPagination({
            page: 1,
            totalPages: 1,
            totalItems: 0,
          });
          return { data: [], meta: { page: 1, pageCount: 1, itemCount: 0 } };
        }

        // Se for a primeira página, substituir os itens
        if (pageOptions?.page === 1 || !pageOptions?.page) {
          setItems(items);
        } else {
          // Concatenar com itens existentes para paginação
          setItems((prevItems) => {
            const currentItems = Array.isArray(prevItems) ? prevItems : [];
            // Evitar duplicatas
            const newItems = items.filter(
              (item) =>
                !currentItems.some((existing) => existing.id === item.id)
            );
            return [...currentItems, ...newItems];
          });
        }

        // Atualizar paginação com valores seguros
        setPagination({
          page: meta.page || 1,
          totalPages: meta.pageCount || 1,
          totalItems: meta.itemCount || 0,
        });

        return { data: items, meta };
      } catch (err: any) {
        console.error("[useItems] Erro ao buscar itens disponíveis:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Erro ao buscar itens disponíveis";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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

  const fetchDonorStats = useCallback(async (donorId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const stats = await ItemsService.getDonorStats(donorId);
      return stats;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar estatísticas do doador");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Função melhorada para criar item (SEM fotos)
  const createItem = useCallback(
    async (itemData: CreateItemDto): Promise<CreateItemResult> => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(
          "🚀 [useItems] Criando item:",
          JSON.stringify(itemData, null, 2)
        );
        console.log("🔍 [useItems] Campos em itemData:", Object.keys(itemData));

        // ✅ Garantir que photos não seja enviado na criação
        const { photos: _photos, ...safeItemData } = itemData as any;

        console.log(
          "📤 [useItems] Dados limpos para API:",
          JSON.stringify(safeItemData, null, 2)
        );

        const newItem = await ItemsService.create(safeItemData);

        console.log("✅ [useItems] Item criado com sucesso:", newItem);
        console.log("📄 Item ID:", newItem?.id);
        console.log("📄 Item completo:", JSON.stringify(newItem, null, 2));

        // Validação melhorada: verificar se temos um objeto item válido
        if (!newItem || typeof newItem !== "object") {
          console.error("❌ Resposta inválida da API:", newItem);
          throw new Error("Resposta inválida da API ao criar item");
        }

        if (!newItem.id) {
          console.error(
            "❌ Item criado sem ID válido. Objeto completo:",
            newItem
          );
          console.error("❌ Tipo do newItem:", typeof newItem);
          console.error("❌ Keys do newItem:", Object.keys(newItem));
          throw new Error(
            `Item criado mas ID não retornado pela API. ID recebido: ${newItem.id}`
          );
        }

        setItem(newItem);
        setItems((prev) => [...prev, newItem]);

        return {
          success: true,
          item: newItem,
        };
      } catch (err: any) {
        console.error("❌ [useItems] Erro ao criar item:", err);

        const errorMessage = getErrorMessage(err, "criar item");
        const errorType = mapErrorToType(err);

        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
          errorType,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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

  // Função para solicitar um item (baseada no padrão do createItem)
  const requestItem = useCallback(
    async (itemId: string, beneficiaryId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Usar o mesmo padrão do createItem, mas para request
        const data = await ItemsService.requestItem(itemId, beneficiaryId);

        // Remover o item da lista local (não está mais disponível)
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao solicitar item");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para obter itens por doador
  const fetchItemsByDonor = useCallback(
    async (donorId: string, pageOptions?: PageOptionsDto) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(
          `[useItems] Buscando itens do doador ${donorId}`,
          pageOptions
        );

        const response = await ItemsService.getByDonor(donorId, pageOptions);

        if (!response) {
          throw new Error("Resposta vazia da API");
        }

        // Extrair dados com validação aprimorada
        const items = extractItemsData(response);
        const meta = extractItemsMeta(response);

        // Validação adicional
        if (!Array.isArray(items)) {
          console.warn("[useItems] Dados retornados não são um array:", items);
          setItems([]);
          return { data: [], meta: { page: 1, pageCount: 1, itemCount: 0 } };
        }

        // Gerenciar paginação
        if (pageOptions?.page === 1 || !pageOptions?.page) {
          setItems(items);
        } else {
          setItems((prevItems) => {
            const currentItems = Array.isArray(prevItems) ? prevItems : [];
            // Evitar duplicatas
            const newItems = items.filter(
              (item) =>
                !currentItems.some((existing) => existing.id === item.id)
            );
            return [...currentItems, ...newItems];
          });
        }

        // Atualizar paginação
        setPagination({
          page: meta.page || 1,
          totalPages: meta.pageCount || 1,
          totalItems: meta.itemCount || 0,
        });

        return { data: items, meta };
      } catch (err: any) {
        console.error("[useItems] Erro ao buscar itens do doador:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Erro ao buscar itens do doador";
        setError(errorMessage);
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

  // Função para buscar itens por status
  const fetchItemsByStatus = useCallback(
    async (status: string, pageOptions?: PageOptionsDto) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(
          "[useItems] Buscando itens por status:",
          status,
          pageOptions
        );

        const response = await ItemsService.getByStatus(status, pageOptions);

        console.log("[useItems] Resposta da API:", response);

        // Extrair dados com validação aprimorada
        const items = extractItemsData(response);
        const meta = extractItemsMeta(response);

        // Validação adicional
        if (!Array.isArray(items)) {
          console.warn("[useItems] Dados retornados não são um array:", items);
          setItems([]);
          setPagination({
            page: 1,
            totalPages: 1,
            totalItems: 0,
          });
          return { data: [], meta: { page: 1, pageCount: 1, itemCount: 0 } };
        }

        // Gerenciar paginação
        if (pageOptions?.page === 1 || !pageOptions?.page) {
          setItems(items);
        } else {
          setItems((prevItems) => {
            const currentItems = Array.isArray(prevItems) ? prevItems : [];
            // Evitar duplicatas
            const newItems = items.filter(
              (item) =>
                !currentItems.some((existing) => existing.id === item.id)
            );
            return [...currentItems, ...newItems];
          });
        }

        // Atualizar paginação com valores seguros
        setPagination({
          page: meta.page || 1,
          totalPages: meta.pageCount || 1,
          totalItems: meta.itemCount || 0,
        });

        return { data: items, meta };
      } catch (err: any) {
        console.error("[useItems] Erro ao buscar itens por status:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Erro ao buscar itens por status";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ✅ Função melhorada para upload de fotos
  const uploadPhotos = useCallback(
    async (itemId: string, formData: FormData): Promise<PhotoUploadResult> => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(
          "📤 [useItems] Iniciando upload de fotos para item:",
          itemId
        );

        if (!itemId || itemId === "undefined") {
          throw new Error("ID do item é inválido ou undefined");
        }

        const updatedItem = await ItemsService.uploadPhotos(itemId, formData);

        console.log("✅ [useItems] Upload de fotos concluído");

        setItem(updatedItem);
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? updatedItem : i))
        );

        // Contar fotos uploadadas
        const uploadedCount = updatedItem.photos?.length || 0;

        return {
          success: true,
          item: updatedItem,
          uploadedCount,
          failedCount: 0,
        };
      } catch (err: any) {
        console.error("❌ [useItems] Erro no upload de fotos:", err);

        const errorMessage = getErrorMessage(err, "fazer upload das fotos");
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
          uploadedCount: 0,
          failedCount: 1,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ✅ Função combinada: criar item + upload de fotos
  const createItemWithPhotos = useCallback(
    async (
      itemData: CreateItemDto,
      photosFormData?: FormData
    ): Promise<{
      itemResult: CreateItemResult;
      photoResult?: PhotoUploadResult;
    }> => {
      // 1. Criar item primeiro (sem fotos)
      const itemResult = await createItem(itemData);

      if (!itemResult.success || !itemResult.item) {
        return { itemResult };
      }

      // Validar se o item foi criado com ID válido
      if (!itemResult.item.id) {
        console.error("❌ Item criado sem ID válido:", itemResult.item);
        return {
          itemResult: {
            success: false,
            error: "Item criado mas sem ID válido",
            errorType: ItemsError.VALIDATION_ERROR,
          },
        };
      }

      // 2. Se há fotos, fazer upload
      if (photosFormData) {
        console.log(
          "📤 Iniciando upload de fotos para item:",
          itemResult.item.id
        );
        const photoResult = await uploadPhotos(
          itemResult.item.id,
          photosFormData
        );
        return { itemResult, photoResult };
      }

      return { itemResult };
    },
    [createItem, uploadPhotos]
  );

  // Retornar as funções e estado
  return {
    // Estado
    items,
    item,
    isLoading,
    error,
    pagination,

    // ✅ Ações melhoradas
    createItem, // Criar item SEM fotos
    uploadPhotos, // Upload de fotos separadamente
    createItemWithPhotos, // Função combinada conveniente

    // Ações existentes
    fetchItems,
    fetchAvailableItems,
    fetchItemById,
    updateItem,
    removeItem,
    fetchItemsByDonor,
    fetchItemsByCategory,
    fetchItemsByStatus,
    fetchDonorStats,
    requestItem,
    clearError,

    // ✅ Utilitários para debugging
    mapErrorToType,
    getErrorMessage,
  };
};

export default useItems;
