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
  ForbiddenException,
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
  ApiParam,
} from '@nestjs/swagger';
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { Item } from './entities/item.entity';
import { DonorStatsDto } from './dto/donor-stats.dto';

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

   @Get('available/all') // ROTA NOVA -> GET /items/available/all
  @ApiOperation({ summary: 'Listar todos os itens disponíveis para beneficiários (com paginação)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de itens disponíveis retornada com sucesso.',
    type: PageDto,
  })
  @ApiQuery({
    type: PageOptionsDto,
    required: false,
    description: 'Opções de paginação',
  })
  // PERMISSÃO CORRIGIDA: Agora Beneficiários (e outros) podem acessar esta rota
  @Roles(UserRole.BENEFICIARIO, UserRole.ADMIN, UserRole.FUNCIONARIO) 
  findAvailable(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Item>> {
    // Chama um novo método no serviço que você criará no próximo passo
    return this.itemsService.findAvailablePaginated(pageOptionsDto);
  }

  @Get('donor/:donorId')
  @ApiOperation({ summary: 'Buscar itens por doador' })
  @ApiResponse({
    status: 200,
    description: 'Itens do doador encontrados com sucesso.',
    type: PageDto<Item>,
  })
  @ApiResponse({ status: 404, description: 'Doador não encontrado.' })
  @ApiParam({
    name: 'donorId',
    description: 'ID do doador',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página (padrão: 1)',
    type: 'number',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Quantidade de itens por página (padrão: 10)',
    type: 'number',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.DOADOR)
  async findByDonor(
    @Param('donorId', ParseUUIDPipe) donorId: string,
    @Query() pageOptionsDto: PageOptionsDto,
    @Request() req,
  ): Promise<PageDto<Item>> {
    // Verificar se é o próprio doador ou admin/funcionário
    if (req.user.role === UserRole.DOADOR && req.user.id !== donorId) {
      throw new ForbiddenException('Você só pode acessar seus próprios itens');
    }

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

  @Get('donor/:donorId/stats')
  @ApiOperation({
    summary: 'Obter estatísticas detalhadas de um doador',
    description:
      'Retorna estatísticas de impacto e performance das doações de um doador específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do doador retornadas com sucesso.',
    type: DonorStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Doador não encontrado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.DOADOR)
  async getDonorStats(
    @Param('donorId', ParseUUIDPipe) donorId: string,
    @Request() req,
  ): Promise<DonorStatsDto> {
    return this.itemsService.getDonorStats(donorId, req.user);
  }
}
