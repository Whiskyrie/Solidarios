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
    debounceMs = 500,
    minQueryLength = 3,
    maxSuggestions = 5,
    countryCode = "br",
  } = options;

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache para evitar requisições desnecessárias
  const cacheRef = useRef<Map<string, AddressSuggestion[]>>(new Map());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentQueryRef = useRef<string>("");

  /**
   * Buscar sugestões de endereço
   */
  const searchAddresses = useCallback(
    async (query: string) => {
      if (query.length < minQueryLength) {
        setSuggestions([]);
        return;
      }

      // Verificar cache primeiro
      const cached = cacheRef.current.get(query.toLowerCase());
      if (cached) {
        setSuggestions(cached);
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
          // Salvar no cache
          cacheRef.current.set(query.toLowerCase(), results);
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
    [minQueryLength, maxSuggestions, countryCode]
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

  /**
   * Limpar cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
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
    clearCache,
  };
};

export default useGeocoding;
