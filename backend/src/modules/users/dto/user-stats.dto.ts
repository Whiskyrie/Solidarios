import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({
    description: 'Total de doações realizadas pelo usuário',
    example: 25,
  })
  totalDonations: number;

  @ApiProperty({
    description: 'Número de pessoas ajudadas através das doações',
    example: 150,
  })
  peopleHelped: number;

  @ApiProperty({
    description:
      'Pontuação de impacto calculada (totalDonations * 2 + peopleHelped)',
    example: 200,
  })
  impactScore: number;

  @ApiProperty({
    description: 'ID do usuário',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  userId: string;

  @ApiProperty({
    description: 'Data da última atualização das estatísticas',
    example: '2023-12-01T10:30:00Z',
  })
  lastUpdated: Date;
}
