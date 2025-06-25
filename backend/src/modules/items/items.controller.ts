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
  UseInterceptors, // Adicionado
  UploadedFiles, // Adicionado
  BadRequestException, // Adicionado
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express'; // Adicionado
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
  ApiConsumes, // Adicionado
  ApiBody, // Adicionado
} from '@nestjs/swagger';
import { PageOptionsDto } from '../../common/pagination/dto/page-options.dto';
import { PageDto } from '../../common/pagination/dto/page.dto';
import { Item } from './entities/item.entity';
import { DonorStatsDto } from './dto/donor-stats.dto';

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
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: 400,
      exceptionFactory: (errors) => {
        const errorMessages = errors.map((error) => ({
          field: error.property,
          value: error.value,
          constraints: error.constraints,
        }));
        return new BadRequestException({
          message: 'Dados de entrada inválidos para criação de item',
          errors: errorMessages,
          statusCode: 400,
        });
      },
    }),
  )
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
  @ApiOperation({
    summary:
      'Listar todos os itens disponíveis para beneficiários (com paginação)',
  })
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
  findAvailable(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Item>> {
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

  @Post(':id/photos')
  @ApiOperation({ summary: 'Fazer upload de fotos para um item' })
  @ApiParam({
    name: 'id',
    description: 'ID do item',
    type: 'string',
    format: 'uuid',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivos de imagem para upload',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Fotos enviadas com sucesso.',
    type: Item,
  })
  @ApiResponse({ status: 400, description: 'Arquivos inválidos.' })
  @ApiResponse({ status: 404, description: 'Item não encontrado.' })
  @ApiResponse({ status: 413, description: 'Arquivo muito grande.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.DOADOR)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB por arquivo
        files: 5, // máximo 5 arquivos
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Apenas arquivos de imagem são permitidos'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhotos(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: MulterFile[],
    @Request() req,
  ): Promise<Item> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Pelo menos um arquivo deve ser enviado');
    }

    return this.itemsService.uploadPhotos(id, files, req.user);
  }

  /**
   * Remover foto de um item
   */
  @Delete(':id/photos')
  @ApiOperation({ summary: 'Remover foto de um item' })
  @ApiParam({
    name: 'id',
    description: 'ID do item',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description: 'URL da foto a ser removida',
    schema: {
      type: 'object',
      properties: {
        photoUrl: {
          type: 'string',
          description: 'URL da foto a ser removida',
        },
      },
      required: ['photoUrl'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Foto removida com sucesso.',
    type: Item,
  })
  @ApiResponse({ status: 400, description: 'URL da foto inválida.' })
  @ApiResponse({ status: 404, description: 'Item ou foto não encontrada.' })
  @Roles(UserRole.ADMIN, UserRole.FUNCIONARIO, UserRole.DOADOR)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async removePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('photoUrl') photoUrl: string,
    @Request() req,
  ): Promise<Item> {
    if (!photoUrl) {
      throw new BadRequestException('URL da foto é obrigatória');
    }

    return this.itemsService.removePhoto(id, photoUrl, req.user);
  }
}
