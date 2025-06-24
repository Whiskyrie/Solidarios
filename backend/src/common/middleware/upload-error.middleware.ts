// src/common/middleware/upload-error.middleware.ts
import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as multer from 'multer';

@Injectable()
export class UploadErrorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Interceptar erros do multer
    const originalNext = next;
    next = (error?: any) => {
      if (error instanceof multer.MulterError) {
        switch (error.code) {
          case 'LIMIT_FILE_SIZE':
            throw new PayloadTooLargeException(
              'Arquivo muito grande. Tamanho máximo: 10MB',
            );
          case 'LIMIT_FILE_COUNT':
            throw new BadRequestException(
              'Muitos arquivos. Máximo permitido: 5',
            );
          case 'LIMIT_UNEXPECTED_FILE':
            throw new BadRequestException('Campo de arquivo inesperado');
          default:
            throw new BadRequestException(`Erro no upload: ${error.message}`);
        }
      }
      originalNext(error);
    };

    originalNext();
  }
}
