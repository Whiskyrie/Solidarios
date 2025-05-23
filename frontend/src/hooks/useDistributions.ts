/**
 * Hook personalizado para gerenciamento de distribuições
 */
import { useCallback, useState } from "react";
import DistributionsService from "../api/distributions";
import {
  Distribution,
  CreateDistributionDto,
  UpdateDistributionDto,
  DistributionsPage,
} from "../types/distributions.types";
import { PageOptionsDto } from "../types/common.types";

// Hook para gerenciamento de distribuições
export const useDistributions = () => {
  // Estados locais - CORREÇÃO: Sempre inicializar como array
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    byMonth: { month: string; count: number }[];
    byCategory: { category: string; count: number }[];
  } | null>(null);
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

  // Função para garantir que sempre temos um array válido
  const ensureArray = useCallback((data: any): Distribution[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    console.warn(
      "[useDistributions] Dados não são um array válido:",
      typeof data
    );
    return [];
  }, []);

  // CORREÇÃO: Função para obter todas as distribuições com paginação
  const fetchDistributions = useCallback(
    async (pageOptions?: PageOptionsDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await DistributionsService.getAll(pageOptions);

        // CORREÇÃO: Garantir que sempre setamos um array válido
        const distributionsArray = ensureArray(response.data);
        setDistributions(distributionsArray);

        setPagination({
          page: response.meta?.page || 1,
          totalPages: response.meta?.pageCount || 1,
          totalItems: response.meta?.itemCount || 0,
        });
        return response;
      } catch (err: any) {
        setError(err.message || "Erro ao buscar distribuições");
        // CORREÇÃO: Em caso de erro, garantir que distributions seja um array vazio
        setDistributions([]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [ensureArray]
  );

  // CORREÇÃO: Função para obter uma distribuição por ID
  const fetchDistributionById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await DistributionsService.getById(id);
      setDistribution(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar distribuição");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // CORREÇÃO: Função para obter distribuições por beneficiário
  const fetchDistributionsByBeneficiary = useCallback(
    async (beneficiaryId: string, pageOptions?: PageOptionsDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await DistributionsService.getByBeneficiary(
          beneficiaryId,
          pageOptions
        );

        // CORREÇÃO: Garantir que sempre setamos um array válido
        const distributionsArray = ensureArray(response.data);
        setDistributions(distributionsArray);

        setPagination({
          page: response.meta?.page || 1,
          totalPages: response.meta?.pageCount || 1,
          totalItems: response.meta?.itemCount || 0,
        });
        return response;
      } catch (err: any) {
        setError(err.message || "Erro ao buscar distribuições do beneficiário");
        // CORREÇÃO: Em caso de erro, garantir que distributions seja um array vazio
        setDistributions([]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [ensureArray]
  );

  // CORREÇÃO: Função para criar uma nova distribuição
  const createDistribution = useCallback(
    async (distributionData: CreateDistributionDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await DistributionsService.create(distributionData);
        setDistribution(data);

        // CORREÇÃO: Atualizar a lista garantindo que é um array
        setDistributions((prev) => {
          const currentArray = ensureArray(prev);
          return [...currentArray, data];
        });
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao criar distribuição");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [ensureArray]
  );

  // CORREÇÃO: Função para atualizar uma distribuição existente
  const updateDistribution = useCallback(
    async (id: string, distributionData: UpdateDistributionDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await DistributionsService.update(id, distributionData);
        setDistribution(data);

        // CORREÇÃO: Atualizar a lista garantindo que é um array
        setDistributions((prev) => {
          const currentArray = ensureArray(prev);
          return currentArray.map((d) => (d.id === id ? data : d));
        });
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao atualizar distribuição");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [ensureArray]
  );

  // CORREÇÃO: Função para remover uma distribuição
  const removeDistribution = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await DistributionsService.remove(id);

        // CORREÇÃO: Atualizar a lista garantindo que é um array
        setDistributions((prev) => {
          const currentArray = ensureArray(prev);
          return currentArray.filter((d) => d.id !== id);
        });
        return true;
      } catch (err: any) {
        setError(err.message || "Erro ao remover distribuição");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [ensureArray]
  );

  // Função para obter estatísticas de distribuições
  const fetchDistributionStats = useCallback(
    async (startDate?: string, endDate?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await DistributionsService.getStats(startDate, endDate);
        setStats(data);
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao buscar estatísticas de distribuições");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // CORREÇÃO: Função para obter distribuições por período
  const fetchDistributionsByDateRange = useCallback(
    async (
      startDate: string,
      endDate: string,
      pageOptions?: PageOptionsDto
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await DistributionsService.getByDateRange(
          startDate,
          endDate,
          pageOptions
        );

        // CORREÇÃO: Garantir que sempre setamos um array válido
        const distributionsArray = ensureArray(response.data);
        setDistributions(distributionsArray);

        setPagination({
          page: response.meta?.page || 1,
          totalPages: response.meta?.pageCount || 1,
          totalItems: response.meta?.itemCount || 0,
        });
        return response;
      } catch (err: any) {
        setError(err.message || "Erro ao buscar distribuições por período");
        // CORREÇÃO: Em caso de erro, garantir que distributions seja um array vazio
        setDistributions([]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [ensureArray]
  );

  // Retornar as funções e estado
  return {
    // Estado
    distributions,
    distribution,
    stats,
    isLoading,
    error,
    pagination,

    // Ações
    fetchDistributions,
    fetchDistributionById,
    fetchDistributionsByBeneficiary,
    createDistribution,
    updateDistribution,
    removeDistribution,
    fetchDistributionStats,
    fetchDistributionsByDateRange,
    clearError,
  };
};

export default useDistributions;
