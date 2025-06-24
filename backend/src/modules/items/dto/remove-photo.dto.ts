// src/modules/items/dto/remove-photo.dto.ts
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemovePhotoDto {
  @ApiProperty({
    description: 'URL da foto a ser removida',
    example:
      'https://f000.backblazeb2.com/file/meu-bucket/items/12345-uuid.jpg',
  })
  @IsNotEmpty({ message: 'URL da foto é obrigatória' })
  @IsString({ message: 'URL da foto deve ser uma string' })
  @IsUrl({}, { message: 'URL da foto deve ser uma URL válida' })
  photoUrl: string;
}
