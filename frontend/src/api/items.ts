/**
 * Serviço de itens - comunicação com as rotas de itens/doações do backend
 */
import api from "./api";
import {
  Item,
  CreateItemDto,
  UpdateItemDto,
  ItemsPage,
  ItemsApiResponse,
  DonorStatsDto, // <-- Add this line
} from "../types/items.types";
import { PageOptionsDto, PageDto, ApiResponse } from "../types/common.types";

// Namespace para agrupar as funções do serviço
const ItemsService = {
  /**
   * Obter todos os itens com paginação
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de itens
   */
  async getAll(pageOptions?: PageOptionsDto): Promise<PageDto<Item>> {
    const response = await api.get<ApiResponse<PageDto<Item>>>("/items", {
      params: pageOptions,
    });
    return response.data.data;
  },

  /**
   * Obter item por ID
   * @param id ID do item
   * @returns Item encontrado
   */
  getById: async (id: string): Promise<Item> => {
    const response = await api.get<any>(`/items/${id}`);
    // Backend pode retornar envelope: { data: Item, statusCode, message, timestamp }
    return response.data.data || response.data;
  },

  /**
   * Criar novo item
   * @param itemData Dados do novo item
   * @returns Item criado
   */
  create: async (itemData: CreateItemDto): Promise<Item> => {
    const response = await api.post<any>("/items", itemData);
    console.log("🔍 [ItemsService] Resposta completa da API:", response.data);

    // Backend retorna envelope: { data: Item, statusCode, message, timestamp }
    let item = response.data;

    // Se a resposta tem um campo 'data', extrair o item de lá
    if (
      response.data &&
      typeof response.data === "object" &&
      response.data.data
    ) {
      item = response.data.data;
    }

    console.log("🔍 [ItemsService] Item extraído:", item);
    console.log("🔍 [ItemsService] Item ID:", item?.id);

    if (!item || !item.id) {
      throw new Error("Item criado mas resposta da API é inválida");
    }

    return item;
  },

  /**
   * Atualizar item existente
   * @param id ID do item
   * @param itemData Dados atualizados
   * @returns Item atualizado
   */
  update: async (id: string, itemData: UpdateItemDto): Promise<Item> => {
    const response = await api.patch<any>(`/items/${id}`, itemData);
    // Backend pode retornar envelope: { data: Item, statusCode, message, timestamp }
    return response.data.data || response.data;
  },

  /**
   * Remover item
   * @param id ID do item a ser removido
   * @returns void
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/items/${id}`);
  },

  /**
   * Obter itens por doador
   * @param donorId ID do doador
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de itens
   */
  getByDonor: async (
    donorId: string,
    pageOptions?: PageOptionsDto
  ): Promise<ItemsApiResponse> => {
    try {
      const response = await api.get<any>(`/items/donor/${donorId}`, {
        params: pageOptions,
      });

      // Retornar os dados brutos para serem processados pelo hook
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar itens por doador:", error);
      throw error;
    }
  },

  /**
   * Obter estatísticas de um doador
   * @param donorId ID do doador
   * @returns Dados estatísticos do doador
   */
  getDonorStats: async (donorId: string): Promise<DonorStatsDto> => {
    const response = await api.get<DonorStatsDto>(
      `/items/donor/${donorId}/stats`
    );
    return response.data;
  },

  /**
   * Obter itens por categoria
   * @param categoryId ID da categoria
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de itens
   */
  getByCategory: async (
    categoryId: string,
    pageOptions?: PageOptionsDto
  ): Promise<ItemsPage> => {
    const response = await api.get<ItemsPage>(`/items/category/${categoryId}`, {
      params: pageOptions,
    });
    return response.data;
  },

  /**
   * Obter itens por status
   * @param status Status dos itens (disponível, reservado, distribuído)
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de itens
   */
  getByStatus: async (
    status: string,
    pageOptions?: PageOptionsDto
  ): Promise<ItemsPage> => {
    // LÓGICA DE DIRECIONAMENTO: Se o status for 'disponivel', usa a nova rota segura.
    const url = status === "disponivel" ? "/items/available/all" : "/items";

    const params: any = {
      page: pageOptions?.page || 1,
      take: pageOptions?.take || 20,
    };

    if (status !== "disponivel") {
      params.status = status; // Adiciona o status apenas se não for disponivel
    }

    try {
      const response = await api.get<ItemsPage>(url, { params });
      return response.data;
    } catch (error) {
      console.error(
        `[ItemsService] Erro ao buscar itens com status ${status}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Upload de fotos para um item
   * @param id ID do item
   * @param files Arquivos de imagem
   * @returns Item atualizado com URLs das fotos
   */
  uploadPhotos: async (id: string, files: FormData): Promise<Item> => {
    const response = await api.post<any>(`/items/${id}/photos`, files, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("🔍 [ItemsService] Upload resposta:", response.data);

    // Backend retorna envelope: { data: Item, statusCode, message, timestamp }
    let item = response.data;

    // Se a resposta tem um campo 'data', extrair o item de lá
    if (
      response.data &&
      typeof response.data === "object" &&
      response.data.data
    ) {
      item = response.data.data;
    }

    console.log("🔍 [ItemsService] Item com fotos:", item);

    if (!item || !item.id) {
      throw new Error("Upload concluído mas resposta da API é inválida");
    }

    return item;
  },

  /**
   * Remover foto de um item
   * @param id ID do item
   * @param photoUrl URL da foto a ser removida
   * @returns Item atualizado sem a foto removida
   */
  removePhoto: async (id: string, photoUrl: string): Promise<Item> => {
    const response = await api.delete<any>(`/items/${id}/photos`, {
      data: { photoUrl },
    });
    // Backend pode retornar envelope: { data: Item, statusCode, message, timestamp }
    return response.data.data || response.data;
  },

  /**
   * Solicitar um item (para beneficiários)
   * @param itemId ID do item a ser solicitado
   * @param beneficiaryId ID do beneficiário que está solicitando
   * @returns Dados da solicitação criada
   */
  requestItem: async (itemId: string, beneficiaryId: string): Promise<any> => {
    const response = await api.post(`/items/${itemId}/request`, {
      beneficiaryId: beneficiaryId,
    });
    return response.data;
  },
};

export default ItemsService;
