import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { LoggingService } from '../../common/logging/logging.service';
import { LogMethod } from '../../common/logging/logger.decorator';
import { JwtConfigService } from '../../config/jwt.config';
import { SecurityConfigService } from '../../config/security.config';
import { TokensResponseDto, ActiveSessionDto } from './dto/refresh-token.dto';

interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

@Injectable()
export class AuthService {
  private jwtConfig: JwtConfigService;
  private securityConfig: SecurityConfigService;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AuthService');
    this.jwtConfig = JwtConfigService.getInstance(configService);
    this.securityConfig = new SecurityConfigService(configService);
  }

  @LogMethod()
  async validateUser(
    email: string,
    password: string,
  ): Promise<Partial<User> | null> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (user && (await user.validatePassword(password))) {
        this.logger.logAuth('validation', user.id, true);
        const { password: _, ...result } = user;
        return result;
      }
      this.logger.logAuth('validation', undefined, false, `Email: ${email}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao validar usuário: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  @LogMethod()
  async login(loginDto: LoginDto, context: LoginContext = {}) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user || !user.id) {
      this.logger.logAuth(
        'login',
        undefined,
        false,
        `Email: ${loginDto.email}`,
      );
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // ✅ Verificar limite de sessões ativas
    await this.checkActiveSessionsLimit(user.id);

    this.logger.logAuth('login', user.id, true);
    const tokens = await this.generateTokens(user, context);

    return {
      user,
      ...tokens,
    };
  }

  @LogMethod()
  async register(registerDto: RegisterDto, context: LoginContext = {}) {
    if (!registerDto.role) {
      registerDto.role = UserRole.DOADOR;
    }

    this.logger.log(
      `Registrando novo usuário: ${registerDto.email} com perfil ${registerDto.role}`,
    );

    try {
      const newUser = await this.usersService.create(registerDto);
      const { password: _, ...userWithoutPassword } = newUser;

      this.logger.logAuth('register', newUser.id, true);

      const tokens = await this.generateTokens(newUser, context);
      return {
        user: userWithoutPassword,
        ...tokens,
      };
    } catch (error) {
      this.logger.error(
        `Falha no registro do usuário ${registerDto.email}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async refreshTokens(
    refreshToken: string,
    context: LoginContext = {},
  ): Promise<TokensResponseDto> {
    this.logger.debug('Tentando renovar token');

    try {
      const refreshTokenDoc = await this.findRefreshToken(refreshToken);

      // ✅ Validações de segurança aprimoradas
      if (!refreshTokenDoc || !refreshTokenDoc.isValid()) {
        this.logger.logAuth(
          'token_refresh',
          undefined,
          false,
          'Token inválido ou expirado',
        );
        throw new UnauthorizedException('Refresh token inválido ou expirado');
      }

      // ✅ Detectar reuso de token
      if (this.securityConfig.isRefreshTokenReuseDetectionEnabled()) {
        await this.handleTokenReuseDetection(refreshTokenDoc, context);
      }

      const user = await this.usersService.findOne(refreshTokenDoc.userId);
      this.logger.logAuth('token_refresh', user.id, true);

      // ✅ Token Rotation: Revogar token atual
      if (this.securityConfig.isRefreshTokenRotationEnabled()) {
        await this.revokeRefreshToken(refreshTokenDoc.id, 'rotation');
      }

      // ✅ Gerar novos tokens
      const tokens = await this.generateTokens(
        user,
        context,
        refreshTokenDoc.tokenFamily,
      );
      return tokens;
    } catch (error) {
      this.logger.error(
        `Erro na renovação de token: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ✅ NOVO: Detectar reuso de token
  private async handleTokenReuseDetection(
    refreshTokenDoc: RefreshToken,
    _context: LoginContext,
  ) {
    // Se o token já foi usado e não passou tempo suficiente, pode ser reuso
    if (refreshTokenDoc.lastUsedAt) {
      const timeSinceLastUse =
        Date.now() - refreshTokenDoc.lastUsedAt.getTime();
      if (timeSinceLastUse < 5000) {
        // 5 segundos
        this.logger.warn(
          `Possível reuso de token detectado para usuário ${refreshTokenDoc.userId}`,
        );

        // Marcar token como reusado e revogar toda a família
        refreshTokenDoc.markReuseDetected();
        await this.refreshTokenRepository.save(refreshTokenDoc);

        // Revogar todos os tokens da família
        await this.revokeTokenFamily(refreshTokenDoc.tokenFamily);

        throw new UnauthorizedException(
          'Token reuse detected. All sessions revoked.',
        );
      }
    }

    // Marcar como usado
    refreshTokenDoc.markAsUsed();
    await this.refreshTokenRepository.save(refreshTokenDoc);
  }

  // ✅ NOVO: Verificar limite de sessões ativas
  private async checkActiveSessionsLimit(userId: string) {
    const maxSessions = this.securityConfig.getMaxActiveSessionsPerUser();
    const activeSessions = await this.refreshTokenRepository.count({
      where: {
        userId,
        isRevoked: false,
        reuseDetected: false,
      },
    });

    if (activeSessions >= maxSessions) {
      // Revogar a sessão mais antiga
      const oldestSession = await this.refreshTokenRepository.findOne({
        where: {
          userId,
          isRevoked: false,
          reuseDetected: false,
        },
        order: { createdAt: 'ASC' },
      });

      if (oldestSession) {
        await this.revokeRefreshToken(oldestSession.id, 'session_limit');
      }
    }
  }

  @LogMethod()
  async revokeAllUserTokens(userId: string, reason = 'manual'): Promise<void> {
    this.logger.debug(`Revogando todos os tokens do usuário: ${userId}`);

    try {
      await this.refreshTokenRepository.update(
        { userId, isRevoked: false },
        {
          isRevoked: true,
          revokedReason: reason,
        },
      );
      this.logger.logAuth('revoke_all_tokens', userId, true);
    } catch (error) {
      this.logger.error(
        `Erro ao revogar tokens: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ✅ NOVO: Revogar família de tokens
  async revokeTokenFamily(
    tokenFamily: string,
    reason = 'security',
  ): Promise<void> {
    if (!tokenFamily) return;

    this.logger.debug(`Revogando família de tokens: ${tokenFamily}`);

    await this.refreshTokenRepository.update(
      { tokenFamily, isRevoked: false },
      {
        isRevoked: true,
        revokedReason: reason,
      },
    );
  }

  @LogMethod()
  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    this.logger.debug('Buscando refresh token');
    return this.refreshTokenRepository.findOne({ where: { token } });
  }

  @LogMethod()
  async revokeRefreshToken(id: string, reason = 'manual'): Promise<void> {
    this.logger.debug(`Revogando refresh token: ${id}`);
    await this.refreshTokenRepository.update(id, {
      isRevoked: true,
      revokedReason: reason,
    });
  }

  // ✅ NOVO: Obter sessões ativas
  async getActiveSessions(userId: string): Promise<ActiveSessionDto[]> {
    const sessions = await this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
        reuseDetected: false,
      },
      order: { lastUsedAt: 'DESC' },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceInfo: this.parseUserAgent(session.userAgent),
      ipAddress: session.ipAddress || 'Unknown',
      lastActivity: session.lastUsedAt || session.createdAt,
      current: false, // Seria determinado pelo token atual
    }));
  }

  private parseUserAgent(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';

    // Extrair informações básicas do user agent
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';

    return 'Desktop Browser';
  }

  getProfile(user: User): Partial<User> {
    this.logger.debug(`Obtendo perfil do usuário: ${user.id}`);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @LogMethod()
  private async generateTokens(
    user: Partial<User>,
    context: LoginContext = {},
    existingTokenFamily?: string,
  ): Promise<TokensResponseDto> {
    this.logger.debug(`Gerando tokens para o usuário: ${user.id}`);

    const tokenFamily = existingTokenFamily || uuidv4();
    const jti = uuidv4(); // JWT ID para blacklist

    // ✅ Payload do Access Token
    const accessPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      jti,
      tokenFamily,
      iat: Math.floor(Date.now() / 1000),
    };

    // ✅ Payload do Refresh Token
    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
      tokenFamily,
      version: 1,
      iat: Math.floor(Date.now() / 1000),
    };

    const secrets = this.jwtConfig.getSecrets();
    const accessConfig = this.jwtConfig.getAccessTokenConfig();

    // Gerar tokens
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: secrets.accessSecret,
      expiresIn: accessConfig.signOptions?.expiresIn || '15m',
      issuer: accessConfig.signOptions?.issuer,
      audience: accessConfig.signOptions?.audience,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: secrets.refreshSecret,
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      issuer: accessConfig.signOptions?.issuer,
      audience: accessConfig.signOptions?.audience,
    });

    // ✅ Salvar refresh token no banco
    if (!user.id) {
      throw new Error('User ID is required to generate tokens');
    }

    await this.saveRefreshToken(user.id, refreshToken, tokenFamily, context);

    // ✅ Calcular tempo de expiração
    const expiresIn = this.parseExpiration(
      String(accessConfig.signOptions?.expiresIn || '15m'),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
      tokenFamily,
    };
  }

  private parseExpiration(expiration: string): number {
    // Converter string como "15m", "1h", "7d" para segundos
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }

  @LogMethod()
  private async saveRefreshToken(
    userId: string,
    token: string,
    tokenFamily: string,
    context: LoginContext,
  ): Promise<RefreshToken> {
    // Hash do token para armazenamento seguro
    const hashedToken = await bcrypt.hash(token, 10);

    // Expiração do refresh token
    const expiresIn = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRATION_DAYS',
      7,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // Criar registro de refresh token
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId,
      token: hashedToken,
      tokenFamily,
      version: 1,
      expiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    const savedToken =
      await this.refreshTokenRepository.save(refreshTokenEntity);
    this.logger.debug(`Refresh token gerado para usuário: ${userId}`);

    return savedToken;
  }

  @LogMethod()
  async logout(userId: string, tokenId?: string): Promise<void> {
    this.logger.logAuth('logout', userId, true);

    if (tokenId) {
      // Logout específico de uma sessão
      await this.revokeRefreshToken(tokenId, 'logout');
    } else {
      // Logout de todas as sessões
      await this.revokeAllUserTokens(userId, 'logout');
    }
  }

  // ✅ NOVO: Limpeza automática de tokens expirados
  @LogMethod()
  async cleanupExpiredTokens(): Promise<void> {
    this.logger.debug('Limpando tokens expirados');

    const result = await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .from(RefreshToken)
      .where('expiresAt < :now', { now: new Date() })
      .orWhere('isRevoked = :revoked', { revoked: true })
      .execute();

    this.logger.log(`Tokens limpos: ${result.affected}`);
  }

  @LogMethod()
  async forgotPassword(email: string): Promise<void> {
    this.logger.log(`Solicitação de redefinição de senha para: ${email}`);

    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        this.logger.debug(`Solicitação para email não encontrado: ${email}`);
        return;
      }

      // ✅ Usar secret específico para reset
      const secrets = this.jwtConfig.getSecrets();
      const resetToken = this.jwtService.sign(
        {
          sub: user.id,
          type: 'password_reset',
          iat: Math.floor(Date.now() / 1000),
        },
        {
          secret: secrets.resetSecret,
          expiresIn: '1h',
        },
      );

      // Hash do token para armazenamento
      const hashedToken = await bcrypt.hash(resetToken, 10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = expiresAt;
      await this.usersService.update(user.id, user);

      this.logger.logAuth('password_reset_request', user.id, true);
      console.log(`Token de redefinição para ${email}: ${resetToken}`);
    } catch (error) {
      this.logger.error(
        `Erro na solicitação de redefinição de senha: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async resetPassword(token: string, newPassword: string): Promise<void> {
    this.logger.log('Tentativa de redefinição de senha');

    try {
      const user = await this.usersService.findByResetToken(token);
      if (
        !user ||
        !user.resetPasswordExpires ||
        user.resetPasswordExpires < new Date()
      ) {
        this.logger.logAuth(
          'password_reset',
          undefined,
          false,
          'Token inválido ou expirado',
        );
        throw new UnauthorizedException(
          'Token de redefinição inválido ou expirado',
        );
      }

      // Atualizar senha
      user.password = newPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await this.usersService.update(user.id, user);

      this.logger.logAuth('password_reset', user.id, true);

      // ✅ Revogar todos os tokens por segurança
      await this.revokeAllUserTokens(user.id, 'password_reset');
    } catch (error) {
      this.logger.error(
        `Erro na redefinição de senha: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
