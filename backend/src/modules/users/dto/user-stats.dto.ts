import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {

   @ApiProperty({
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Total de doações realizadas pelo usuário',
    example: 25,
  })
  totalDonations: number;

  @ApiProperty({
    description: 'Total de itens distribuídos',
    example: 15,
  })
  distributedItems: number;

  @ApiProperty({
    description: 'Número de pessoas ajudadas através das doações',
    example: 150,
  })
  peopleHelped: number;

  @ApiProperty({
    description: 'Pontuação de impacto do usuário',
    example: 75,
  })
  impactScore: number;

  @ApiProperty({
    description: 'Data e hora da última atualização das estatísticas',
    example: '2025-06-16T12:00:00Z',
  })
  lastUpdated: string;

}

/*  userId: string;
  totalDonations: number;
  peopleHelped: number;
  impactScore: number;
  lastUpdated: string;*/