import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemStatus } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { PageMetaDto } from '../../common/pagination/dto/page-meta.dto';
import { LoggingService } from '../../common/logging/logging.service';
import { LogMethod } from '../../common/logging/logger.decorator';
import { DonorStatsDto } from './dto/donor-stats.dto';
import { BackBlazeService } from '../../common/services/backblaze.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private readonly logger: LoggingService,
    private readonly backBlazeService: BackBlazeService,
  ) {
    this.logger.setContext('ItemsService');
  }

  @LogMethod()
  async create(createItemDto: CreateItemDto, currentUser: User): Promise<Item> {
    this.logger.log(
      `Criando novo item com doador ID: ${createItemDto.donorId}`,
    );

    try {
      const donor = await this.usersService.findOne(createItemDto.donorId);
      if (!donor || donor.role !== UserRole.DOADOR) {
        this.logger.warn(
          `Tentativa de criar item com doador inválido: ${createItemDto.donorId}`,
        );
        throw new NotFoundException(
          `Doador com ID ${createItemDto.donorId} não encontrado ou não é um doador.`,
        );
      }

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

  async findAll(): Promise<Item[]> {
    this.logger.debug('Buscando todos os itens (sem paginação)');
    return this.itemsRepository.find({ relations: ['donor'] });
  }

  @LogMethod()
  async findAvailablePaginated(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Item>> {
    this.logger.debug(
      `Buscando itens DISPONÍVEIS paginados - página ${pageOptionsDto.page}`,
    );

    try {
      const queryBuilder = this.itemsRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.donor', 'donor')
        .leftJoinAndSelect('item.category', 'category')
        .where('item.status = :status', { status: 'disponivel' })
        .orderBy('item.receivedDate', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const items = await queryBuilder.getMany();

      const pageMetaDto = new PageMetaDto({ pageOptionsDto, itemCount });

      this.logger.debug(
        `Retornando ${items.length} itens disponíveis (total: ${itemCount})`,
      );
      return new PageDto(items, pageMetaDto);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar itens disponíveis paginados: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

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
    this.logger.debug(`Buscando itens do doador ${donorId}`);

    try {
      const queryBuilder = this.itemsRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.donor', 'donor')
        .leftJoinAndSelect('item.category', 'category')
        .where('item.donorId = :donorId', { donorId })
        .orderBy('item.receivedDate', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);

      const itemCount = await queryBuilder.getCount();
      const items = await queryBuilder.getMany();

      const pageMetaDto = new PageMetaDto({ pageOptionsDto, itemCount });

      return new PageDto(items, pageMetaDto);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar itens do doador ${donorId}: ${error.message}`,
        error.stack,
      );
      throw error;
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

      // Remover fotos antes de deletar o item
      await this.removeAllPhotos(item);

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

  @LogMethod()
  async getDonorStats(
    donorId: string,
    currentUser: User,
  ): Promise<DonorStatsDto> {
    this.logger.log(`Calculando estatísticas para o doador: ${donorId}`);

    try {
      if (
        currentUser.role !== UserRole.ADMIN &&
        currentUser.role !== UserRole.FUNCIONARIO &&
        currentUser.id !== donorId
      ) {
        this.logger.warn(
          `Usuário ${currentUser.id} tentou acessar estatísticas do doador ${donorId} sem permissão`,
        );
        throw new ForbiddenException(
          'Você não tem permissão para acessar estas estatísticas.',
        );
      }

      const donor = await this.usersRepository.findOne({
        where: { id: donorId, role: UserRole.DOADOR },
      });

      if (!donor) {
        throw new NotFoundException(`Doador com ID ${donorId} não encontrado.`);
      }

      const items = await this.itemsRepository.find({
        where: { donorId },
        relations: ['category', 'distributions', 'distributions.beneficiary'],
      });

      const totalDonations = items.length;
      const availableItems = items.filter(
        (item) => item.status === ItemStatus.DISPONIVEL,
      ).length;
      const distributedItems = items.filter(
        (item) => item.status === ItemStatus.DISTRIBUIDO,
      ).length;
      const reservedItems = items.filter(
        (item) => item.status === ItemStatus.RESERVADO,
      ).length;

      const uniqueBeneficiaries = new Set<string>();
      items.forEach((item) => {
        if (item.distributions && Array.isArray(item.distributions)) {
          item.distributions.forEach((dist) => {
            if (dist.beneficiaryId) {
              uniqueBeneficiaries.add(dist.beneficiaryId);
            }
          });
        }
      });
      const peopleHelped = uniqueBeneficiaries.size;

      const impactScore =
        distributedItems * 3 + reservedItems * 1 + peopleHelped * 2;

      const categoryMap = new Map<string, number>();
      items.forEach((item) => {
        const categoryName = item.category?.name || 'Sem categoria';
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
      });
      const donationsByCategory = Array.from(categoryMap.entries()).map(
        ([categoryName, count]) => ({
          categoryName,
          count,
        }),
      );

      const typeMap = new Map<string, number>();
      items.forEach((item) => {
        typeMap.set(item.type, (typeMap.get(item.type) || 0) + 1);
      });
      const donationsByType = Array.from(typeMap.entries()).map(
        ([type, count]) => ({
          type,
          count,
        }),
      );

      const sortedItems = items.sort(
        (a, b) =>
          new Date(b.receivedDate).getTime() -
          new Date(a.receivedDate).getTime(),
      );
      const lastDonationDate =
        sortedItems.length > 0 ? sortedItems[0].receivedDate : undefined;

      let averageDonationInterval: number | undefined;
      if (items.length > 1) {
        const intervals: number[] = [];
        for (let i = 1; i < sortedItems.length; i++) {
          const diff =
            new Date(sortedItems[i - 1].receivedDate).getTime() -
            new Date(sortedItems[i].receivedDate).getTime();
          intervals.push(diff / (1000 * 60 * 60 * 24));
        }
        averageDonationInterval =
          intervals.reduce((sum, interval) => sum + interval, 0) /
          intervals.length;
      }

      const stats: DonorStatsDto = {
        donorId,
        totalDonations,
        availableItems,
        distributedItems,
        reservedItems,
        peopleHelped,
        impactScore,
        donationsByCategory,
        donationsByType,
        lastDonationDate,
        averageDonationInterval,
        lastUpdated: new Date(),
      };

      this.logger.log(
        `Estatísticas calculadas para doador ${donorId}: ${totalDonations} doações, ${peopleHelped} pessoas ajudadas, impacto ${impactScore}`,
      );

      return stats;
    } catch (error) {
      this.logger.error(
        `Erro ao calcular estatísticas do doador ${donorId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // =============================================
  // MÉTODOS PARA MANIPULAÇÃO DE FOTOS
  // =============================================

  /**
   * Faz upload de fotos para um item
   */
  @LogMethod()
  async uploadPhotos(
    itemId: string,
    files: MulterFile[],
    currentUser: User,
  ): Promise<Item> {
    this.logger.log(
      `Fazendo upload de ${files.length} foto(s) para item ${itemId}`,
    );

    try {
      const item = await this.findOne(itemId);
      if (!item) {
        throw new NotFoundException('Item não encontrado');
      }

      this.checkItemPermissions(item, currentUser, 'update');

      const currentPhotosCount = item.photos ? item.photos.length : 0;
      const newPhotosCount = files.length;
      const totalPhotos = currentPhotosCount + newPhotosCount;

      if (totalPhotos > 5) {
        throw new BadRequestException(
          `Item pode ter no máximo 5 fotos. Atualmente: ${currentPhotosCount}, tentando adicionar: ${newPhotosCount}`,
        );
      }

      const uploadPromises = files.map((file) =>
        this.backBlazeService.uploadImage(file, true),
      );

      const uploadResults = await Promise.all(uploadPromises);
      const newPhotoUrls = uploadResults.map((result) => result.publicUrl);
      const updatedPhotos = [...(item.photos || []), ...newPhotoUrls];

      await this.itemsRepository.update(itemId, {
        photos: updatedPhotos,
      });

      const updatedItem = await this.findOne(itemId);

      this.logger.log(
        `Upload concluído: ${files.length} foto(s) adicionada(s) ao item ${itemId}`,
      );

      return updatedItem;
    } catch (error) {
      this.logger.error(
        `Erro ao fazer upload de fotos para item ${itemId}:`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Remove uma foto de um item
   */
  @LogMethod()
  async removePhoto(
    itemId: string,
    photoUrl: string,
    currentUser: User,
  ): Promise<Item> {
    this.logger.log(`Removendo foto ${photoUrl} do item ${itemId}`);

    try {
      const item = await this.findOne(itemId);
      if (!item) {
        throw new NotFoundException('Item não encontrado');
      }

      this.checkItemPermissions(item, currentUser, 'update');

      if (!item.photos || !item.photos.includes(photoUrl)) {
        throw new NotFoundException('Foto não encontrada no item');
      }

      let fileName: string;
      try {
        fileName = this.backBlazeService.extractFileNameFromUrl(photoUrl);
      } catch (error) {
        this.logger.error(
          `Erro ao extrair nome do arquivo da URL: ${error.message}`,
          error.stack,
        );
        throw new BadRequestException('URL da foto inválida');
      }

      if (this.backBlazeService.isBackBlazeUrl(photoUrl)) {
        try {
          await this.backBlazeService.deleteImage(fileName);
        } catch (error) {
          this.logger.warn(
            `Erro ao remover foto do BackBlaze: ${error.message}`,
          );
        }
      }

      const updatedPhotos = item.photos.filter((url) => url !== photoUrl);

      await this.itemsRepository.update(itemId, {
        photos: updatedPhotos,
      });

      const updatedItem = await this.findOne(itemId);

      this.logger.log(`Foto removida com sucesso do item ${itemId}`);

      return updatedItem;
    } catch (error) {
      this.logger.error(`Erro ao remover foto do item ${itemId}:`, error.stack);
      throw error;
    }
  }

  /**
   * Remove todas as fotos de um item (usado na exclusão do item)
   */
  @LogMethod()
  async removeAllPhotos(item: Item): Promise<void> {
    if (!item.photos || item.photos.length === 0) {
      return;
    }

    this.logger.log(`Removendo todas as fotos do item ${item.id}`);

    const backBlazeUrls = item.photos.filter((url) =>
      this.backBlazeService.isBackBlazeUrl(url),
    );

    if (backBlazeUrls.length > 0) {
      const fileNames = backBlazeUrls.map((url) =>
        this.backBlazeService.extractFileNameFromUrl(url),
      );

      try {
        await this.backBlazeService.deleteMultipleImages(fileNames);
      } catch (error) {
        this.logger.warn(
          `Erro ao remover fotos do BackBlaze para item ${item.id}:`,
          error,
        );
      }
    }
  }

  /**
   * Verifica permissões do usuário para modificar um item
   */
  private checkItemPermissions(
    item: Item,
    currentUser: User,
    _action: 'read' | 'update' | 'delete',
  ): void {
    if ([UserRole.ADMIN, UserRole.FUNCIONARIO].includes(currentUser.role)) {
      return;
    }

    if (currentUser.role === UserRole.DOADOR) {
      if (item.donorId !== currentUser.id) {
        throw new ForbiddenException(
          'Você só pode modificar seus próprios itens',
        );
      }
      return;
    }

    throw new ForbiddenException('Você não tem permissão para esta ação');
  }
}
