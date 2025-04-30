// src/modules/items/items.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private usersService: UsersService, // Injeta UsersService para validar o doador
  ) {}

  async create(createItemDto: CreateItemDto, currentUser: User): Promise<Item> {
    // Verifica se o doador existe e se o usuário logado tem permissão
    const donor = await this.usersService.findOne(createItemDto.donorId);
    if (!donor || donor.role !== UserRole.DOADOR) {
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
      throw new ForbiddenException(
        'Você não tem permissão para cadastrar este item.',
      );
    }

    const item = this.itemsRepository.create({
      ...createItemDto,
      donor: donor, // Associa o objeto doador encontrado
    });
    return this.itemsRepository.save(item);
  }

  // Método antigo sem paginação, mantido para compatibilidade
  async findAll(): Promise<Item[]> {
    return this.itemsRepository.find({ relations: ['donor'] });
  }

  // Novo método com paginação
  async findAllPaginated(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Item>> {
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
    return new PageDto(items, pageMetaDto);
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: ['donor'],
    });
    if (!item) {
      throw new NotFoundException(`Item com ID ${id} não encontrado`);
    }
    return item;
  }

  async update(
    id: string,
    updateItemDto: UpdateItemDto,
    currentUser: User,
  ): Promise<Item> {
    const item = await this.findOne(id);

    // Verifica permissão para atualizar (Admin, Funcionário ou o próprio Doador do item)
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.FUNCIONARIO &&
      currentUser.id !== item.donorId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este item.',
      );
    }

    // Se o donorId for alterado, buscar e validar o novo doador
    if (updateItemDto.donorId && updateItemDto.donorId !== item.donorId) {
      const newDonor = await this.usersService.findOne(updateItemDto.donorId);
      if (!newDonor || newDonor.role !== UserRole.DOADOR) {
        throw new NotFoundException(
          `Novo doador com ID ${updateItemDto.donorId} não encontrado ou não é um doador.`,
        );
      }
      item.donor = newDonor; // Atualiza o objeto doador
    }

    // Atualiza os outros campos
    Object.assign(item, updateItemDto);

    return this.itemsRepository.save(item);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const item = await this.findOne(id);

    // Verifica permissão para remover (Admin ou Funcionário)
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.FUNCIONARIO
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para remover este item.',
      );
    }

    await this.itemsRepository.remove(item);
  }
}
