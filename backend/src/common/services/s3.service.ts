// src/common/services/s3.service.ts
// Serviço para Backblaze B2 usando API S3-compatible
//
// CORREÇÕES APLICADAS PARA BACKBLAZE B2:
// 1. Removido ACL public-read (não suportado pelo B2)
// 2. Adicionado middleware para remover headers de checksum incompatíveis
// 3. Configurados timeouts apropriados para uploads maiores
// 4. Reduzido tamanho das partes do upload multipart para melhor compatibilidade
//
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
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

    // Log das configurações (sem mostrar chaves completas)
    this.logger.debug(`🔧 Configurações Backblaze B2:`);
    this.logger.debug(`   Bucket: ${this.bucketName}`);
    this.logger.debug(`   Região: ${this.region}`);
    this.logger.debug(`   Endpoint: ${endpoint}`);
    this.logger.debug(
      `   Key ID: ${accessKeyId ? accessKeyId.substring(0, 10) + '...' : 'MISSING'}`,
    );
    this.logger.debug(
      `   Key: ${secretAccessKey ? '***' + secretAccessKey.substring(secretAccessKey.length - 5) : 'MISSING'}`,
    );

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
      // Configurações específicas para Backblaze B2
      requestHandler: {
        requestTimeout: 300000, // 5 minutos
        connectionTimeout: 30000, // 30 segundos
      },
    });

    // Adicionar middleware para remover headers problemáticos do Backblaze B2
    this.s3Client.middlewareStack.add(
      (next) => async (args: any) => {
        if (args.request && args.request.headers) {
          // Remover headers que causam problemas no Backblaze B2
          delete args.request.headers['x-amz-checksum-crc32'];
          delete args.request.headers['x-amz-checksum-crc32c'];
          delete args.request.headers['x-amz-checksum-sha1'];
          delete args.request.headers['x-amz-checksum-sha256'];
          delete args.request.headers['x-amz-sdk-checksum-algorithm'];
          delete args.request.headers['x-amz-content-sha256'];
        }
        return next(args);
      },
      {
        step: 'finalizeRequest',
        name: 'removeB2IncompatibleHeaders',
        priority: 'high',
      },
    );

    // Adicionar middleware adicional para interceptar mais cedo
    this.s3Client.middlewareStack.add(
      (next) => async (args: any) => {
        // Interceptar e modificar parâmetros antes do processamento
        if (args.input) {
          delete args.input.ChecksumAlgorithm;
          delete args.input.ChecksumCRC32;
          delete args.input.ChecksumCRC32C;
          delete args.input.ChecksumSHA1;
          delete args.input.ChecksumSHA256;
        }
        return next(args);
      },
      {
        step: 'initialize',
        name: 'removeChecksumParams',
        priority: 'high',
      },
    );

    this.logger.log('BackBlaze B2 configurado com sucesso');
  }

  /**
   * Inicializa a conexão com Backblaze B2 (S3-compatible)
   */
  private async initializeS3(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.logger.debug(`Tentando conectar ao bucket: ${this.bucketName}`);
      this.logger.debug(
        `Endpoint: ${this.configService.get<string>('B2_ENDPOINT')}`,
      );
      this.logger.debug(`Região: ${this.region}`);

      // Verificar se o bucket existe e é acessível
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );

      this.isInitialized = true;
      this.logger.log('Backblaze B2 (S3-compatible) inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar Backblaze B2:', {
        error: error.message,
        bucket: this.bucketName,
        endpoint: this.configService.get<string>('B2_ENDPOINT'),
        region: this.region,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
      });

      // Para o Backblaze B2, vamos tentar continuar sem o HeadBucket
      // pois alguns endpoints podem não suportar essa operação
      if (error.$metadata?.httpStatusCode === 400) {
        this.logger.warn(
          '⚠️ Continuando sem verificação HeadBucket devido ao erro 400',
        );
        this.logger.warn(
          '   Isso pode ser normal no Backblaze B2 - tentando operação de upload...',
        );
        this.isInitialized = true;
        return;
      }

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
      this.logger.debug(`🔄 Iniciando otimização da imagem...`);
      this.logger.debug(`   Buffer original: ${buffer.length} bytes`);

      // Verificar se o buffer de entrada é válido
      if (!buffer || buffer.length === 0) {
        throw new Error('Buffer de entrada inválido ou vazio');
      }

      const optimizedBuffer = await sharp(buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toBuffer();

      this.logger.debug(`   Buffer otimizado: ${optimizedBuffer.length} bytes`);

      // Verificar se a otimização foi bem-sucedida
      if (!optimizedBuffer || optimizedBuffer.length === 0) {
        this.logger.warn(
          '⚠️ Otimização resultou em buffer vazio, usando original',
        );
        return buffer;
      }

      return optimizedBuffer;
    } catch (error) {
      this.logger.warn(
        '⚠️ Erro ao otimizar imagem, usando original:',
        error.message,
      );

      // Verificar se o buffer original ainda é válido antes de retornar
      if (!buffer || buffer.length === 0) {
        throw new Error('Buffer original também está inválido');
      }

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
      // Validações básicas mais rigorosas
      if (!file) {
        throw new Error('Arquivo não fornecido');
      }

      if (!file.buffer) {
        throw new Error('Buffer do arquivo está vazio ou não existe');
      }

      if (file.buffer.length === 0) {
        throw new Error('Arquivo está vazio (0 bytes)');
      }

      if (file.size === 0) {
        throw new Error('Tamanho do arquivo é 0 bytes');
      }

      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        throw new Error(
          `Tipo de arquivo não suportado: ${file.mimetype || 'desconhecido'}`,
        );
      }

      // Log detalhado do arquivo recebido
      this.logger.debug(`📋 Detalhes do arquivo recebido:`);
      this.logger.debug(`   Nome original: ${file.originalname}`);
      this.logger.debug(`   MIME type: ${file.mimetype}`);
      this.logger.debug(
        `   Tamanho: ${file.size} bytes (${(file.size / 1024).toFixed(2)} KB)`,
      );
      this.logger.debug(`   Buffer length: ${file.buffer.length} bytes`);
      this.logger.debug(`   Encoding: ${file.encoding}`);

      const fileName = this.generateFileName(file.originalname);
      this.logger.debug(`📂 Nome do arquivo gerado: ${fileName}`);

      const optimizedBuffer = await this.optimizeImage(file.buffer);
      this.logger.debug(
        `🔧 Imagem otimizada: ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)}MB (${optimizedBuffer.length} bytes)`,
      );

      // Validar se o buffer otimizado ainda é válido
      if (!optimizedBuffer || optimizedBuffer.length === 0) {
        throw new Error(
          'Erro na otimização da imagem: buffer resultante está vazio',
        );
      }

      // Verificar tamanho mínimo para Backblaze B2 (deve ser maior que 0)
      if (optimizedBuffer.length < 1) {
        throw new Error('Arquivo muito pequeno para upload no Backblaze B2');
      }

      // Para arquivos muito pequenos, usar upload simples ao invés de multipart
      const useSimpleUpload = optimizedBuffer.length < 1024 * 1024; // 1MB

      this.logger.debug(
        `📊 Estratégia de upload: ${useSimpleUpload ? 'Simples' : 'Multipart'}`,
      );

      // Upload da imagem principal
      const uploadParams = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: optimizedBuffer,
        ContentType: 'image/jpeg',
        // Remover ACL para compatibilidade com Backblaze B2
        // ACL: 'public-read',
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
        // Desabilitar checksums explicitamente
        ChecksumAlgorithm: undefined,
      };

      let upload: Upload;

      if (useSimpleUpload) {
        this.logger.debug('🚀 Usando upload simples para arquivo pequeno...');
        // Para arquivos pequenos, usar configurações mais simples
        upload = new Upload({
          client: this.s3Client,
          params: uploadParams,
          // Forçar upload simples para arquivos pequenos
          partSize: optimizedBuffer.length,
          queueSize: 1,
          leavePartsOnError: false,
        });
      } else {
        this.logger.debug('🚀 Usando upload multipart para arquivo maior...');
        // Para arquivos maiores, usar configurações normais
        upload = new Upload({
          client: this.s3Client,
          params: uploadParams,
          // Configurações otimizadas para Backblaze B2
          partSize: 1024 * 1024 * 5, // 5MB - menor para melhor compatibilidade
          queueSize: 1,
          // Desabilitar checksums que causam problemas no B2
          leavePartsOnError: false,
        });
      }

      this.logger.debug('🚀 Iniciando upload principal...');

      try {
        if (useSimpleUpload) {
          // Para arquivos pequenos, usar PutObjectCommand diretamente
          this.logger.debug('📤 Executando upload simples...');
          await this.s3Client.send(new PutObjectCommand(uploadParams));
        } else {
          // Para arquivos maiores, usar Upload com multipart
          this.logger.debug('📤 Executando upload multipart...');
          await upload.done();
        }
        this.logger.debug('✅ Upload principal concluído');
      } catch (uploadError) {
        this.logger.error('❌ Erro específico no upload:', {
          message: uploadError.message,
          code: uploadError.code,
          name: uploadError.name,
          statusCode: uploadError.$metadata?.httpStatusCode,
          requestId: uploadError.$metadata?.requestId,
        });

        // Tratar erro específico "request body was too small"
        if (
          uploadError.message &&
          uploadError.message.includes('request body was too small')
        ) {
          throw new Error(
            'Arquivo muito pequeno ou corrompido para upload. Verifique se a imagem está válida.',
          );
        }

        throw uploadError;
      }

      const publicUrl = `${this.baseUrl}/${fileName}`;

      let thumbnailUrl: string | undefined;

      // Criar e fazer upload do thumbnail se solicitado
      if (generateThumbnail) {
        try {
          const thumbnailBuffer = await this.createThumbnail(file.buffer);
          const thumbnailFileName = fileName.replace('.', '_thumb.');

          const thumbnailParams = {
            Bucket: this.bucketName,
            Key: thumbnailFileName,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            // Remover ACL para compatibilidade com Backblaze B2
            // ACL: 'public-read',
            Metadata: {
              originalName: `${file.originalname}_thumbnail`,
              uploadedAt: new Date().toISOString(),
            },
            // Desabilitar checksums explicitamente
            ChecksumAlgorithm: undefined,
          };

          this.logger.debug('🚀 Iniciando upload do thumbnail...');

          // Thumbnails são sempre pequenos, usar upload simples
          await this.s3Client.send(new PutObjectCommand(thumbnailParams));

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

  /**
   * Método de teste simples para verificar conectividade com B2
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.initializeS3();
      this.logger.log(
        '✅ Teste de conectividade com Backblaze B2 bem-sucedido',
      );
      return true;
    } catch (error) {
      this.logger.error(
        '❌ Falha no teste de conectividade com Backblaze B2:',
        error,
      );
      return false;
    }
  }
}
