import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { Item } from './entities/item.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { LoggingModule } from '../../common/logging/logging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, User]), // Já tem User
    forwardRef(() => UsersModule),
    LoggingModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
