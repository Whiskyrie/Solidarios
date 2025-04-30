// src/modules/categories/categories.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { Category } from './entities/category.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 409, description: 'Nome da categoria já existe.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO) // Apenas Admin e Funcionário podem criar
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    return this.categoriesService.create(createCategoryDto, req.user);
  }

  @Public() // Tornar este endpoint público
  @Get()
  @ApiOperation({ summary: 'Listar todas as categorias (com paginação)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de categorias retornada com sucesso.',
    type: PageDto,
  })
  @ApiQuery({
    type: PageOptionsDto,
    required: false,
    description: 'Opções de paginação',
  })
  findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Category>> {
    return this.categoriesService.findAllPaginated(pageOptionsDto);
  }

  @Public() // Tornar este endpoint público
  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma categoria pelo ID' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada.' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma categoria pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Categoria atualizada com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 409, description: 'Nome da categoria já existe.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO) // Apenas Admin e Funcionário podem atualizar
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover uma categoria pelo ID' })
  @ApiResponse({ status: 204, description: 'Categoria removida com sucesso.' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO) // Apenas Admin e Funcionário podem remover
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.categoriesService.remove(id, req.user);
  }
}
