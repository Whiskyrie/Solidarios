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
    county?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

// Interface para sugestão de endereço formatada
export interface AddressSuggestion {
  id: string;
  displayName: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
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
   * Buscar endereços usando geocodificação direta
   * @param query Termo de busca para o endereço
   * @param countryCode Código do país (padrão: 'br' para Brasil)
   * @param limit Limite de resultados (padrão: 5)
   * @returns Lista de sugestões de endereço
   */
  async searchAddresses(
    query: string,
    countryCode: string = "br",
    limit: number = 5
  ): Promise<AddressSuggestion[]> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    try {
      const response = await axios.get<NominatimResponse[]>(
        `${this.baseUrl}/search`,
        {
          params: {
            q: query,
            format: "json",
            addressdetails: 1,
            limit,
            countrycodes: countryCode,
            "accept-language": "pt-BR,pt,en",
          },
          headers: {
            "User-Agent": this.userAgent,
          },
          timeout: 5000,
        }
      );

      this.lastRequestTime = Date.now();

      return response.data.map(this.formatAddressSuggestion);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
      throw new Error("Não foi possível buscar sugestões de endereço");
    }
  }

  /**
   * Formatar resposta do Nominatim para sugestão de endereço
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
      city: address.city || address.county,
      state: address.state,
      postalCode: address.postcode,
      country: address.country,
      coordinates: {
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      },
    };
  };
}

export default new GeocodingService();
