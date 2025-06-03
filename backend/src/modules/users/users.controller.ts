// src/modules/users/users.controller.ts
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
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
import { User } from './entities/user.entity';
import { UserStatsDto } from './dto/user-stats.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
// NÃO adicionar @UseInterceptors aqui pois já está global
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Email já está em uso.' })
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários (com paginação)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de usuários retornada com sucesso.',
    type: PageDto,
  })
  @ApiQuery({
    type: PageOptionsDto,
    required: false,
    description: 'Opções de paginação',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<User>> {
    return this.usersService.findAllPaginated(pageOptionsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Email já está em uso.' })
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um usuário pelo ID' })
  @ApiResponse({ status: 204, description: 'Usuário removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Obter estatísticas de doações de um usuário',
    description:
      'Retorna métricas agregadas das doações do usuário: total de doações, pessoas ajudadas e pontuação de impacto',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do usuário retornadas com sucesso.',
    type: UserStatsDto,
    schema: {
      example: {
        userId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        totalDonations: 25,
        peopleHelped: 150,
        impactScore: 200,
        lastUpdated: '2023-12-01T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID do usuário inválido (formato UUID inválido).',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Usuário com ID a1b2c3d4-e5f6-7890-abcd-ef1234567890 não encontrado',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Erro interno do servidor',
        error: 'Internal Server Error',
      },
    },
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.DOADOR)
  async getUserStats(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserStatsDto> {
    return this.usersService.getUserStats(id);
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Buscar usuários por perfil/role' })
  @ApiResponse({
    status: 200,
    description: 'Usuários encontrados com sucesso.',
    type: PageDto<User>,
  })
  @ApiResponse({ status: 400, description: 'Role inválido.' })
  @ApiParam({
    name: 'role',
    description: 'Perfil do usuário',
    enum: UserRole,
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
    description: 'Quantidade de usuários por página (padrão: 10)',
    type: 'number',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  async findByRole(
    @Param('role') role: UserRole,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<User>> {
    // Validar se o role é válido
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('Role inválido');
    }

    return this.usersService.findByRole(role, pageOptionsDto);
  }

  @Get('beneficiaries')
  @ApiOperation({ summary: 'Buscar apenas beneficiários (atalho)' })
  @ApiResponse({
    status: 200,
    description: 'Beneficiários encontrados com sucesso.',
    type: PageDto<User>,
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
    description: 'Quantidade de beneficiários por página (padrão: 10)',
    type: 'number',
  })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO)
  findBeneficiaries(@Query() pageOptionsDto: PageOptionsDto): PageDto<User> {
    return this.usersService.findByRole(UserRole.BENEFICIARIO, pageOptionsDto);
  }
}
