import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ItemType, ItemStatus } from '../entities/item.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ enum: ItemType, description: 'Tipo do item' })
  @IsNotEmpty({ message: 'O tipo do item é obrigatório' })
  @IsEnum(ItemType, { message: 'Tipo de item inválido' })
  type: ItemType;

  @ApiProperty({
    example: 'Camisa de algodão azul',
    description: 'Descrição detalhada do item',
  })
  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  @IsString({ message: 'A descrição deve ser uma string' })
  description: string;

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

  @ApiPropertyOptional({
    enum: ItemStatus,
    description: 'Status inicial do item',
    default: ItemStatus.DISPONIVEL,
  })
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

  @ApiProperty({
    example: 'uuid-do-doador',
    description: 'ID do usuário doador',
  })
  @IsNotEmpty({ message: 'O ID do doador é obrigatório' })
  @IsUUID('4', { message: 'ID do doador inválido' })
  donorId: string;

  @ApiPropertyOptional({
    example: 'uuid-da-categoria',
    description: 'ID da categoria do item',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID da categoria inválido' })
  categoryId?: string;
}
