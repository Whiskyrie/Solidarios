import axios from "axios";

export interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

// Interface para sugestão de endereço formatada - SIMPLIFICADA
export interface AddressSuggestion {
  id: string;
  displayName: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

class GeocodingService {
  private readonly baseUrl = "https://nominatim.openstreetmap.org";
  private readonly userAgent = "SolidariosApp/1.0";

  // Rate limiting - máximo de 1 requisição por segundo
  private lastRequestTime = 0;
  private readonly minInterval = 1000; // 1 segundo

  /**
   * Preparar consulta para melhor precisão
   */
  private prepareQuery(query: string): string {
    // Limpar e normalizar a consulta
    let cleanQuery = query
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ") // Múltiplos espaços por um só
      .replace(/[,;.]+/g, ",") // Normalizar separadores
      .replace(
        /\b(rua|av|avenida|travessa|alameda|praça|largo|estrada)\b/gi,
        (match) => {
          const normalized = {
            rua: "rua",
            av: "avenida",
            avenida: "avenida",
            travessa: "travessa",
            alameda: "alameda",
            praça: "praça",
            largo: "largo",
            estrada: "estrada",
          };
          return (
            normalized[match.toLowerCase() as keyof typeof normalized] || match
          );
        }
      );

    // Adicionar contexto do Brasil se não houver referência geográfica
    if (
      !cleanQuery.includes("brasil") &&
      !cleanQuery.includes("brazil") &&
      !cleanQuery.includes(" sp ") &&
      !cleanQuery.includes(" rj ") &&
      !cleanQuery.includes(" mg ") &&
      !cleanQuery.includes(" pr ") &&
      !cleanQuery.match(
        /\b(são paulo|rio de janeiro|minas gerais|paraná|bahia|ceará|pernambuco|rio grande do sul|santa catarina|goiás|maranhão|acre|alagoas|amapá|amazonas|distrito federal|espírito santo|mato grosso|mato grosso do sul|pará|paraíba|piauí|rondônia|roraima|sergipe|tocantins)\b/i
      )
    ) {
      cleanQuery += ", Brasil";
    }

    return cleanQuery;
  }

  /**
   * Buscar endereços usando geocodificação direta
   * @param query Termo de busca para o endereço
   * @param countryCode Código do país (padrão: 'br' para Brasil)
   * @param limit Limite de resultados (padrão: 5)
   * @returns Lista de sugestões de endereço
   */
  async searchAddresses(
    query: string,
    countryCode: string = "br",
    limit: number = 8
  ): Promise<AddressSuggestion[]> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    const preparedQuery = this.prepareQuery(query);

    try {
      const response = await axios.get<NominatimResponse[]>(
        `${this.baseUrl}/search`,
        {
          params: {
            q: preparedQuery,
            format: "json",
            addressdetails: 1,
            limit,
            countrycodes: countryCode,
            "accept-language": "pt-BR,pt,en",
            dedupe: 1, // Remover duplicatas
            extratags: 1, // Tags extras para melhor contexto
            namedetails: 1, // Detalhes do nome
            bounded: 0, // Não limitar à área específica
            exclude_place_ids: "", // Não excluir lugares
          },
          headers: {
            "User-Agent": this.userAgent,
          },
          timeout: 8000, // Aumentar timeout
        }
      );

      this.lastRequestTime = Date.now();

      // Filtrar e ordenar resultados por relevância
      const formatted = response.data
        .map(this.formatAddressSuggestion)
        .filter(this.filterRelevantResults)
        .sort(this.sortByRelevance);

      return formatted.slice(0, limit);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
      throw new Error("Não foi possível buscar sugestões de endereço");
    }
  }

  /**
   * Filtrar resultados relevantes - FOCO NO ESSENCIAL
   */
  private filterRelevantResults = (suggestion: AddressSuggestion): boolean => {
    // Deve ter pelo menos rua E cidade
    if (!suggestion.street || !suggestion.city) return false;

    // Preferir endereços com bairro
    return true;
  };

  /**
   * Ordenar por relevância - PRIORIZAR COMPLETUDE
   */
  private sortByRelevance = (
    a: AddressSuggestion,
    b: AddressSuggestion
  ): number => {
    // Priorizar endereços com número
    if (a.number && !b.number) return -1;
    if (!a.number && b.number) return 1;

    // Priorizar endereços com bairro
    if (a.neighborhood && !b.neighborhood) return -1;
    if (!a.neighborhood && b.neighborhood) return 1;

    return 0;
  };

  /**
   * Formatar resposta do Nominatim - APENAS CAMPOS ESSENCIAIS
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
      coordinates: {
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      },
    };
  };
}

export default new GeocodingService();
