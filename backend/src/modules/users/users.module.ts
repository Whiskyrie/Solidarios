import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Importa a entidade User
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exporta UsersService para ser usado no AuthModule
})
export class UsersModule {}
