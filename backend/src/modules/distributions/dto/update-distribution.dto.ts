import { PartialType } from '@nestjs/mapped-types';
import { CreateDistributionDto } from './create-distribution.dto';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Note: Updating distributions might be complex or disallowed depending on business rules.
// This DTO allows partial updates, but the service should enforce what can be changed.
export class UpdateDistributionDto extends PartialType(CreateDistributionDto) {
  @ApiPropertyOptional({
    example: 'uuid-do-beneficiario',
    description: 'ID do usuário beneficiário',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do beneficiário inválido' })
  beneficiaryId?: string;

  @ApiPropertyOptional({
    example: 'uuid-do-funcionario',
    description: 'ID do usuário funcionário',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do funcionário inválido' })
  employeeId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-do-item-1', 'uuid-do-item-2'],
    description: 'Lista de IDs dos itens distribuídos',
  })
  @IsOptional()
  @IsArray({ message: 'A lista de itens deve ser um array' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de item deve ser um UUID válido',
  })
  itemIds?: string[];

  @ApiPropertyOptional({
    example: 'Correção na observação',
    description: 'Observações sobre a distribuição',
  })
  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  observations?: string;
}
