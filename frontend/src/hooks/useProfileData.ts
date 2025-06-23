import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";
import api from "../api/api";

interface ProfileStats {
  totalDonations: number;
  distributedItems: number;
  peopleHelped: number;
  impactScore: number;
}

export const useProfileData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalDonations: 0,
    distributedItems: 0,
    peopleHelped: 0,
    impactScore: 0,
  });

  // ✅ Ref para controlar se já carregou dados
  const hasLoadedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // ✅ Função de load simplificada SEM dependências problemáticas
  const loadProfileData = useCallback(
    async (force = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Evitar carregamentos múltiplos desnecessários
      if (hasLoadedRef.current && !force) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("useProfileData - Carregando dados para user:", user.id);
        const response = await api.get(`/users/${user.id}/stats`);
        console.log("useProfileData - Resposta da API:", response.data);

        if (!isMountedRef.current) return;

        const apiData = response.data;
        const mappedStats: ProfileStats = {
          totalDonations: apiData.totalDonations || 0,
          distributedItems: apiData.distributedItems || 0,
          peopleHelped: apiData.peopleHelped || 0,
          impactScore: apiData.impactScore || 0,
        };

        console.log("useProfileData - Stats mapeados:", mappedStats);
        setStats(mappedStats);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error("useProfileData - Erro:", err);
        if (!isMountedRef.current) return;

        setError("Não foi possível carregar os dados do perfil");
        setStats({
          totalDonations: 0,
          distributedItems: 0,
          peopleHelped: 0,
          impactScore: 0,
        });
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [user?.id]
  ); // ✅ APENAS user?.id como dependência

  // ✅ useEffect simplificado
  useEffect(() => {
    isMountedRef.current = true;
    hasLoadedRef.current = false;

    loadProfileData();

    return () => {
      isMountedRef.current = false;
    };
  }, [user?.id]); // ✅ APENAS user?.id

  // ✅ Função de retry que força reload
  const retry = useCallback(() => {
    hasLoadedRef.current = false;
    loadProfileData(true);
  }, [loadProfileData]);

  return {
    user,
    loading,
    error,
    stats,
    retry,
  };
};
