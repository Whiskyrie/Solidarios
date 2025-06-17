import { ApiProperty } from '@nestjs/swagger';

export class DonorStatsDto {
  @ApiProperty({ description: 'ID do doador' })
  donorId: string;

  @ApiProperty({ description: 'Total de doações realizadas' })
  totalDonations: number;

  @ApiProperty({ description: 'Itens disponíveis para doação' })
  availableItems: number;

  @ApiProperty({ description: 'Itens já distribuídos' })
  distributedItems: number;

  @ApiProperty({ description: 'Itens reservados' })
  reservedItems: number;

  @ApiProperty({ description: 'Pessoas impactadas pelas doações' })
  peopleHelped: number;

  @ApiProperty({ description: 'Score de impacto calculado' })
  impactScore: number;

  @ApiProperty({ description: 'Doações por categoria' })
  donationsByCategory: Array<{
    categoryName: string;
    count: number;
  }>;

  @ApiProperty({ description: 'Doações por tipo de item' })
  donationsByType: Array<{
    type: string;
    count: number;
  }>;

  @ApiProperty({ description: 'Data da última doação' })
  lastDonationDate?: Date;

  @ApiProperty({ description: 'Média de tempo entre doações (em dias)' })
  averageDonationInterval?: number;

  @ApiProperty({ description: 'Data da última atualização das estatísticas' })
  lastUpdated: Date;
}
