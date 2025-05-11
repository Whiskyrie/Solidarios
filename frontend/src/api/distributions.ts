/**
 * Serviço de distribuições - comunicação com as rotas de distribuições do backend
 */
import api from "./api";
import {
  Distribution,
  CreateDistributionDto,
  UpdateDistributionDto,
  DistributionsPage,
} from "../types/distributions.types";
import { PageOptionsDto } from "../types/common.types";

// Namespace para agrupar as funções do serviço
const DistributionsService = {
  /**
   * Obter todas as distribuições com paginação
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de distribuições
   */
  getAll: async (pageOptions?: PageOptionsDto): Promise<DistributionsPage> => {
    const response = await api.get<DistributionsPage>("/distributions", {
      params: pageOptions,
    });
    return response.data;
  },

  /**
   * Obter distribuição por ID
   * @param id ID da distribuição
   * @returns Distribuição encontrada
   */
  getById: async (id: string): Promise<Distribution> => {
    const response = await api.get<Distribution>(`/distributions/${id}`);
    return response.data;
  },

  /**
   * Obter distribuições por beneficiário
   * @param beneficiaryId ID do beneficiário
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de distribuições
   */
  getByBeneficiary: async (
    beneficiaryId: string,
    pageOptions?: PageOptionsDto
  ): Promise<DistributionsPage> => {
    const response = await api.get<DistributionsPage>(
      `/distributions/beneficiary/${beneficiaryId}`,
      {
        params: pageOptions,
      }
    );
    return response.data;
  },

  /**
   * Criar nova distribuição
   * @param distributionData Dados da nova distribuição
   * @returns Distribuição criada
   */
  create: async (
    distributionData: CreateDistributionDto
  ): Promise<Distribution> => {
    const response = await api.post<Distribution>(
      "/distributions",
      distributionData
    );
    return response.data;
  },

  /**
   * Atualizar distribuição existente
   * @param id ID da distribuição
   * @param distributionData Dados atualizados
   * @returns Distribuição atualizada
   */
  update: async (
    id: string,
    distributionData: UpdateDistributionDto
  ): Promise<Distribution> => {
    const response = await api.patch<Distribution>(
      `/distributions/${id}`,
      distributionData
    );
    return response.data;
  },

  /**
   * Remover distribuição
   * @param id ID da distribuição a ser removida
   * @returns void
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/distributions/${id}`);
  },

  /**
   * Obter estatísticas de distribuições
   * @param startDate Data inicial (opcional)
   * @param endDate Data final (opcional)
   * @returns Estatísticas de distribuições
   */
  getStats: async (
    startDate?: string,
    endDate?: string
  ): Promise<{
    total: number;
    byMonth: { month: string; count: number }[];
    byCategory: { category: string; count: number }[];
  }> => {
    const response = await api.get<{
      total: number;
      byMonth: { month: string; count: number }[];
      byCategory: { category: string; count: number }[];
    }>("/distributions/stats", {
      params: {
        startDate,
        endDate,
      },
    });
    return response.data;
  },

  /**
   * Obter distribuições por período
   * @param startDate Data inicial
   * @param endDate Data final
   * @param pageOptions Opções de paginação
   * @returns Lista paginada de distribuições
   */
  getByDateRange: async (
    startDate: string,
    endDate: string,
    pageOptions?: PageOptionsDto
  ): Promise<DistributionsPage> => {
    const response = await api.get<DistributionsPage>(
      "/distributions/date-range",
      {
        params: {
          ...pageOptions,
          startDate,
          endDate,
        },
      }
    );
    return response.data;
  },
};

export default DistributionsService;
