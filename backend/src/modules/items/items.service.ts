// src/modules/items/items.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { PageMetaDto } from '../../common/pagination/dto/page-meta.dto';
import { LoggingService } from '../../common/logging/logging.service';
import { LogMethod } from '../../common/logging/logger.decorator';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private usersService: UsersService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ItemsService');
  }

  @LogMethod()
  async create(createItemDto: CreateItemDto, currentUser: User): Promise<Item> {
    this.logger.log(
      `Criando novo item com doador ID: ${createItemDto.donorId}`,
    );

    try {
      // Verifica se o doador existe e se o usuário logado tem permissão
      const donor = await this.usersService.findOne(createItemDto.donorId);
      if (!donor || donor.role !== UserRole.DOADOR) {
        this.logger.warn(
          `Tentativa de criar item com doador inválido: ${createItemDto.donorId}`,
        );
        throw new NotFoundException(
          `Doador com ID ${createItemDto.donorId} não encontrado ou não é um doador.`,
        );
      }

      // Apenas Admin ou Funcionário podem cadastrar itens em nome de um doador
      // Ou o próprio doador pode cadastrar seu item
      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.FUNCIONARIO &&
        currentUser.id !== donor.id
      ) {
        this.logger.warn(
          `Usuário ${currentUser.id} (${currentUser.role}) sem permissão para cadastrar item para doador ${donor.id}`,
        );
        throw new ForbiddenException(
          'Você não tem permissão para cadastrar este item.',
        );
      }

      const item = this.itemsRepository.create({
        ...createItemDto,
        donor: donor,
      });

      const savedItem = await this.itemsRepository.save(item);
      this.logger.log(`Item criado com sucesso: ${savedItem.id}`);
      return savedItem;
    } catch (error) {
      this.logger.error(`Erro ao criar item: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Método antigo sem paginação, mantido para compatibilidade
  async findAll(): Promise<Item[]> {
    this.logger.debug('Buscando todos os itens (sem paginação)');
    return this.itemsRepository.find({ relations: ['donor'] });
  }

  // Novo método com paginação
  @LogMethod()
  async findAllPaginated(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Item>> {
    this.logger.debug(
      `Buscando itens paginados - página ${pageOptionsDto.page}`,
    );

    try {
      const queryBuilder = this.itemsRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.donor', 'donor')
        .leftJoinAndSelect('item.category', 'category')
        .orderBy('item.receivedDate', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const items = await queryBuilder.getMany();

      const pageMetaDto = new PageMetaDto({ pageOptionsDto, itemCount });

      this.logger.debug(
        `Retornando ${items.length} itens (total: ${itemCount})`,
      );
      return new PageDto(items, pageMetaDto);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar itens paginados: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async findByDonorPaginated(
    donorId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Item>> {
    this.logger.debug(`Iniciando busca de itens para doador: ${donorId}`);
    this.logger.debug(`Opções de paginação: ${JSON.stringify(pageOptionsDto)}`);

    try {
      // Verificar se o doador existe
      this.logger.debug(`Verificando se doador ${donorId} existe...`);
      const donor = await this.usersService.findOne(donorId);

      if (!donor) {
        this.logger.warn(`Doador ${donorId} não encontrado`);
        throw new NotFoundException('Doador não encontrado');
      }

      if (donor.role !== UserRole.DOADOR) {
        this.logger.warn(
          `Usuário ${donorId} não é um doador, role: ${donor.role}`,
        );
        throw new BadRequestException('Usuário informado não é um doador');
      }

      this.logger.debug(`Doador válido encontrado: ${donor.name}`);

      // CORREÇÃO: Simplificar a query e tratar relações opcionais
      const queryBuilder = this.itemsRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.donor', 'donor')
        .leftJoinAndSelect('item.category', 'category') // Tornar opcional
        .where('item.donorId = :donorId', { donorId })
        .orderBy('item.receivedDate', pageOptionsDto.order) // Usar receivedDate em vez de createdAt
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      this.logger.debug(`SQL Query: ${queryBuilder.getQuery()}`);

      const itemCount = await queryBuilder.getCount();
      this.logger.debug(`Total de itens encontrados: ${itemCount}`);

      const items = await queryBuilder.getMany();
      this.logger.debug(`Itens carregados: ${items.length}`);

      const pageMetaDto = new PageMetaDto({ pageOptionsDto, itemCount });
      const result = new PageDto(items, pageMetaDto);

      this.logger.debug(`Retornando resultado com ${items.length} itens`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro detalhado ao buscar itens do doador ${donorId}:`,
        error.stack,
        'ItemsService',
        {
          message: error.message,
          pageOptions: pageOptionsDto,
        },
      );

      // Re-throw conhecido errors, wrap unknown ones
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao buscar itens do doador',
      );
    }
  }

  @LogMethod()
  async findOne(id: string): Promise<Item> {
    this.logger.debug(`Buscando item com ID: ${id}`);

    try {
      const item = await this.itemsRepository.findOne({
        where: { id },
        relations: ['donor'],
      });

      if (!item) {
        this.logger.warn(`Item não encontrado com ID: ${id}`);
        throw new NotFoundException(`Item com ID ${id} não encontrado`);
      }

      return item;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar item por ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    currentUser: User,
  ): Promise<Item> {
    this.logger.log(`Atualizando item: ${id}`);

    try {
      const item = await this.findOne(id);

      // Verifica permissão para atualizar
      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.FUNCIONARIO &&
        currentUser.id !== item.donorId
      ) {
        this.logger.warn(
          `Usuário ${currentUser.id} (${currentUser.role}) sem permissão para atualizar o item ${id}`,
        );
        throw new ForbiddenException(
          'Você não tem permissão para atualizar este item.',
        );
      }

      // Se o donorId for alterado, buscar e validar o novo doador
      if (updateItemDto.donorId && updateItemDto.donorId !== item.donorId) {
        this.logger.debug(
          `Alterando doador do item ${id} para: ${updateItemDto.donorId}`,
        );
        const newDonor = await this.usersService.findOne(updateItemDto.donorId);

        if (!newDonor || newDonor.role !== UserRole.DOADOR) {
          this.logger.warn(
            `Tentativa de associar item a um doador inválido: ${updateItemDto.donorId}`,
          );
          throw new NotFoundException(
            `Novo doador com ID ${updateItemDto.donorId} não encontrado ou não é um doador.`,
          );
        }
        item.donor = newDonor;
      }

      // Atualiza os outros campos
      Object.assign(item, updateItemDto);

      const updatedItem = await this.itemsRepository.save(item);
      this.logger.log(`Item atualizado com sucesso: ${id}`);
      return updatedItem;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar item ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async remove(id: string, currentUser: User): Promise<void> {
    this.logger.log(`Removendo item: ${id}`);

    try {
      const item = await this.findOne(id);

      // Verifica permissão para remover (Admin ou Funcionário)
      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.FUNCIONARIO
      ) {
        this.logger.warn(
          `Usuário ${currentUser.id} (${currentUser.role}) sem permissão para remover o item ${id}`,
        );
        throw new ForbiddenException(
          'Você não tem permissão para remover este item.',
        );
      }

      await this.itemsRepository.remove(item);
      this.logger.log(`Item removido com sucesso: ${id}`);
    } catch (error) {
      this.logger.error(
        `Erro ao remover item ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
