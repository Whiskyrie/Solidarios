import { useState, useEffect, useRef, useCallback } from "react";
import { Animated } from "react-native";
import { useAuth } from "./useAuth";
import { ANIMATION_DURATIONS } from "../components/constants/profileConstants";

interface ProfileStats {
  totalDonations: number;
  distributedItems: number;
  peopleHelped: number;
}

export const useProfileData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalDonations: 0,
    distributedItems: 0,
    peopleHelped: 0,
  });

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("loadProfileData - Iniciando carregamento...");

      // TODO: Substituir por chamada real da API
      // const response = await profileService.getProfileStats(user?.id);

      // Por enquanto, simular carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // IMPORTANTE: Usar dados reais da API aqui
      const realStats: ProfileStats = {
        totalDonations: 0, // Dados reais da API
        distributedItems: 0, // Dados reais da API
        peopleHelped: 0, // Dados reais da API
      };

      console.log("loadProfileData - Dados carregados:", realStats);
      setStats(realStats);

      // Iniciar animações apenas uma vez
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
      console.error("Erro ao carregar dados do perfil:", err);
      setError("Não foi possível carregar os dados do perfil");
    } finally {
      setLoading(false);
    }
  }, [fadeAnim, slideAnim]); // Dependências fixas

  useEffect(() => {
    if (user?.id) {
      console.log("useProfileData - Carregando dados para user:", user.id);
      loadProfileData();
    }
  }, [user?.id, loadProfileData]); // Apenas user.id como dependência

  const retry = useCallback(() => {
    // Reset animations
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
