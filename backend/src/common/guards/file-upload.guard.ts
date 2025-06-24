// src/common/guards/file-upload.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class FileUploadGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const files = request.files;

    if (!files || files.length === 0) {
      throw new BadRequestException('Pelo menos um arquivo deve ser enviado');
    }

    // Validar tipos de arquivo
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(
          `Arquivo ${file.originalname} não é uma imagem válida`,
        );
      }

      // Validar tamanho do arquivo (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException(
          `Arquivo ${file.originalname} excede o tamanho máximo de 10MB`,
        );
      }
    }

    return true;
  }
}
