import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { Item } from './entities/item.entity';
import { UsersModule } from '../users/users.module'; // Importa UsersModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Item]), // Importa a entidade Item
    UsersModule, // Importa UsersModule para usar UsersService
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService], // Exporta ItemsService se necessário para outros módulos
})
export class ItemsModule {}
