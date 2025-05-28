/**
 * Hook para autocompletar endereços com debounce e cache
 */
import { useState, useCallback, useRef, useEffect } from "react";
import GeocodingService, { AddressSuggestion } from "../api/geocoding";

interface UseGeocodingOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
  countryCode?: string;
}

export const useGeocoding = (options: UseGeocodingOptions = {}) => {
  const {
    debounceMs = 300,
    minQueryLength = 3,
    maxSuggestions = 8,
    countryCode = "br",
  } = options;

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache inteligente com limpeza automática
  const cacheRef = useRef<
    Map<string, { data: AddressSuggestion[]; timestamp: number }>
  >(new Map());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentQueryRef = useRef<string>("");
  const cacheExpiryTime = 5 * 60 * 1000; // 5 minutos

  /**
   * Limpar cache expirado
   */
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of cacheRef.current.entries()) {
      if (now - value.timestamp > cacheExpiryTime) {
        cacheRef.current.delete(key);
      }
    }
  }, [cacheExpiryTime]);

  /**
   * Buscar sugestões de endereço
   */
  const searchAddresses = useCallback(
    async (query: string) => {
      if (query.length < minQueryLength) {
        setSuggestions([]);
        return;
      }

      const cacheKey = query.toLowerCase().trim();

      // Limpar cache expirado
      cleanExpiredCache();

      // Verificar cache primeiro
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheExpiryTime) {
        setSuggestions(cached.data);
        return;
      }

      setIsLoading(true);
      setError(null);
      currentQueryRef.current = query;

      try {
        const results = await GeocodingService.searchAddresses(
          query,
          countryCode,
          maxSuggestions
        );

        // Verificar se ainda é a consulta mais recente
        if (currentQueryRef.current === query) {
          setSuggestions(results);
          // Salvar no cache com timestamp
          cacheRef.current.set(cacheKey, {
            data: results,
            timestamp: Date.now(),
          });
        }
      } catch (err: any) {
        if (currentQueryRef.current === query) {
          setError(err.message || "Erro ao buscar endereços");
          setSuggestions([]);
        }
      } finally {
        if (currentQueryRef.current === query) {
          setIsLoading(false);
        }
      }
    },
    [
      minQueryLength,
      maxSuggestions,
      countryCode,
      cleanExpiredCache,
      cacheExpiryTime,
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

      debounceRef.current = setTimeout(() => {
        searchAddresses(query);
      }, debounceMs);
    },
    [searchAddresses, debounceMs]
  );

  /**
   * Limpar sugestões
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    searchAddresses: debouncedSearch,
    clearSuggestions,
  };
};

export default useGeocoding;
