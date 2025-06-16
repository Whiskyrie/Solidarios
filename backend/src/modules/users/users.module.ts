import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { LoggingModule } from '../../common/logging/logging.module';
import { InventoryModule } from '../inventory/inventory.module';
import { DistributionsModule } from '../distributions/distributions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    LoggingModule,
    InventoryModule,
    DistributionsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
