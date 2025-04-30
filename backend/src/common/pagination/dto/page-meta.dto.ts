// src/common/dto/page-meta.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from './page-options.dto';

export interface PageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  itemCount: number;
}

export class PageMetaDto {
  @ApiProperty({ description: 'Número da página atual' })
  readonly page: number;

  @ApiProperty({ description: 'Número de itens por página' })
  readonly take: number;

  @ApiProperty({ description: 'Quantidade total de itens' })
  readonly itemCount: number;

  @ApiProperty({ description: 'Quantidade total de páginas' })
  readonly pageCount: number;

  @ApiProperty({ description: 'Indica se há uma página anterior' })
  readonly hasPreviousPage: boolean;

  @ApiProperty({ description: 'Indica se há uma próxima página' })
  readonly hasNextPage: boolean;

  constructor({ pageOptionsDto, itemCount }: PageMetaDtoParameters) {
    this.page = pageOptionsDto.page ?? 1;
    this.take = pageOptionsDto.take ?? 10;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}
