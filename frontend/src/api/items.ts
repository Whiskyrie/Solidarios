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
} from "../types/items.types";
import { PageOptionsDto } from "../types/common.types";

// Namespace para agrupar as funções do serviço
const ItemsService = {
  /**
   * Obter todos os itens com paginação
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de itens
   */
  getAll: async (pageOptions?: PageOptionsDto): Promise<ItemsPage> => {
    const response = await api.get<ItemsPage>("/items", {
      params: pageOptions,
    });
    return response.data;
  },

  /**
   * Obter item por ID
   * @param id ID do item
   * @returns Item encontrado
   */
  getById: async (id: string): Promise<Item> => {
    const response = await api.get<Item>(`/items/${id}`);
    return response.data;
  },

  /**
   * Criar novo item
   * @param itemData Dados do novo item
   * @returns Item criado
   */
  create: async (itemData: CreateItemDto): Promise<Item> => {
    const response = await api.post<Item>("/items", itemData);
    return response.data;
  },

  /**
   * Atualizar item existente
   * @param id ID do item
   * @param itemData Dados atualizados
   * @returns Item atualizado
   */
  update: async (id: string, itemData: UpdateItemDto): Promise<Item> => {
    const response = await api.patch<Item>(`/items/${id}`, itemData);
    return response.data;
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
    const response = await api.get<ItemsPage>(`/items/status/${status}`, {
      params: pageOptions,
    });
    return response.data;
  },

  /**
   * Upload de fotos para um item
   * @param id ID do item
   * @param files Arquivos de imagem
   * @returns Item atualizado com URLs das fotos
   */
  uploadPhotos: async (id: string, files: FormData): Promise<Item> => {
    const response = await api.post<Item>(`/items/${id}/photos`, files, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Remover foto de um item
   * @param id ID do item
   * @param photoUrl URL da foto a ser removida
   * @returns Item atualizado sem a foto removida
   */
  removePhoto: async (id: string, photoUrl: string): Promise<Item> => {
    const response = await api.delete<Item>(`/items/${id}/photos`, {
      data: { photoUrl },
    });
    return response.data;
  },
};

export default ItemsService;
