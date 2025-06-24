// src/common/utils/image-validator.util.ts
import { BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';

export class ImageValidatorUtil {
  private static readonly ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'gif'];
  private static readonly MAX_WIDTH = 4000;
  private static readonly MAX_HEIGHT = 4000;
  private static readonly MIN_WIDTH = 100;
  private static readonly MIN_HEIGHT = 100;

  /**
   * Valida se o arquivo é uma imagem válida
   */
  static async validateImage(buffer: Buffer, filename: string): Promise<void> {
    try {
      const metadata = await sharp(buffer).metadata();

      // Validar formato
      if (!metadata.format || !this.ALLOWED_FORMATS.includes(metadata.format)) {
        throw new BadRequestException(
          `Formato de imagem não suportado em ${filename}. Formatos permitidos: ${this.ALLOWED_FORMATS.join(', ')}`,
        );
      }

      // Validar dimensões
      if (!metadata.width || !metadata.height) {
        throw new BadRequestException(
          `Não foi possível determinar as dimensões da imagem ${filename}`,
        );
      }

      if (
        metadata.width > this.MAX_WIDTH ||
        metadata.height > this.MAX_HEIGHT
      ) {
        throw new BadRequestException(
          `Imagem ${filename} muito grande. Máximo: ${this.MAX_WIDTH}x${this.MAX_HEIGHT}px`,
        );
      }

      if (
        metadata.width < this.MIN_WIDTH ||
        metadata.height < this.MIN_HEIGHT
      ) {
        throw new BadRequestException(
          `Imagem ${filename} muito pequena. Mínimo: ${this.MIN_WIDTH}x${this.MIN_HEIGHT}px`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Arquivo ${filename} não é uma imagem válida`,
      );
    }
  }

  /**
   * Verifica se é necessário redimensionar a imagem
   */
  static async shouldResize(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return (
        (metadata.width ? metadata.width > 1200 : false) ||
        (metadata.height ? metadata.height > 1200 : false)
      );
    } catch {
      return false;
    }
  }

  /**
   * Calcula o tamanho estimado após compressão
   */
  static estimateCompressedSize(originalSize: number): number {
    // Estimativa baseada em uma compressão típica JPEG de 85% de qualidade
    return Math.round(originalSize * 0.6);
  }
}
