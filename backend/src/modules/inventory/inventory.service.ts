// src/modules/inventory/inventory.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ItemsService } from '../items/items.service';
import { User, UserRole } from '../users/entities/user.entity';
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { PageMetaDto } from '../../common/pagination/dto/page-meta.dto';
import { LoggingService } from '../../common/logging/logging.service';
import { LogMethod } from '../../common/logging/logger.decorator';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private itemsService: ItemsService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('InventoryService');
  }

  @LogMethod()
  async create(
    createInventoryDto: CreateInventoryDto,
    _currentUser: User,
  ): Promise<Inventory> {
    this.logger.log(
      `Adicionando item ${createInventoryDto.itemId} ao inventário`,
    );

    try {
      // Verificar se o item existe
      const item = await this.itemsService.findOne(createInventoryDto.itemId);
      if (!item) {
        throw new NotFoundException('Item não encontrado');
      }

      // Verificar se já existe no inventário
      const existingInventory = await this.inventoryRepository.findOne({
        where: { itemId: createInventoryDto.itemId },
      });

      if (existingInventory) {
        throw new ConflictException('Item já existe no inventário');
      }

      // CORREÇÃO: Usar donorId do item se não fornecido
      const inventoryEntry = this.inventoryRepository.create({
        ...createInventoryDto,
        donorId: createInventoryDto.donorId || item.donorId, // Usar donorId do item
        quantity: createInventoryDto.quantity || 1,
      });

      const savedEntry = await this.inventoryRepository.save(inventoryEntry);

      this.logger.log(
        `Item adicionado ao inventário com sucesso: ${savedEntry.id}`,
      );

      return savedEntry;
    } catch (error) {
      this.logger.error(
        `Erro ao adicionar item ao inventário: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Método antigo sem paginação, mantido para compatibilidade
  async findAll(): Promise<Inventory[]> {
    this.logger.debug('Buscando todo o inventário (sem paginação)');
    return this.inventoryRepository.find({ relations: ['item', 'item.donor'] });
  }

  // Novo método com paginação
  @LogMethod()
  async findAllPaginated(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Inventory>> {
    this.logger.debug(
      `Buscando inventário paginado - página ${pageOptionsDto.page}`,
    );

    try {
      const queryBuilder = this.inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.item', 'item')
        .leftJoinAndSelect('item.donor', 'donor')
        .leftJoinAndSelect('item.category', 'category')
        .orderBy('inventory.createdAt', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const inventory = await queryBuilder.getMany();

      const pageMetaDto = new PageMetaDto({ pageOptionsDto, itemCount });

      this.logger.debug(
        `Retornando ${inventory.length} registros de inventário (total: ${itemCount})`,
      );
      return new PageDto(inventory, pageMetaDto);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar inventário paginado: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async findOne(id: string): Promise<Inventory> {
    this.logger.debug(`Buscando registro de inventário com ID: ${id}`);

    try {
      const inventoryEntry = await this.inventoryRepository.findOne({
        where: { id },
        relations: ['item', 'item.donor'],
      });

      if (!inventoryEntry) {
        this.logger.warn(`Registro de inventário não encontrado com ID: ${id}`);
        throw new NotFoundException(
          `Registro de inventário com ID ${id} não encontrado`,
        );
      }

      return inventoryEntry;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar registro de inventário: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findLowStock(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Inventory>> {
    this.logger.log('Buscando itens com estoque baixo.');
    const queryBuilder = this.inventoryRepository.createQueryBuilder('inventory');

    queryBuilder
      .leftJoinAndSelect('inventory.item', 'item')
      .where('inventory.quantity <= inventory.alertLevel')
      .andWhere('inventory.alertLevel > 0')
      // CORREÇÃO: Ordenar pela coluna 'quantity' do inventário, usando a direção de pageOptionsDto.order
      .orderBy('inventory.quantity', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  @LogMethod()
  async findByItemId(itemId: string): Promise<Inventory> {
    this.logger.debug(`Buscando registro de inventário para o item: ${itemId}`);

    try {
      const inventoryEntry = await this.inventoryRepository.findOne({
        where: { itemId },
        relations: ['item', 'item.donor'],
      });

      if (!inventoryEntry) {
        this.logger.warn(
          `Registro de inventário não encontrado para o item: ${itemId}`,
        );
        throw new NotFoundException(
          `Registro de inventário para o item com ID ${itemId} não encontrado`,
        );
      }

      return inventoryEntry;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar registro de inventário por item: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
    currentUser: User,
  ): Promise<Inventory> {
    this.logger.log(`Atualizando registro de inventário: ${id}`);

    try {
      // Apenas Admin ou Funcionário podem atualizar o inventário
      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.FUNCIONARIO
      ) {
        this.logger.warn(
          `Usuário ${currentUser.id} (${currentUser.role}) sem permissão para atualizar inventário`,
        );
        throw new ForbiddenException(
          'Você não tem permissão para atualizar o inventário.',
        );
      }

      const inventoryEntry = await this.findOne(id);

      // Se o itemId for alterado, buscar e validar o novo item
      if (
        updateInventoryDto.itemId &&
        updateInventoryDto.itemId !== inventoryEntry.itemId
      ) {
        this.logger.debug(
          `Alterando item do registro de inventário ${id} para: ${updateInventoryDto.itemId}`,
        );
        const newItem = await this.itemsService.findOne(
          updateInventoryDto.itemId,
        );
        inventoryEntry.item = newItem;
      }

      Object.assign(inventoryEntry, updateInventoryDto);

      const updatedEntry = await this.inventoryRepository.save(inventoryEntry);
      this.logger.log(`Registro de inventário atualizado com sucesso: ${id}`);
      return updatedEntry;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar registro de inventário: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async remove(id: string, currentUser: User): Promise<void> {
    this.logger.log(`Removendo registro de inventário: ${id}`);

    try {
      // Apenas Admin ou Funcionário podem remover do inventário
      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.FUNCIONARIO
      ) {
        this.logger.warn(
          `Usuário ${currentUser.id} (${currentUser.role}) sem permissão para remover do inventário`,
        );
        throw new ForbiddenException(
          'Você não tem permissão para remover itens do inventário.',
        );
      }

      const inventoryEntry = await this.findOne(id);
      await this.inventoryRepository.remove(inventoryEntry);
      this.logger.log(`Registro de inventário removido com sucesso: ${id}`);
    } catch (error) {
      this.logger.error(
        `Erro ao remover registro de inventário: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Método para atualizar a quantidade (usado na distribuição)
  @LogMethod()
  async updateQuantity(itemId: string, change: number): Promise<Inventory> {
    this.logger.log(
      `Atualizando quantidade para o item ${itemId} em ${change} unidades`,
    );

    try {
      const inventoryEntry = await this.findByItemId(itemId);
      const newQuantity = inventoryEntry.quantity + change;

      if (newQuantity < 0) {
        this.logger.warn(
          `Quantidade insuficiente em estoque para o item ${itemId}. Atual: ${inventoryEntry.quantity}, Solicitada: ${Math.abs(change)}`,
        );
        throw new ConflictException(
          `Quantidade insuficiente em estoque para o item ${itemId}.`,
        );
      }

      inventoryEntry.quantity = newQuantity;

      const updatedEntry = await this.inventoryRepository.save(inventoryEntry);
      this.logger.log(
        `Quantidade atualizada para o item ${itemId}. Nova quantidade: ${newQuantity}`,
      );
      return updatedEntry;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar quantidade do item ${itemId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
