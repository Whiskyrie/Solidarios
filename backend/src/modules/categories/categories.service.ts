import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    currentUser: User,
  ): Promise<Category> {
    // Apenas Admin ou Funcionário podem criar categorias
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.FUNCIONARIO
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para criar categorias.',
      );
    }

    // Verificar se o nome da categoria já existe
    const existingCategory = await this.categoriesRepository.findOne({
      where: { name: createCategoryDto.name },
    });
    if (existingCategory) {
      throw new ConflictException(
        `Categoria com nome "${createCategoryDto.name}" já existe.`,
      );
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Categoria com ID ${id} não encontrada`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    currentUser: User,
  ): Promise<Category> {
    // Apenas Admin ou Funcionário podem atualizar categorias
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.FUNCIONARIO
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar categorias.',
      );
    }

    const category = await this.findOne(id);

    // Se estiver atualizando o nome, verificar se já existe (e não é a própria categoria)
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existingCategory) {
        throw new ConflictException(
          `Categoria com nome "${updateCategoryDto.name}" já existe.`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    // Apenas Admin ou Funcionário podem remover categorias
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.FUNCIONARIO
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para remover categorias.',
      );
    }

    const category = await this.findOne(id);
    // TODO: Adicionar verificação se a categoria está sendo usada por algum item antes de remover?
    await this.categoriesRepository.remove(category);
  }
}
