import axios, { AxiosResponse, CancelTokenSource } from "axios";
import {
  NominatimResponse,
  AddressSuggestion,
  GeocodingConfig,
} from "../types/geocode.types";
interface CacheEntry {
  data: AddressSuggestion[];
  timestamp: number;
  hits: number; // Novo: contador de uso para LRU
}

interface RequestMetrics {
  totalRequests: number;
  cacheHits: number;
  errors: number;
  averageResponseTime: number;
}

class GeocodingService {
  private readonly config: Required<GeocodingConfig>;
  private lastRequestTime = 0;
  private cache = new Map<string, CacheEntry>();
  private metrics: RequestMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    errors: 0,
    averageResponseTime: 0,
  };
  private cancelTokens = new Map<string, CancelTokenSource>();

  constructor(config: GeocodingConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "https://nominatim.openstreetmap.org",
      userAgent: config.userAgent || "SolidariosApp/1.0",
      rateLimit: config.rateLimit || 1000,
      timeout: config.timeout || 8000,
      retryAttempts: config.retryAttempts || 2,
      retryDelay: config.retryDelay || 1000,
      defaultCountry: config.defaultCountry || "br",
      cacheSize: config.cacheSize || 100,
      cacheExpiry: config.cacheExpiry || 5 * 60 * 1000,
      enableLogging: config.enableLogging || false,
    };
  }

  /**
   * Preparar consulta com melhor normalização
   */
  private prepareQuery(query: string): string {
    let cleanQuery = query
      .trim()
      .toLowerCase()
      .normalize("NFD") // Normalizar acentos
      .replace(/[\u0300-\u036f]/g, "") // Remover diacríticos
      .replace(/\s+/g, " ")
      .replace(/[,;.]+/g, ",");

    // Expandir abreviações comuns
    const abbreviations: Record<string, string> = {
      "r.?": "rua",
      "av.?": "avenida",
      "al.?": "alameda",
      "tv.?": "travessa",
      "pç.?": "praça",
      "lg.?": "largo",
      "estr.?": "estrada",
      "rod.?": "rodovia",
      "cj.?": "conjunto",
      "qd.?": "quadra",
      "lt.?": "lote",
    };

    for (const [abbrev, full] of Object.entries(abbreviations)) {
      cleanQuery = cleanQuery.replace(
        new RegExp(`\\b${abbrev}\\b`, "gi"),
        full
      );
    }

    // Melhorar detecção de contexto geográfico
    const hasGeographicContext = this.hasGeographicContext(cleanQuery);
    if (!hasGeographicContext) {
      cleanQuery += `, ${
        this.config.defaultCountry === "br" ? "Brasil" : "Brazil"
      }`;
    }

    return cleanQuery;
  }

  /**
   * Verificar se a query já tem contexto geográfico
   */
  private hasGeographicContext(query: string): boolean {
    const geographicPatterns = [
      /\b(brasil|brazil)\b/i,
      /\b(sp|rj|mg|pr|rs|sc|ba|ce|pe|go|ma|pa|pb|pi|rn|ro|rr|se|to|al|ap|am|df|es|mt|ms|ac)\b/i,
      /\b(são paulo|rio de janeiro|belo horizonte|salvador|fortaleza|brasília|curitiba|recife|porto alegre|manaus|belém|goiânia|campinas|nova iguaçu|maceió|são luís|duque de caxias|natal|teresina|campo grande|osasco|santo andré|joão pessoa|jaboatão dos guararapes|contagem|são bernardo do campo|uberlândia|sorocaba|aracaju|feira de santana|cuiabá|joinville|juiz de fora|londrina|aparecida de goiânia|niterói|porto velho|serra|caxias do sul|campina grande|mauá|carapicuíba|olinda|são josé do rio preto|ribeirão preto|betim|diadema|jundiaí|franca|guarulhos|osasco|piracicaba|cariacica|itaquaquecetuba|taubaté|sumaré|taboão da serra|bauru|limeira|petrópolis|embu das artes|suzano|nova friburgo|governador valadares|volta redonda|petrolina|americana|cabo de santo agostinho|são vicente|pelotas|montes claros|são josé dos campos|anápolis|caucaia|vitória da conquista|itabuna|paulista|cascavel|marília|taubate|são carlos|presidente prudente|canoas|araraquara|jacareí|parnaíba|araçatuba|blumenau|são josé|praia grande|vila velha|guarujá|caruaru|itapevi|maringá|rio branco|vitória|nossa senhora do socorro|magé|santarém|paranaguá|rio grande|passo fundo|santa maria|lauro de freitas|mossoró|novo hamburgo|dourados|são leopoldo|palmas|cachoeirinha|angra dos reis|sapucaia do sul|juazeiro do norte|rio das ostras|jequié|viamão|boa vista|macapá|rio branco|porto velho|palmas|boa vista|macapá)\b/i,
    ];

    return geographicPatterns.some((pattern) => pattern.test(query));
  }

  /**
   * Implementar retry com backoff exponencial
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.config.retryAttempts) {
        throw error;
      }

      const delay = this.config.retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (this.config.enableLogging) {
        console.warn(`Retry attempt ${attempt + 1} after ${delay}ms`);
      }

      return this.retryWithBackoff(operation, attempt + 1);
    }
  }

  /**
   * Gerenciar cache com estratégia LRU
   */
  private manageCache(): void {
    if (this.cache.size <= this.config.cacheSize) return;

    // Encontrar entrada menos recentemente usada
    let lruKey: string | null = null;
    let minHits = Infinity;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (
        entry.hits < minHits ||
        (entry.hits === minHits && entry.timestamp < oldestTime)
      ) {
        lruKey = key;
        minHits = entry.hits;
        oldestTime = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Calcular score de confiança baseado em completude
   */
  private calculateConfidence(
    suggestion: AddressSuggestion,
    original: NominatimResponse
  ): number {
    let score = 0;

    // Fatores de confiança
    if (suggestion.number) score += 0.3;
    if (suggestion.street) score += 0.4;
    if (suggestion.neighborhood) score += 0.2;
    if (suggestion.city) score += 0.1;

    // Penalizar por falta de informações críticas
    if (!suggestion.street) score -= 0.3;
    if (!suggestion.city) score -= 0.2;

    // Ajustar baseado na importância do Nominatim
    const importanceBonus = Math.min(original.importance * 0.2, 0.2);
    score += importanceBonus;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determinar tipo de match
   */
  private determineMatchType(
    suggestion: AddressSuggestion
  ): AddressSuggestion["type"] {
    if (suggestion.number && suggestion.street) return "exact";
    if (suggestion.street) return "street";
    if (suggestion.city) return "city";
    return "approximate";
  }

  /**
   * Buscar endereços com melhorias de performance e resiliência
   */
  async searchAddresses(
    query: string,
    countryCode: string = this.config.defaultCountry,
    limit: number = 8
  ): Promise<AddressSuggestion[]> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    // Validação de entrada
    if (!query || query.trim().length < 2) {
      throw new Error("Query deve ter pelo menos 2 caracteres");
    }

    const cleanQuery = this.prepareQuery(query);
    const cacheKey = `${cleanQuery}:${countryCode}:${limit}`;

    // Verificar cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
      cached.hits++;
      this.metrics.cacheHits++;
      return cached.data;
    }

    // Cancelar requisição anterior se existir
    const existingCancel = this.cancelTokens.get(cacheKey);
    if (existingCancel) {
      existingCancel.cancel("Nova busca iniciada");
    }

    // Criar novo cancel token
    const cancelToken = axios.CancelToken.source();
    this.cancelTokens.set(cacheKey, cancelToken);

    try {
      // Rate limiting melhorado
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.config.rateLimit) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.rateLimit - timeSinceLastRequest)
        );
      }

      const results = await this.retryWithBackoff(async () => {
        const response: AxiosResponse<NominatimResponse[]> = await axios.get(
          `${this.config.baseUrl}/search`,
          {
            params: {
              q: cleanQuery,
              format: "json",
              addressdetails: 1,
              limit: Math.min(limit * 2, 20), // Buscar mais para filtrar melhor
              countrycodes: countryCode,
              "accept-language": "pt-BR,pt,en",
              dedupe: 1,
              extratags: 1,
              namedetails: 1,
              bounded: 0,
            },
            headers: {
              "User-Agent": this.config.userAgent,
            },
            timeout: this.config.timeout,
            cancelToken: cancelToken.token,
          }
        );

        // Validar resposta
        if (!Array.isArray(response.data)) {
          throw new Error("Resposta inválida da API");
        }

        return response.data;
      });

      this.lastRequestTime = Date.now();

      // Processar e formatar resultados
      const formatted = results
        .map((item) => {
          const suggestion = this.formatAddressSuggestion(item);
          suggestion.confidence = this.calculateConfidence(suggestion, item);
          suggestion.type = this.determineMatchType(suggestion);
          return suggestion;
        })
        .filter(this.filterRelevantResults)
        .sort(this.sortByRelevance)
        .slice(0, limit);

      // Salvar no cache
      this.manageCache();
      this.cache.set(cacheKey, {
        data: formatted,
        timestamp: Date.now(),
        hits: 1,
      });

      // Atualizar métricas
      const responseTime = Date.now() - startTime;
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime + responseTime) / 2;

      return formatted;
    } catch (error: any) {
      this.metrics.errors++;

      if (axios.isCancel(error)) {
        throw new Error("Busca cancelada");
      }

      if (this.config.enableLogging) {
        console.error("Erro na geocodificação:", error);
      }

      throw new Error("Não foi possível buscar sugestões de endereço");
    } finally {
      this.cancelTokens.delete(cacheKey);
    }
  }

  /**
   * Geocodificação reversa (coordenadas -> endereço)
   */
  async reverseGeocode(
    lat: number,
    lon: number
  ): Promise<AddressSuggestion | null> {
    try {
      const response = await axios.get<NominatimResponse>(
        `${this.config.baseUrl}/reverse`,
        {
          params: {
            lat,
            lon,
            format: "json",
            addressdetails: 1,
            "accept-language": "pt-BR,pt,en",
          },
          headers: {
            "User-Agent": this.config.userAgent,
          },
          timeout: this.config.timeout,
        }
      );

      const suggestion = this.formatAddressSuggestion(response.data);
      suggestion.confidence = this.calculateConfidence(
        suggestion,
        response.data
      );
      suggestion.type = this.determineMatchType(suggestion);

      return suggestion;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error("Erro na geocodificação reversa:", error);
      }
      return null;
    }
  }

  /**
   * Filtrar resultados com critérios mais rigorosos
   */
  private filterRelevantResults = (suggestion: AddressSuggestion): boolean => {
    // Deve ter pelo menos cidade
    if (!suggestion.city) return false;

    // Preferir resultados com maior confiança
    if (suggestion.confidence < 0.3) return false;

    // Filtrar tipos de lugares irrelevantes poderia ser adicionado aqui
    return true;
  };

  /**
   * Ordenação melhorada com múltiplos critérios
   */
  private sortByRelevance = (
    a: AddressSuggestion,
    b: AddressSuggestion
  ): number => {
    // 1. Por confiança (mais importante)
    const confidenceDiff = b.confidence - a.confidence;
    if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;

    // 2. Por tipo de match
    const typeOrder = { exact: 4, street: 3, city: 2, approximate: 1 };
    const typeDiff = typeOrder[b.type] - typeOrder[a.type];
    if (typeDiff !== 0) return typeDiff;

    // 3. Por completude de informações
    const aCompleteness = [a.number, a.street, a.neighborhood, a.city].filter(
      Boolean
    ).length;
    const bCompleteness = [b.number, b.street, b.neighborhood, b.city].filter(
      Boolean
    ).length;

    return bCompleteness - aCompleteness;
  };

  /**
   * Formatação aprimorada
   */
  private formatAddressSuggestion = (
    item: NominatimResponse
  ): AddressSuggestion => {
    const { address } = item;

    return {
      id: item.place_id.toString(),
      displayName: item.display_name,
      street: address.road,
      number: address.house_number,
      neighborhood: address.suburb || address.city_district,
      city: address.city || address.town || address.village,
      state: address.state || address.state_district,
      postcode: address.postcode,
      coordinates: {
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      },
      confidence: 0, // Será calculado depois
      type: "approximate", // Será determinado depois
    };
  };

  /**
   * Obter métricas de performance
   */
  getMetrics(): RequestMetrics & { cacheSize: number } {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Limpar cache manualmente
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Pré-carregar endereços populares (pode ser útil)
   */
  async preloadPopularAddresses(addresses: string[]): Promise<void> {
    const promises = addresses.map(
      (address) =>
        this.searchAddresses(address, this.config.defaultCountry, 3).catch(
          () => []
        ) // Ignorar erros no preload
    );

    await Promise.allSettled(promises);
  }
}

export default GeocodingService;
