// src/modules/inventory/inventory.controller.ts
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
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
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
import { Inventory } from './entities/inventory.entity';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar um item ao inventário' })
  @ApiResponse({
    status: 201,
    description: 'Item adicionado ao inventário com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Item não encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Item não disponível ou já existe no inventário.',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createInventoryDto: CreateInventoryDto, @Request() req) {
    return this.inventoryService.create(createInventoryDto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os itens no inventário (com paginação)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de inventário retornada com sucesso.',
    type: PageDto,
  })
  @ApiQuery({
    type: PageOptionsDto,
    required: false,
    description: 'Opções de paginação',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  findAll(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Inventory>> {
    return this.inventoryService.findAllPaginated(pageOptionsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro de inventário pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Registro de inventário encontrado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de inventário não encontrado.',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(id);
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Buscar um registro de inventário pelo ID do item' })
  @ApiResponse({
    status: 200,
    description: 'Registro de inventário encontrado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de inventário não encontrado.',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  findByItemId(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.inventoryService.findByItemId(itemId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um registro de inventário pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Registro de inventário atualizado com sucesso.',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de inventário ou Item não encontrado.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @Request() req,
  ) {
    return this.inventoryService.update(id, updateInventoryDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro de inventário pelo ID' })
  @ApiResponse({
    status: 204,
    description: 'Registro de inventário removido com sucesso.',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de inventário não encontrado.',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.inventoryService.remove(id, req.user);
  }
}
