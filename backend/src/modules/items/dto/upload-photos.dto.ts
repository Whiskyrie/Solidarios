// src/modules/items/dto/upload-photos.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UploadPhotosDto {
  @ApiProperty({
    description: 'Gerar thumbnails para as imagens',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'generateThumbnails deve ser um valor booleano' })
  generateThumbnails?: boolean = true;
}
