// src/modules/items/dto/remove-photo.dto.ts
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemovePhotoDto {
  @ApiProperty({
    description: 'URL da foto a ser removida',
    example:
      'https://s3.us-west-004.backblazeb2.com/my-bucket/items/my-photo.jpg',
  })
  @IsNotEmpty({ message: 'URL da foto é obrigatória' })
  @IsString({ message: 'URL da foto deve ser uma string' })
  @IsUrl({}, { message: 'URL da foto deve ser uma URL válida' })
  photoUrl: string;
}
