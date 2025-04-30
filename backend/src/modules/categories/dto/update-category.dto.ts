import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiPropertyOptional({
    example: 'Roupas de Inverno',
    description: 'Nome da categoria',
  })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Categoria para roupas de inverno',
    description: 'Descrição da categoria',
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  description?: string;
}
