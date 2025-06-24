// src/common/services/backblaze.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import B2 from 'backblaze-b2';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  fileName: string;
  fileId: string;
  publicUrl: string;
  thumbnailUrl?: string;
}

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class BackBlazeService {
  private readonly logger = new Logger(BackBlazeService.name);
  private b2: B2;
  private bucketId: string;
  private bucketName: string;
  private baseUrl: string;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.bucketId = this.configService.get<string>('BACKBLAZE_BUCKET_ID') || '';
    this.bucketName =
      this.configService.get<string>('BACKBLAZE_BUCKET_NAME') || '';
    this.baseUrl = this.configService.get<string>('BACKBLAZE_BASE_URL') || '';

    const applicationKeyId = this.configService.get<string>(
      'BACKBLAZE_APPLICATION_KEY_ID',
    );
    const applicationKey = this.configService.get<string>(
      'BACKBLAZE_APPLICATION_KEY',
    );

    if (
      !this.bucketId ||
      !this.bucketName ||
      !this.baseUrl ||
      !applicationKeyId ||
      !applicationKey
    ) {
      throw new Error('Missing required BackBlaze configuration');
    }

    this.b2 = new B2({
      applicationKeyId,
      applicationKey,
    });
  }

  /**
   * Inicializa a conexão com BackBlaze B2
   */
  private async initializeB2(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.b2.authorize();
      this.isInitialized = true;
      this.logger.log('BackBlaze B2 inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar BackBlaze B2:', error);
      throw error;
    }
  }

  /**
   * Gera nome único para o arquivo
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `items/${timestamp}-${uuid}.${extension}`;
  }

  /**
   * Otimiza imagem antes do upload
   */
  private async optimizeImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toBuffer();
    } catch (error) {
      this.logger.warn('Erro ao otimizar imagem, usando original:', error);
      return buffer;
    }
  }

  /**
   * Cria thumbnail da imagem
   */
  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();
  }

  /**
   * Faz upload de uma imagem para BackBlaze B2
   */
  async uploadImage(
    file: MulterFile,
    generateThumbnail = true,
  ): Promise<UploadResult> {
    await this.initializeB2();

    try {
      const fileName = this.generateFileName(file.originalname);
      const optimizedBuffer = await this.optimizeImage(file.buffer);

      // Upload da imagem principal
      const uploadUrl = await this.b2.getUploadUrl({
        bucketId: this.bucketId,
      });

      const uploadResponse = await this.b2.uploadFile({
        uploadUrl: uploadUrl.data.uploadUrl,
        uploadAuthToken: uploadUrl.data.authorizationToken,
        fileName,
        data: optimizedBuffer,
        mime: 'image/jpeg',
        hash: null,
        info: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      const publicUrl = `${this.baseUrl}/file/${this.bucketName}/${fileName}`;

      let thumbnailUrl: string | undefined;

      // Criar e fazer upload do thumbnail se solicitado
      if (generateThumbnail) {
        try {
          const thumbnailBuffer = await this.createThumbnail(file.buffer);
          const thumbnailFileName = fileName.replace('.', '_thumb.');

          const thumbnailUploadUrl = await this.b2.getUploadUrl({
            bucketId: this.bucketId,
          });

          await this.b2.uploadFile({
            uploadUrl: thumbnailUploadUrl.data.uploadUrl,
            uploadAuthToken: thumbnailUploadUrl.data.authorizationToken,
            fileName: thumbnailFileName,
            data: thumbnailBuffer,
            mime: 'image/jpeg',
            hash: null,
            info: {
              originalName: `${file.originalname}_thumbnail`,
              uploadedAt: new Date().toISOString(),
            },
          });

          thumbnailUrl = `${this.baseUrl}/file/${this.bucketName}/${thumbnailFileName}`;
        } catch (error) {
          this.logger.warn('Erro ao criar thumbnail:', error);
        }
      }

      this.logger.log(`Imagem enviada com sucesso: ${fileName}`);

      return {
        fileName,
        fileId: uploadResponse.data.fileId,
        publicUrl,
        thumbnailUrl,
      };
    } catch (error) {
      this.logger.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  }

  /**
   * Remove uma imagem do BackBlaze B2
   */
  async deleteImage(fileName: string): Promise<void> {
    await this.initializeB2();

    try {
      // Buscar informações do arquivo
      const fileVersions = await this.b2.listFileVersions({
        bucketId: this.bucketId,
        startFileName: fileName,
        maxFileCount: 1,
      });

      if (fileVersions.data.files.length === 0) {
        this.logger.warn(`Arquivo não encontrado para exclusão: ${fileName}`);
        return;
      }

      const file = fileVersions.data.files[0];

      // Deletar o arquivo
      await this.b2.deleteFileVersion({
        fileId: file.fileId,
        fileName: file.fileName,
      });

      // Tentar deletar o thumbnail também
      const thumbnailFileName = fileName.replace('.', '_thumb.');
      try {
        const thumbnailVersions = await this.b2.listFileVersions({
          bucketId: this.bucketId,
          startFileName: thumbnailFileName,
          maxFileCount: 1,
        });

        if (thumbnailVersions.data.files.length > 0) {
          const thumbnailFile = thumbnailVersions.data.files[0];
          await this.b2.deleteFileVersion({
            fileId: thumbnailFile.fileId,
            fileName: thumbnailFile.fileName,
          });
        }
      } catch (error) {
        this.logger.warn('Erro ao deletar thumbnail:', error);
      }

      this.logger.log(`Imagem removida com sucesso: ${fileName}`);
    } catch (error) {
      this.logger.error('Erro ao remover imagem:', error);
      throw error;
    }
  }

  /**
   * Remove múltiplas imagens
   */
  async deleteMultipleImages(fileNames: string[]): Promise<void> {
    const deletePromises = fileNames.map((fileName) =>
      this.deleteImage(fileName).catch((error) => {
        this.logger.error(`Erro ao deletar ${fileName}:`, error);
        return null;
      }),
    );

    await Promise.all(deletePromises);
  }

  /**
   * Extrai nome do arquivo da URL pública
   */
  extractFileNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  }

  /**
   * Verifica se a URL é do BackBlaze B2
   */
  isBackBlazeUrl(url: string): boolean {
    return url.includes(this.bucketName) && url.includes(this.baseUrl);
  }

  /**
   * Obtém informações do bucket
   */
  async getBucketInfo(): Promise<any> {
    await this.initializeB2();

    try {
      const buckets = await this.b2.listBuckets();
      return buckets.data.buckets.find(
        (bucket) => bucket.bucketId === this.bucketId,
      );
    } catch (error) {
      this.logger.error('Erro ao obter informações do bucket:', error);
      throw error;
    }
  }
}
