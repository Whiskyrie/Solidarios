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
import { ItemStatus } from '../items/entities/item.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { PageMetaDto } from '../../common/pagination/dto/page-meta.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private itemsService: ItemsService,
  ) {}

  async create(
    createInventoryDto: CreateInventoryDto,
    currentUser: User,
  ): Promise<Inventory> {
    // Apenas Admin ou Funcionário podem adicionar itens ao inventário
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.FUNCIONARIO
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar itens ao inventário.',
      );
    }

    // Verifica se o item existe e está disponível
    const item = await this.itemsService.findOne(createInventoryDto.itemId);
    if (item.status !== ItemStatus.DISPONIVEL) {
      throw new ConflictException(
        `Item com ID ${createInventoryDto.itemId} não está disponível para adicionar ao estoque.`,
      );
    }

    // Verifica se já existe um registro de inventário para este item
    const existingInventory = await this.inventoryRepository.findOne({
      where: { itemId: createInventoryDto.itemId },
    });
    if (existingInventory) {
      throw new ConflictException(
        `Já existe um registro de inventário para o item com ID ${createInventoryDto.itemId}. Use a rota de atualização.`,
      );
    }

    const inventoryEntry = this.inventoryRepository.create({
      ...createInventoryDto,
      item: item, // Associa o objeto item
    });
    return this.inventoryRepository.save(inventoryEntry);
  }

  // Método antigo sem paginação, mantido para compatibilidade
  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find({ relations: ['item', 'item.donor'] });
  }

  // Novo método com paginação
  async findAllPaginated(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Inventory>> {
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
    return new PageDto(inventory, pageMetaDto);
  }

  async findOne(id: string): Promise<Inventory> {
    const inventoryEntry = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['item', 'item.donor'],
    });
    if (!inventoryEntry) {
      throw new NotFoundException(
        `Registro de inventário com ID ${id} não encontrado`,
      );
    }
    return inventoryEntry;
  }

  async findByItemId(itemId: string): Promise<Inventory> {
    const inventoryEntry = await this.inventoryRepository.findOne({
      where: { itemId },
      relations: ['item', 'item.donor'],
    });
    if (!inventoryEntry) {
      throw new NotFoundException(
        `Registro de inventário para o item com ID ${itemId} não encontrado`,
      );
    }
    return inventoryEntry;
  }

  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
    currentUser: User,
  ): Promise<Inventory> {
    // Apenas Admin ou Funcionário podem atualizar o inventário
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.FUNCIONARIO
    ) {
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
      const newItem = await this.itemsService.findOne(
        updateInventoryDto.itemId,
      );
      // Adicionar validações extras se necessário (ex: status do novo item)
      inventoryEntry.item = newItem;
    }

    Object.assign(inventoryEntry, updateInventoryDto);
    return this.inventoryRepository.save(inventoryEntry);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    // Apenas Admin ou Funcionário podem remover do inventário
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.FUNCIONARIO
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para remover itens do inventário.',
      );
    }

    const inventoryEntry = await this.findOne(id);
    await this.inventoryRepository.remove(inventoryEntry);
  }

  // Método para atualizar a quantidade (usado na distribuição)
  async updateQuantity(itemId: string, change: number): Promise<Inventory> {
    const inventoryEntry = await this.findByItemId(itemId);
    const newQuantity = inventoryEntry.quantity + change;

    if (newQuantity < 0) {
      throw new ConflictException(
        `Quantidade insuficiente em estoque para o item ${itemId}.`,
      );
    }

    inventoryEntry.quantity = newQuantity;
    return this.inventoryRepository.save(inventoryEntry);
  }
}
