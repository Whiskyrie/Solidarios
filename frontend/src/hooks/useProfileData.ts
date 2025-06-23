import { useState, useEffect, useRef, useCallback } from "react";
import { Animated } from "react-native";
import { useAuth } from "./useAuth";
import api from "../api/api";
import { ANIMATION_DURATIONS } from "../components/constants/profileConstants";

interface ProfileStats {
  totalDonations: number;
  distributedItems: number;
  peopleHelped: number;
  impactScore: number;
}

export const useProfileData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalDonations: 0,
    distributedItems: 0,
    peopleHelped: 0,
    impactScore: 0, // Inicializando com 0
  });

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const loadProfileData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("useProfileData - Carregando dados para user:", user.id);

      // Usar o endpoint de stats do usuário
      const response = await api.get(`/users/${user.id}/stats`);
      console.log("useProfileData - Resposta da API:", response.data);

      const apiData = response.data;
      const mappedStats: ProfileStats = {
        totalDonations: apiData.totalDonations || 0,
        distributedItems: apiData.distributedItems || 0,
        peopleHelped: apiData.peopleHelped || 0,
        impactScore: apiData.impactScore || 0, // Garantir que impactScore seja sempre um número
      };

      console.log("useProfileData - Stats mapeados:", mappedStats);
      setStats(mappedStats);

      // Iniciar animações
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATIONS.fadeIn,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATIONS.slideIn,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      console.error("useProfileData - Erro:", err);
      setError("Não foi possível carregar os dados do perfil");

      // Manter valores zerados em caso de erro
      setStats({
        totalDonations: 0,
        distributedItems: 0,
        peopleHelped: 0,
        impactScore: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, fadeAnim, slideAnim]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const retry = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    loadProfileData();
  }, [fadeAnim, slideAnim, loadProfileData]);

  return {
    user,
    loading,
    error,
    stats,
    fadeAnim,
    slideAnim,
    retry,
  };
};
