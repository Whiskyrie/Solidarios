import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateInventoryDto {
  @ApiProperty({
    example: 'uuid-do-item',
    description: 'ID do item no estoque',
  })
  @IsNotEmpty({ message: 'O ID do item é obrigatório' })
  @IsUUID('4', { message: 'ID do item inválido' })
  itemId: string;

  @ApiPropertyOptional({
    example: 'uuid-do-doador',
    description: 'ID do doador do item',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do doador inválido' })
  donorId?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Quantidade do item no estoque',
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(1, { message: 'Quantidade deve ser maior que zero' })
  quantity?: number;

  @ApiPropertyOptional({
    example: 'Estoque Principal - Setor A',
    description: 'Localização do item no estoque',
  })
  @IsOptional()
  @IsString({ message: 'Localização deve ser um texto' })
  location?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Nível de alerta para estoque baixo',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Nível de alerta deve ser um número' })
  @Min(0, { message: 'Nível de alerta deve ser maior ou igual a zero' })
  alertLevel?: number;
}
