// src/common/dto/page.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from './page-meta.dto';

export class PageDto<T> {
  @ApiProperty({ description: 'Lista de itens na página atual', isArray: true })
  readonly data: T[];

  @ApiProperty({ description: 'Metadados da paginação' })
  readonly meta: PageMetaDto;

  constructor(data: T[], meta: PageMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
