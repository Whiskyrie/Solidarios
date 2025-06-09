import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AddressSuggestion, GeocodingConfig } from "../types/geocode.types";
import GeocodingService from "../api/geocoding";

interface UseGeocodingOptions extends GeocodingConfig {
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
  countryCode?: string;
  autoSelect?: boolean; // Auto-selecionar primeiro resultado de alta confiança
  prefetchPopular?: string[]; // Endereços para pré-carregar
  onError?: (error: string) => void;
  onSuccess?: (results: AddressSuggestion[]) => void;
}

interface GeocodingState {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  error: string | null;
  hasResults: boolean;
  confidence: "high" | "medium" | "low" | null;
  selectedSuggestion: AddressSuggestion | null;
  metrics: {
    totalSearches: number;
    cacheHits: number;
    averageResponseTime: number;
  };
}

export const useGeocoding = (options: UseGeocodingOptions = {}) => {
  const {
    debounceMs = 300,
    minQueryLength = 3,
    maxSuggestions = 8,
    countryCode = "br",
    autoSelect = false,
    prefetchPopular = [],
    onError,
    onSuccess,
    enableLogging = false,
    ...geocodingConfig
  } = options;

  // Criar instância do serviço com configuração personalizada
  const geocodingService = useMemo(
    () =>
      new GeocodingService({
        ...geocodingConfig,
        enableLogging,
      }),
    [geocodingConfig, enableLogging]
  );

  const [state, setState] = useState<GeocodingState>({
    suggestions: [],
    isLoading: false,
    error: null,
    hasResults: false,
    confidence: null,
    selectedSuggestion: null,
    metrics: {
      totalSearches: 0,
      cacheHits: 0,
      averageResponseTime: 0,
    },
  });

  // Refs para controle de estado
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentQueryRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchStartTimeRef = useRef<number>(0);

  /**
   * Avaliar confiança geral dos resultados
   */
  const evaluateConfidence = useCallback((suggestions: AddressSuggestion[]) => {
    if (suggestions.length === 0) return null;

    const avgConfidence =
      suggestions.reduce((sum, s) => sum + s.confidence, 0) /
      suggestions.length;

    if (avgConfidence >= 0.8) return "high";
    if (avgConfidence >= 0.6) return "medium";
    return "low";
  }, []);

  /**
   * Auto-seleção inteligente
   */
  const autoSelectBestMatch = useCallback(
    (suggestions: AddressSuggestion[]) => {
      if (!autoSelect || suggestions.length === 0) return null;

      const firstResult = suggestions[0];
      // Auto-selecionar apenas se confiança for muito alta
      if (firstResult.confidence >= 0.9 && firstResult.type === "exact") {
        return firstResult;
      }

      return null;
    },
    [autoSelect]
  );

  /**
   * Atualizar métricas internas
   */
  const updateMetrics = useCallback(
    (fromCache: boolean = false) => {
      const serviceMetrics = geocodingService.getMetrics();

      setState((prev) => ({
        ...prev,
        metrics: {
          totalSearches: prev.metrics.totalSearches + 1,
          cacheHits: fromCache
            ? prev.metrics.cacheHits + 1
            : prev.metrics.cacheHits,
          averageResponseTime: serviceMetrics.averageResponseTime,
        },
      }));
    },
    [geocodingService]
  );

  /**
   * Buscar sugestões de endereço
   */
  const searchAddresses = useCallback(
    async (query: string, _immediate: boolean = false) => {
      if (query.length < minQueryLength) {
        setState((prev) => ({
          ...prev,
          suggestions: [],
          hasResults: false,
          confidence: null,
          selectedSuggestion: null,
          error: null,
        }));
        return;
      }

      // Cancelar busca anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      currentQueryRef.current = query;
      searchStartTimeRef.current = Date.now();

      try {
        const results = await geocodingService.searchAddresses(
          query,
          countryCode,
          maxSuggestions
        );

        // Verificar se ainda é a consulta mais recente
        if (currentQueryRef.current === query) {
          const confidence = evaluateConfidence(results);
          const selectedSuggestion = autoSelectBestMatch(results);

          setState((prev) => ({
            ...prev,
            suggestions: results,
            hasResults: results.length > 0,
            confidence,
            selectedSuggestion,
            isLoading: false,
          }));

          updateMetrics();
          onSuccess?.(results);

          if (enableLogging) {
            console.log(
              `Geocoding: Found ${results.length} results for "${query}"`
            );
          }
        }
      } catch (err: any) {
        if (currentQueryRef.current === query) {
          const errorMessage = err.message || "Erro ao buscar endereços";

          setState((prev) => ({
            ...prev,
            error: errorMessage,
            suggestions: [],
            hasResults: false,
            confidence: null,
            selectedSuggestion: null,
            isLoading: false,
          }));

          onError?.(errorMessage);

          if (enableLogging) {
            console.error(`Geocoding error for "${query}":`, err);
          }
        }
      }
    },
    [
      minQueryLength,
      maxSuggestions,
      countryCode,
      geocodingService,
      evaluateConfidence,
      autoSelectBestMatch,
      updateMetrics,
      onSuccess,
      onError,
      enableLogging,
    ]
  );

  /**
   * Buscar com debounce
   */
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Busca imediata para queries muito específicas (ex: CEP)
      const isImmediate = /^\d{5}-?\d{3}$/.test(query.trim()); // CEP brasileiro

      if (isImmediate) {
        searchAddresses(query, true);
      } else {
        debounceRef.current = setTimeout(() => {
          searchAddresses(query);
        }, debounceMs);
      }
    },
    [searchAddresses, debounceMs]
  );

  /**
   * Geocodificação reversa
   */
  const reverseGeocode = useCallback(
    async (lat: number, lon: number) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await geocodingService.reverseGeocode(lat, lon);

        if (result) {
          setState((prev) => ({
            ...prev,
            suggestions: [result],
            hasResults: true,
            confidence:
              result.confidence >= 0.8
                ? "high"
                : result.confidence >= 0.6
                ? "medium"
                : "low",
            selectedSuggestion: result,
            isLoading: false,
          }));

          return result;
        } else {
          setState((prev) => ({
            ...prev,
            error: "Não foi possível encontrar endereço para as coordenadas",
            suggestions: [],
            hasResults: false,
            confidence: null,
            selectedSuggestion: null,
            isLoading: false,
          }));
        }
      } catch (err: any) {
        const errorMessage = err.message || "Erro na geocodificação reversa";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        onError?.(errorMessage);
      }

      return null;
    },
    [geocodingService, onError]
  );

  /**
   * Selecionar sugestão manualmente
   */
  const selectSuggestion = useCallback(
    (suggestion: AddressSuggestion | null) => {
      setState((prev) => ({
        ...prev,
        selectedSuggestion: suggestion,
      }));
    },
    []
  );

  /**
   * Limpar sugestões e estado
   */
  const clearSuggestions = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      suggestions: [],
      isLoading: false,
      error: null,
      hasResults: false,
      confidence: null,
      selectedSuggestion: null,
      metrics: {
        totalSearches: 0,
        cacheHits: 0,
        averageResponseTime: 0,
      },
    });

    currentQueryRef.current = "";
  }, []);

  /**
   * Retry da última busca
   */
  const retryLastSearch = useCallback(() => {
    if (currentQueryRef.current) {
      searchAddresses(currentQueryRef.current, true);
    }
  }, [searchAddresses]);

  /**
   * Pré-carregar endereços populares
   */
  useEffect(() => {
    if (prefetchPopular.length > 0) {
      geocodingService
        .preloadPopularAddresses(prefetchPopular)
        .then(() => {
          if (enableLogging) {
            console.log(
              "Preload concluído:",
              prefetchPopular.length,
              "endereços"
            );
          }
        })
        .catch((err) => {
          if (enableLogging) {
            console.warn("Erro no preload:", err);
          }
        });
    }
  }, [prefetchPopular, geocodingService, enableLogging]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Estado principal
    ...state,

    // Ações
    searchAddresses: debouncedSearch,
    reverseGeocode,
    selectSuggestion,
    clearSuggestions,
    retryLastSearch,

    // Utilidades
    clearCache: useCallback(
      () => geocodingService.clearCache(),
      [geocodingService]
    ),
    getServiceMetrics: useCallback(
      () => geocodingService.getMetrics(),
      [geocodingService]
    ),

    // Estado computado
    isEmpty: state.suggestions.length === 0,
    hasHighConfidence: state.confidence === "high",
    hasMediumConfidence: state.confidence === "medium",
    hasLowConfidence: state.confidence === "low",

    // Helpers para UI
    getSuggestionsByType: useCallback(
      (type: AddressSuggestion["type"]) =>
        state.suggestions.filter((s) => s.type === type),
      [state.suggestions]
    ),

    getHighConfidenceSuggestions: useCallback(
      () => state.suggestions.filter((s) => s.confidence >= 0.8),
      [state.suggestions]
    ),
  };
};

export default useGeocoding;
