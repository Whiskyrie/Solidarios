// src/modules/items/items.controller.ts
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
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
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
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { Item } from './entities/item.entity';

@ApiTags('items')
@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard) // Proteger todas as rotas e verificar roles
@ApiBearerAuth() // Indica que precisa de token JWT para todos os endpoints
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo item/doação' })
  @ApiResponse({ status: 201, description: 'Item criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Doador não encontrado.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.DOADOR) // Admin, Funcionário ou o próprio Doador podem criar
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createItemDto: CreateItemDto, @Request() req) {
    return this.itemsService.create(createItemDto, req.user); // Passa o usuário logado
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os itens/doações (com paginação)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de itens retornada com sucesso.',
    type: PageDto,
  })
  @ApiQuery({
    type: PageOptionsDto,
    required: false,
    description: 'Opções de paginação',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO) // Apenas Admin e Funcionário podem listar todos
  findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Item>> {
    return this.itemsService.findAllPaginated(pageOptionsDto);
  }

  @Get('donor/:donorId')
  @ApiOperation({ summary: 'Listar itens por doador com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de itens do doador retornada com sucesso.',
    type: PageDto,
  })
  @ApiQuery({
    type: PageOptionsDto,
    required: false,
    description: 'Opções de paginação',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.DOADOR)
  getByDonor(
    @Param('donorId', ParseUUIDPipe) donorId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Item>> {
    return this.itemsService.findByDonorPaginated(donorId, pageOptionsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um item/doação pelo ID' })
  @ApiResponse({ status: 200, description: 'Item encontrado.' })
  @ApiResponse({ status: 404, description: 'Item não encontrado.' })
  @Roles(
    UserRole.ADMIN,
    UserRole.FUNCIONARIO,
    UserRole.DOADOR,
    UserRole.BENEFICIARIO,
  ) // Todos podem ver detalhes de um item
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um item/doação pelo ID' })
  @ApiResponse({ status: 200, description: 'Item atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Item ou Doador não encontrado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.DOADOR) // Admin, Funcionário ou o Doador do item podem atualizar
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req,
  ) {
    return this.itemsService.update(id, updateItemDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um item/doação pelo ID' })
  @ApiResponse({ status: 204, description: 'Item removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Item não encontrado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO) // Apenas Admin e Funcionário podem remover
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.itemsService.remove(id, req.user);
  }
}
