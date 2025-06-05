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

export interface AddressSuggestion {
  id: string;
  displayName: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postcode?: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  confidence: number; // Novo: score de confiança
  type: "exact" | "street" | "city" | "approximate"; // Novo: tipo de match
}

export interface GeocodingConfig {
  baseUrl?: string;
  userAgent?: string;
  rateLimit?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  defaultCountry?: string;
  cacheSize?: number;
  cacheExpiry?: number;
  enableLogging?: boolean;
}
