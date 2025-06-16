import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Distribution } from '../distributions/entities/distribution.entity';
import { LoggingModule } from '../../common/logging/logging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Inventory, // Adicionar Inventory entity
      Distribution, // Adicionar Distribution entity
    ]),
    LoggingModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
