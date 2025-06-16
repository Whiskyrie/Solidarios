import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
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
}
