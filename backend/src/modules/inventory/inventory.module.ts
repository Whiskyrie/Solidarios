import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory } from './entities/inventory.entity';
import { ItemsModule } from '../items/items.module';
import { LoggingModule } from '../../common/logging/logging.module';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory]), ItemsModule, LoggingModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
