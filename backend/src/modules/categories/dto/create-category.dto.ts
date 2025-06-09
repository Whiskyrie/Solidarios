import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Roupas', description: 'Nome da categoria' })
  @IsNotEmpty({ message: 'O nome da categoria é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  name: string;

  @ApiPropertyOptional({
    example: 'Categoria para todos os tipos de roupas',
    description: 'Descrição da categoria',
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  description?: string;
}
