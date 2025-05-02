/**
 * Definição de tipos para distribuições
 * Baseado nas entidades e DTOs do backend
 */
import { User } from "./users.types";
import { Item } from "./items.types";
import { PageDto } from "./users.types";

export interface Distribution {
  id: string;
  date: string;
  beneficiary: User;
  beneficiaryId: string;
  employee: User;
  employeeId: string;
  items: Item[];
  observations?: string;
}

export interface CreateDistributionDto {
  beneficiaryId: string;
  employeeId: string;
  itemIds: string[];
  observations?: string;
}

export interface UpdateDistributionDto {
  beneficiaryId?: string;
  employeeId?: string;
  itemIds?: string[];
  observations?: string;
}

// Tipo para distribuições paginadas
export type DistributionsPage = PageDto<Distribution>;
