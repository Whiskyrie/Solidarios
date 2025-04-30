import {
  IsArray,
  ArrayNotEmpty,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDistributionDto {
  @ApiProperty({
    example: 'uuid-do-beneficiario',
    description: 'ID do usuário beneficiário',
  })
  @IsNotEmpty({ message: 'O ID do beneficiário é obrigatório' })
  @IsUUID('4', { message: 'ID do beneficiário inválido' })
  beneficiaryId: string;

  @ApiProperty({
    example: 'uuid-do-funcionario',
    description: 'ID do usuário funcionário que realizou a distribuição',
  })
  @IsNotEmpty({ message: 'O ID do funcionário é obrigatório' })
  @IsUUID('4', { message: 'ID do funcionário inválido' })
  employeeId: string;

  @ApiProperty({
    type: [String],
    example: ['uuid-do-item-1', 'uuid-do-item-2'],
    description: 'Lista de IDs dos itens distribuídos',
  })
  @IsArray({ message: 'A lista de itens deve ser um array' })
  @ArrayNotEmpty({ message: 'A lista de itens não pode estar vazia' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de item deve ser um UUID válido',
  })
  itemIds: string[];

  @ApiPropertyOptional({
    example: 'Entregue na data X',
    description: 'Observações sobre a distribuição',
  })
  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  observations?: string;
}
