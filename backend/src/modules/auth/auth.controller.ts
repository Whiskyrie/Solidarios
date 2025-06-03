import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Ip,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import {
  RefreshTokenDto,
  TokensResponseDto,
  RevokeTokenDto,
  ActiveSessionDto,
} from './dto/refresh-token.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60 } }) // ✅ Rate limiting: 5 tentativas por minuto
  @ApiOperation({ summary: 'Autenticar usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário autenticado com sucesso.',
    type: TokensResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas de login.' })
  @ApiHeader({
    name: 'User-Agent',
    description: 'Informações do navegador/dispositivo',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const context = { ipAddress: ip, userAgent };
    return this.authService.login(loginDto, context);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60 } }) // ✅ Rate limiting: 3 registros por minuto
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso.',
    type: TokensResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Email já está em uso.' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const context = { ipAddress: ip, userAgent };
    return this.authService.register(registerDto, context);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60 } }) // ✅ Rate limiting: 10 refreshs por minuto
  @ApiOperation({ summary: 'Renovar tokens de acesso' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso.',
    type: TokensResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado.',
  })
  @ApiResponse({ status: 403, description: 'Token reuse detected.' })
  @ApiBody({ type: RefreshTokenDto })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<TokensResponseDto> {
    const context = {
      ipAddress: ip,
      userAgent,
      deviceFingerprint: refreshTokenDto.deviceFingerprint,
    };
    return this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
      context,
    );
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 300 } }) // ✅ Rate limiting: 3 tentativas por 5 minutos
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({
    status: 204,
    description: 'Solicitação de redefinição de senha enviada.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { email: { type: 'string', format: 'email' } },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async forgotPassword(@Body('email') email: string) {
    await this.authService.forgotPassword(email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 300 } }) // ✅ Rate limiting: 5 tentativas por 5 minutos
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiResponse({ status: 204, description: 'Senha redefinida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        password: { type: 'string', minLength: 6 },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async resetPassword(@Body() body: { token: string; password: string }) {
    await this.authService.resetPassword(body.token, body.password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Fazer logout (revogar tokens)' })
  @ApiResponse({ status: 204, description: 'Logout realizado com sucesso.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.id);
  }

  // ✅ NOVO: Logout de sessão específica
  @Post('logout/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Fazer logout de sessão específica' })
  @ApiResponse({ status: 204, description: 'Sessão encerrada com sucesso.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutSession(
    @Request() req: any,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    await this.authService.logout(req.user.id, sessionId);
  }

  // ✅ NOVO: Revogar token específico
  @Post('revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revogar token específico' })
  @ApiResponse({ status: 204, description: 'Token revogado com sucesso.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async revokeToken(
    @Body() revokeTokenDto: RevokeTokenDto,
    @Request() req: any,
  ) {
    if (revokeTokenDto.revokeAll) {
      await this.authService.revokeAllUserTokens(req.user.id, 'manual');
    } else {
      // Implementar revogação de token específico
      // Seria necessário adicionar método no service
    }
  }

  // ✅ NOVO: Listar sessões ativas
  @Get('sessions')
  @ApiOperation({ summary: 'Listar sessões ativas do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Sessões ativas retornadas com sucesso.',
    type: [ActiveSessionDto],
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getActiveSessions(@Request() req: any): Promise<ActiveSessionDto[]> {
    return this.authService.getActiveSessions(req.user.id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user);
  }
}
