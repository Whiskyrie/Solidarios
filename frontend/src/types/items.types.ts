/**
 * Definição de tipos para itens/doações
 * Baseado nas entidades e DTOs do backend
 */
import { User } from "./users.types";
import { Category } from "./categories.types";
import { PageDto } from "./users.types";

export enum ItemType {
  ROUPA = "roupa",
  CALCADO = "calcado",
  UTENSILIO = "utensilio",
  OUTRO = "outro",
}

export enum ItemStatus {
  DISPONIVEL = "disponivel",
  RESERVADO = "reservado",
  DISTRIBUIDO = "distribuido",
}

export interface Item {
  // Campos obrigatórios com verificação de nulidade
  id: string;
  type: ItemType;
  description: string;
  receivedDate: string;
  status: ItemStatus;
  donorId: string;

  // Campos opcionais
  conservationState?: string | null;
  size?: string | null;
  photos?: string[] | null;
  categoryId?: string | null;

  // Relacionamentos que podem vir nulos da API
  donor?: User | null;
  category?: Category | null;
}

// Interface para respostas da API que incluem items
export interface ItemsResponse {
  data: Item[];
  meta: {
    page: number;
    take: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

// Interface para respostas aninhadas da API
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
  timestamp: string;
}

// Tipo combinado para diferentes possibilidades de resposta da API
export type ItemsApiResponse =
  | ApiResponse<ItemsResponse> // Resposta aninhada: {data: {data: Item[], meta: {...}}, statusCode: ...}
  | ItemsResponse // Resposta direta: {data: Item[], meta: {...}}
  | Item[]; // Apenas array de itens: Item[]

export interface CreateItemDto {
  type: ItemType;
  description: string;
  conservationState?: string;
  size?: string;
  status?: ItemStatus;
  photos?: string[];
  donorId: string;
  categoryId?: string;
}

export interface UpdateItemDto {
  type?: ItemType;
  description?: string;
  conservationState?: string;
  size?: string;
  status?: ItemStatus;
  photos?: string[];
  donorId?: string;
  categoryId?: string;
}

// Tipo para itens paginados
export interface DonorStatsDto {
  donorId: string;
  totalDonations: number;
  availableItems: number;
  distributedItems: number;
  reservedItems: number;
  peopleHelped: number;
  impactScore: number;
  donationsByCategory: Array<{
    categoryName: string;
    count: number;
  }>;
  donationsByType: Array<{
    type: string;
    count: number;
  }>;
  lastDonationDate?: Date;
  averageDonationInterval?: number;
  lastUpdated: Date;
}

export type ItemsPage = PageDto<Item>;

export interface ItemHistory {
  id: string;
  itemId: string;
  action: ItemAction;
  description: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export enum ItemAction {
  CREATED = "created",
  UPDATED = "updated",
  RESERVED = "reserved",
  DISTRIBUTED = "distributed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

export interface ItemStats {
  totalViews: number;
  interestedUsers: number;
  averageTimeToDistribute?: number;
  completionRate: number;
}

export interface ItemFilters {
  status?: ItemStatus | ItemStatus[];
  categoryId?: string;
  location?: {
    city?: string;
    state?: string;
    radius?: number;
    lat?: number;
    lng?: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: ItemSortOptions;
  searchQuery?: string;
}

export enum ItemSortOptions {
  NEWEST = "newest",
  OLDEST = "oldest",
  NAME_ASC = "name_asc",
  NAME_DESC = "name_desc",
  STATUS = "status",
  CATEGORY = "category",
}

export interface ItemRequest {
  id: string;
  itemId: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export enum RequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface CreateItemRequest {
  description: string;
  categoryId: string;
  images?: string[];
  location?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  availableUntil?: string;
  notes?: string;
}

export interface UpdateItemRequest {
  description?: string;
  categoryId?: string;
  images?: string[];
  status?: ItemStatus;
  availableUntil?: string;
  notes?: string;
}

export interface ItemDistribution {
  id: string;
  itemId: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  distributionDate: string;
  deliveryMethod: DeliveryMethod;
  notes?: string;
  rating?: number;
  feedback?: string;
}

export enum DeliveryMethod {
  PICKUP = "pickup",
  DELIVERY = "delivery",
  MEETING_POINT = "meeting_point",
}
