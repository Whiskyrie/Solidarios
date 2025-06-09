import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryDto } from './create-inventory.dto';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {
  @ApiPropertyOptional({
    example: 'uuid-do-item',
    description: 'ID do item no estoque',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do item inválido' })
  itemId?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Quantidade do item no estoque',
  })
  @IsOptional()
  @IsNumber({}, { message: 'A quantidade deve ser um número' })
  @IsPositive({ message: 'A quantidade deve ser um número positivo' })
  quantity?: number;

  @ApiPropertyOptional({
    example: 'Prateleira A3',
    description: 'Localização do item no estoque',
  })
  @IsOptional()
  @IsString({ message: 'A localização deve ser uma string' })
  location?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Nível mínimo para alerta de estoque baixo',
  })
  @IsOptional()
  @IsNumber({}, { message: 'O nível de alerta deve ser um número' })
  @IsPositive({ message: 'O nível de alerta deve ser um número positivo' })
  alertLevel?: number;
}
