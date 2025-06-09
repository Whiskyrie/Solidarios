/**
 * Serviço de inventário - comunicação com as rotas de inventário do backend
 */
import api from "./api";
import {
  Inventory,
  CreateInventoryDto,
  UpdateInventoryDto,
  InventoryPage,
} from "../types/inventory.types";
import { PageOptionsDto } from "../types/common.types";

// Namespace para agrupar as funções do serviço
const InventoryService = {
  /**
   * Obter todo o inventário com paginação
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de registros de inventário
   */
  getAll: async (pageOptions?: PageOptionsDto): Promise<InventoryPage> => {
    const response = await api.get<InventoryPage>("/inventory", {
      params: pageOptions,
    });
    return response.data;
  },

  /**
   * Obter registro de inventário por ID
   * @param id ID do registro de inventário
   * @returns Registro de inventário encontrado
   */
  getById: async (id: string): Promise<Inventory> => {
    const response = await api.get<Inventory>(`/inventory/${id}`);
    return response.data;
  },

  /**
   * Obter registro de inventário pelo ID do item
   * @param itemId ID do item
   * @returns Registro de inventário encontrado
   */
  getByItemId: async (itemId: string): Promise<Inventory> => {
    const response = await api.get<Inventory>(`/inventory/item/${itemId}`);
    return response.data;
  },

  /**
   * Adicionar item ao inventário
   * @param inventoryData Dados do novo registro de inventário
   * @returns Registro de inventário criado
   */
  create: async (inventoryData: CreateInventoryDto): Promise<Inventory> => {
    const response = await api.post<Inventory>("/inventory", inventoryData);
    return response.data;
  },

  /**
   * Atualizar registro de inventário existente
   * @param id ID do registro de inventário
   * @param inventoryData Dados atualizados
   * @returns Registro de inventário atualizado
   */
  update: async (
    id: string,
    inventoryData: UpdateInventoryDto
  ): Promise<Inventory> => {
    const response = await api.patch<Inventory>(
      `/inventory/${id}`,
      inventoryData
    );
    return response.data;
  },

  /**
   * Remover registro de inventário
   * @param id ID do registro de inventário a ser removido
   * @returns void
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },

  /**
   * Atualizar quantidade de um item no inventário
   * @param itemId ID do item
   * @param quantity Nova quantidade ou diferença (dependendo do tipo)
   * @param isAbsolute Se verdadeiro, define a quantidade exata; se falso, ajusta relativamente
   * @returns Registro de inventário atualizado
   */
  updateQuantity: async (
    itemId: string,
    quantity: number,
    isAbsolute: boolean = false
  ): Promise<Inventory> => {
    const response = await api.patch<Inventory>(
      `/inventory/item/${itemId}/quantity`,
      {
        quantity,
        isAbsolute,
      }
    );
    return response.data;
  },

  /**
   * Obter itens com estoque baixo (abaixo do nível de alerta)
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de registros de inventário com estoque baixo
   */
  getLowStock: async (pageOptions?: PageOptionsDto): Promise<InventoryPage> => {
    const response = await api.get<InventoryPage>("/inventory/low-stock", {
      params: pageOptions,
    });
    return response.data;
  },

  /**
   * Verificar se um item está disponível em estoque
   * @param itemId ID do item
   * @param quantity Quantidade mínima necessária (padrão: 1)
   * @returns Verdadeiro se disponível, falso caso contrário
   */
  checkAvailability: async (
    itemId: string,
    quantity: number = 1
  ): Promise<boolean> => {
    const response = await api.get<{ available: boolean }>(
      `/inventory/check-availability/${itemId}`,
      {
        params: { quantity },
      }
    );
    return response.data.available;
  },
};

export default InventoryService;
