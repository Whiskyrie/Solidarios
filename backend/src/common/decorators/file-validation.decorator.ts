// src/common/decorators/file-validation.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

export function ApiFileUpload(maxFiles: number = 5) {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: `Upload de até ${maxFiles} arquivos de imagem`,
      schema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
            maxItems: maxFiles,
          },
        },
        required: ['files'],
      },
    }),
  );
}
