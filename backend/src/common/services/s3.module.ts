// src/common/services/s3.module.ts
// Módulo para Backblaze B2 usando API S3-compatible
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';

@Module({
  imports: [ConfigModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
