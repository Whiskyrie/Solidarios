import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDto } from './create-item.dto';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ItemType, ItemStatus } from '../entities/item.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @ApiPropertyOptional({ enum: ItemType, description: 'Tipo do item' })
  @IsOptional()
  @IsEnum(ItemType, { message: 'Tipo de item inválido' })
  type?: ItemType;

  @ApiPropertyOptional({
    example: 'Camisa de algodão azul',
    description: 'Descrição detalhada do item',
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  description?: string;

  @ApiPropertyOptional({
    example: 'Bom estado',
    description: 'Estado de conservação do item',
  })
  @IsOptional()
  @IsString({ message: 'O estado de conservação deve ser uma string' })
  conservationState?: string;

  @ApiPropertyOptional({
    example: 'M',
    description: 'Tamanho do item (quando aplicável)',
  })
  @IsOptional()
  @IsString({ message: 'O tamanho deve ser uma string' })
  size?: string;

  @ApiPropertyOptional({ enum: ItemStatus, description: 'Status do item' })
  @IsOptional()
  @IsEnum(ItemStatus, { message: 'Status inválido' })
  status?: ItemStatus;

  @ApiPropertyOptional({
    type: [String],
    example: ['http://example.com/foto1.jpg', 'http://example.com/foto2.jpg'],
    description: 'URLs das fotos do item',
  })
  @IsOptional()
  @IsArray({ message: 'As fotos devem ser um array de strings (URLs)' })
  @IsUrl({}, { each: true, message: 'Cada foto deve ser uma URL válida' })
  photos?: string[];

  @ApiPropertyOptional({
    example: 'uuid-do-doador',
    description: 'ID do usuário doador',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do doador inválido' })
  donorId?: string;

  @ApiPropertyOptional({
    example: 'uuid-da-categoria',
    description: 'ID da categoria do item',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID da categoria inválido' })
  categoryId?: string;
}
