// src/modules/distributions/distributions.controller.ts
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
<<<<<<< HEAD
  ForbiddenException,
  Query,
=======
  Query,
  ForbiddenException,
>>>>>>> fb378d50a7704e5cbb0e34b8885e244919630848
} from '@nestjs/common';
import { DistributionsService } from './distributions.service';
import { CreateDistributionDto } from './dto/create-distribution.dto';
import { UpdateDistributionDto } from './dto/update-distribution.dto';
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
<<<<<<< HEAD
=======
  ApiParam,
>>>>>>> fb378d50a7704e5cbb0e34b8885e244919630848
} from '@nestjs/swagger';
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { Distribution } from './entities/distribution.entity';

@ApiTags('distributions')
@Controller('distributions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DistributionsController {
  constructor(private readonly distributionsService: DistributionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova distribuição de itens' })
  @ApiResponse({ status: 201, description: 'Distribuição criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Usuário ou item não encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Conflito (item não disponível, etc).',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createDistributionDto: CreateDistributionDto, @Request() req) {
    return this.distributionsService.create(createDistributionDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as distribuições (com paginação)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de distribuições retornada com sucesso.',
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
  ): Promise<PageDto<Distribution>> {
    return this.distributionsService.findAllPaginated(pageOptionsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma distribuição pelo ID' })
  @ApiResponse({ status: 200, description: 'Distribuição encontrada.' })
  @ApiResponse({ status: 404, description: 'Distribuição não encontrada.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.BENEFICIARIO)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.distributionsService.findOne(id);
  }

  @Get('beneficiary/:beneficiaryId')
<<<<<<< HEAD
  @ApiOperation({
    summary: 'Buscar distribuições por beneficiário (com paginação)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de distribuições retornada com sucesso.',
    type: PageDto,
  })
  @ApiQuery({
    type: PageOptionsDto,
    required: false,
    description: 'Opções de paginação',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.BENEFICIARIO)
  findByBeneficiary(
    @Param('beneficiaryId', ParseUUIDPipe) beneficiaryId: string,
    @Query() pageOptionsDto: PageOptionsDto,
    @Request() req,
  ) {
    // Verificar se o usuário é o próprio beneficiário ou tem permissão para ver
    if (
      req.user.role === UserRole.BENEFICIARIO &&
      req.user.id !== beneficiaryId &&
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.FUNCIONARIO
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para ver distribuições de outros beneficiários.',
      );
    }
=======
  @ApiOperation({ summary: 'Buscar distribuições por beneficiário' })
  @ApiResponse({
    status: 200,
    description: 'Distribuições do beneficiário encontradas com sucesso.',
    type: PageDto<Distribution>,
  })
  @ApiResponse({ status: 404, description: 'Beneficiário não encontrado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiParam({
    name: 'beneficiaryId',
    description: 'ID do beneficiário',
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
    description: 'Quantidade de distribuições por página (padrão: 10)',
    type: 'number',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.BENEFICIARIO)
  async findByBeneficiary(
    @Param('beneficiaryId', ParseUUIDPipe) beneficiaryId: string,
    @Query() pageOptionsDto: PageOptionsDto,
    @Request() req,
  ): Promise<PageDto<Distribution>> {
    // Verificar se é o próprio beneficiário ou admin/funcionário
    if (
      req.user.role === UserRole.BENEFICIARIO &&
      req.user.id !== beneficiaryId
    ) {
      throw new ForbiddenException(
        'Você só pode acessar suas próprias distribuições',
      );
    }

>>>>>>> fb378d50a7704e5cbb0e34b8885e244919630848
    return this.distributionsService.findByBeneficiary(
      beneficiaryId,
      pageOptionsDto,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma distribuição pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Distribuição atualizada com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Distribuição não encontrada.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDistributionDto: UpdateDistributionDto,
    @Request() req: any,
  ) {
    return this.distributionsService.update(
      id,
      updateDistributionDto,
      req.user,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma distribuição pelo ID' })
  @ApiResponse({
    status: 204,
    description: 'Distribuição removida com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Distribuição não encontrada.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.distributionsService.remove(id, req.user);
  }
}
