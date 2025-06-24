// src/common/pipes/file-validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly maxFiles = 5;
  private readonly allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
  ];

  transform(
    files: Express.Multer.File[],
    _metadata: ArgumentMetadata,
  ): Express.Multer.File[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('Pelo menos um arquivo deve ser enviado');
    }

    if (files.length > this.maxFiles) {
      throw new BadRequestException(
        `Máximo de ${this.maxFiles} arquivos permitidos`,
      );
    }

    files.forEach((file, index) => this.validateFile(file, index));

    return files;
  }

  private validateFile(file: Express.Multer.File, index: number): void {
    this.validateFileName(file.originalname, index);
    this.validateMimeType(file.mimetype, file.originalname);
    this.validateFileSize(file.size, file.originalname);
    this.validateFileExtension(file.originalname);
  }

  private validateFileName(originalname: string, index: number): void {
    if (!originalname || originalname.trim() === '') {
      throw new BadRequestException(
        `Nome do arquivo ${index + 1} é obrigatório`,
      );
    }
  }

  private validateMimeType(mimetype: string, filename: string): void {
    if (!this.allowedMimeTypes.includes(mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não suportado para "${filename}": ${mimetype}. Tipos permitidos: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  private validateFileSize(size: number, filename: string): void {
    if (size > this.maxFileSize) {
      const sizeMB = (size / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `Arquivo "${filename}" (${sizeMB}MB) excede o tamanho máximo de 10MB`,
      );
    }
  }

  private validateFileExtension(filename: string): void {
    const extension = filename
      .toLowerCase()
      .substring(filename.lastIndexOf('.'));
    if (!this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `Extensão de arquivo não permitida para "${filename}". Extensões permitidas: ${this.allowedExtensions.join(', ')}`,
      );
    }
  }
}
