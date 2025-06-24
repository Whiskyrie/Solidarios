// src/common/services/backblaze.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackBlazeService } from './backblaze.service';

@Module({
  imports: [ConfigModule],
  providers: [BackBlazeService],
  exports: [BackBlazeService],
})
export class BackBlazeModule {}
