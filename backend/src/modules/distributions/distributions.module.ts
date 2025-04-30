import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistributionsService } from './distributions.service';
import { DistributionsController } from './distributions.controller';
import { Distribution } from './entities/distribution.entity';
import { UsersModule } from '../users/users.module'; // Importa UsersModule
import { ItemsModule } from '../items/items.module'; // Importa ItemsModule
import { InventoryModule } from '../inventory/inventory.module'; // Importa InventoryModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Distribution]), // Importa a entidade Distribution
    UsersModule, // Importa UsersModule para usar UsersService
    ItemsModule, // Importa ItemsModule para usar ItemsService
    InventoryModule, // Importa InventoryModule para usar InventoryService
  ],
  controllers: [DistributionsController],
  providers: [DistributionsService],
  exports: [DistributionsService], // Exporta DistributionsService para uso em outros módulos
})
export class DistributionsModule {}
