import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory } from './entities/inventory.entity';
import { ItemsModule } from '../items/items.module'; // Importa ItemsModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory]), // Importa a entidade Inventory
    ItemsModule, // Importa ItemsModule para usar ItemsService
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService], // Exporta InventoryService para uso em outros módulos
})
export class InventoryModule {}
