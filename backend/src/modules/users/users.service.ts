// src/modules/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { PageMetaDto } from '../../common/pagination/dto/page-meta.dto';
import * as bcrypt from 'bcrypt';
import { LoggingService } from '../../common/logging/logging.service';
import { LogMethod } from '../../common/logging/logger.decorator';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('UsersService');
  }

  @LogMethod()
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Criando novo usuário com email: ${createUserDto.email}`);

    try {
      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }

      const user = this.usersRepository.create(createUserDto);
      const savedUser = await this.usersRepository.save(user);

      this.logger.log(`Usuário criado com sucesso: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Método antigo sem paginação, mantido para compatibilidade
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  @LogMethod()
  async findAllPaginated(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<User>> {
    try {
      const queryBuilder = this.usersRepository.createQueryBuilder('user');

      queryBuilder
        .orderBy('user.createdAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const users = await queryBuilder.getMany();

      const pageMetaDto = new PageMetaDto({ pageOptionsDto, itemCount });

      this.logger.debug(
        `Retornando ${users.length} usuários (página ${pageOptionsDto.page})`,
      );

      return new PageDto(users, pageMetaDto);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async findOne(id: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });

      if (!user) {
        this.logger.warn(`Usuário não encontrado com ID: ${id}`);
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      } else {
        this.logger.debug(`Usuário encontrado: ${id}`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuário por ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });

      if (!user) {
        this.logger.debug(`Nenhum usuário encontrado com email: ${email}`);
        throw new NotFoundException(
          `Usuário com email ${email} não encontrado`,
        );
      } else {
        this.logger.debug(`Usuário encontrado por email: ${email}`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuário por email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async findByResetToken(token: string): Promise<User> {
    try {
      const users = await this.usersRepository.find();
      for (const user of users) {
        if (
          user.resetPasswordToken &&
          (await bcrypt.compare(token, user.resetPasswordToken))
        ) {
          this.logger.debug(
            `Usuário encontrado por token de redefinição: ${user.id}`,
          );
          return user;
        }
      }
      this.logger.debug('Token de redefinição de senha inválido');
      throw new NotFoundException('Token de redefinição não encontrado');
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuário por token de redefinição: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Atualizando usuário: ${id}`);

    try {
      const user = await this.findOne(id);

      // Se estiver atualizando o email, verificar se já existe
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.usersRepository.findOne({
          where: { email: updateUserDto.email },
        });

        if (existingUser) {
          throw new ConflictException('Email já está em uso');
        }
      }

      // Atualizar os campos
      Object.assign(user, updateUserDto);

      const updatedUser = await this.usersRepository.save(user);

      this.logger.debug(`Usuário atualizado com sucesso: ${id}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar usuário: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async remove(id: string): Promise<void> {
    this.logger.log(`Removendo usuário: ${id}`);

    try {
      const user = await this.findOne(id);
      await this.usersRepository.remove(user);
      this.logger.log(`Usuário removido com sucesso: ${id}`);
    } catch (error) {
      this.logger.error(
        `Erro ao remover usuário: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
