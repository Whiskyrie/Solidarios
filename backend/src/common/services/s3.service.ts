// src/common/services/s3.service.ts
// Serviço para Backblaze B2 usando API S3-compatible
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import sharp from 'sharp';
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
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private baseUrl: string;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('B2_BUCKET_NAME') || '';
    this.region = this.configService.get<string>('B2_REGION') || 'us-east-005';

    const accessKeyId = this.configService.get<string>('B2_APPLICATION_KEY_ID');
    const secretAccessKey =
      this.configService.get<string>('B2_APPLICATION_KEY');
    const endpoint = this.configService.get<string>('B2_ENDPOINT');

    if (!this.bucketName || !accessKeyId || !secretAccessKey || !endpoint) {
      throw new Error(
        'Missing required Backblaze B2 S3-compatible configuration',
      );
    }

    // Configurar URL base do Backblaze B2
    this.baseUrl = `${endpoint}/${this.bucketName}`;

    // Inicializar cliente S3 com endpoint do Backblaze B2
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Necessário para Backblaze B2
    });

    this.logger.log('BackBlaze B2 configurado com sucesso');
  }

  /**
   * Inicializa a conexão com Backblaze B2 (S3-compatible)
   */
  private async initializeS3(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verificar se o bucket existe e é acessível
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      this.isInitialized = true;
      this.logger.log('Backblaze B2 (S3-compatible) inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar Backblaze B2:', error);
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
   * Faz upload de uma imagem para Backblaze B2 (S3-compatible)
   */
  async uploadImage(
    file: MulterFile,
    generateThumbnail = true,
  ): Promise<UploadResult> {
    await this.initializeS3();

    try {
      // Validações básicas
      if (!file || !file.buffer) {
        throw new Error('Arquivo inválido ou vazio');
      }

      if (!file.mimetype.startsWith('image/')) {
        throw new Error(`Tipo de arquivo não suportado: ${file.mimetype}`);
      }

      const fileName = this.generateFileName(file.originalname);
      this.logger.debug(`📂 Nome do arquivo gerado: ${fileName}`);

      const optimizedBuffer = await this.optimizeImage(file.buffer);
      this.logger.debug(
        `🔧 Imagem otimizada: ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)}MB`,
      );

      // Upload da imagem principal
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: fileName,
          Body: optimizedBuffer,
          ContentType: 'image/jpeg',
          ACL: 'public-read',
          Metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        },
        // Configurações para melhor tratamento de erros
        partSize: 1024 * 1024 * 10, // 10MB
        queueSize: 1,
      });

      this.logger.debug('🚀 Iniciando upload principal...');
      await upload.done();
      this.logger.debug('✅ Upload principal concluído');

      const publicUrl = `${this.baseUrl}/${fileName}`;

      let thumbnailUrl: string | undefined;

      // Criar e fazer upload do thumbnail se solicitado
      if (generateThumbnail) {
        try {
          const thumbnailBuffer = await this.createThumbnail(file.buffer);
          const thumbnailFileName = fileName.replace('.', '_thumb.');

          const thumbnailUpload = new Upload({
            client: this.s3Client,
            params: {
              Bucket: this.bucketName,
              Key: thumbnailFileName,
              Body: thumbnailBuffer,
              ContentType: 'image/jpeg',
              ACL: 'public-read',
              Metadata: {
                originalName: `${file.originalname}_thumbnail`,
                uploadedAt: new Date().toISOString(),
              },
            },
            partSize: 1024 * 1024 * 5, // 5MB para thumbnails
            queueSize: 1,
          });

          this.logger.debug('🚀 Iniciando upload do thumbnail...');
          await thumbnailUpload.done();
          this.logger.debug('✅ Upload do thumbnail concluído');
          thumbnailUrl = `${this.baseUrl}/${thumbnailFileName}`;
        } catch (error) {
          this.logger.warn(
            'Erro ao criar thumbnail (continuando sem thumbnail):',
            error,
          );
          // Não falhar o upload principal por causa do thumbnail
        }
      }

      this.logger.log(`Imagem enviada com sucesso: ${fileName}`);

      return {
        fileName,
        fileId: fileName, // No Backblaze B2, usamos o key como fileId
        publicUrl,
        thumbnailUrl,
      };
    } catch (error) {
      this.logger.error('Erro ao fazer upload da imagem:', {
        error: error.message,
        stack: error.stack,
        fileName: file?.originalname,
        fileSize: file?.size,
        mimeType: file?.mimetype,
      });

      // Melhor tratamento de erros específicos
      if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
        throw new Error('Timeout no upload da imagem. Tente novamente.');
      }

      if (error.code === 'NetworkingError' || error.code === 'ENOTFOUND') {
        throw new Error(
          'Erro de conectividade. Verifique sua conexão com a internet.',
        );
      }

      if (error.code === 'AccessDenied') {
        throw new Error(
          'Acesso negado ao serviço de armazenamento. Verifique as credenciais.',
        );
      }

      if (error.code === 'NoSuchBucket') {
        throw new Error(
          'Bucket de armazenamento não encontrado. Verifique a configuração.',
        );
      }

      // Para outros erros, manter a mensagem original mas de forma mais amigável
      throw new Error(
        `Erro no upload da imagem: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Remove uma imagem do Backblaze B2 (S3-compatible)
   */
  async deleteImage(fileName: string): Promise<void> {
    await this.initializeS3();

    try {
      // Deletar o arquivo principal
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
        }),
      );

      // Tentar deletar o thumbnail também
      const thumbnailFileName = fileName.replace('.', '_thumb.');
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: thumbnailFileName,
          }),
        );
      } catch (error) {
        this.logger.warn(
          'Erro ao deletar thumbnail (pode não existir):',
          error,
        );
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
   * Verifica se a URL é do Backblaze B2 (S3-compatible)
   */
  isS3Url(url: string): boolean {
    return (
      url.includes(this.bucketName) &&
      (url.includes('backblazeb2.com') ||
        url.includes('b2-api.backblazeb2.com') ||
        url.includes(
          this.configService
            .get<string>('B2_ENDPOINT')
            ?.replace('https://', '') || '',
        ))
    );
  }

  /**
   * Obtém informações do bucket
   */
  async getBucketInfo(): Promise<any> {
    await this.initializeS3();

    try {
      const headBucket = await this.s3Client.send(
        new HeadBucketCommand({
          Bucket: this.bucketName,
        }),
      );

      return {
        bucketName: this.bucketName,
        region: this.region,
        exists: true,
        ...headBucket,
      };
    } catch (error) {
      this.logger.error('Erro ao obter informações do bucket:', error);
      throw error;
    }
  }
}
