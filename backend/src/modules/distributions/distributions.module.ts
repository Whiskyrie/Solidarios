import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistributionsService } from './distributions.service';
import { DistributionsController } from './distributions.controller';
import { Distribution } from './entities/distribution.entity';
import { UsersModule } from '../users/users.module';
import { ItemsModule } from '../items/items.module';
import { InventoryModule } from '../inventory/inventory.module';
import { LoggingModule } from '../../common/logging/logging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Distribution]),
    UsersModule,
    ItemsModule,
    InventoryModule,
    LoggingModule,
  ],
  controllers: [DistributionsController],
  providers: [DistributionsService],
  exports: [DistributionsService],
})
export class DistributionsModule {}
