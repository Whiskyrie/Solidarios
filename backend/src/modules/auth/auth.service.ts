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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AuthService');
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
        const { ...result } = user;
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
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      this.logger.logAuth(
        'login',
        undefined,
        false,
        `Email: ${loginDto.email}`,
      );
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.logAuth('login', user.id, true);
    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  @LogMethod()
  async register(registerDto: RegisterDto) {
    // Define um valor padrão para role caso não seja fornecido
    if (!registerDto.role) {
      registerDto.role = UserRole.DOADOR;
    }

    this.logger.log(
      `Registrando novo usuário: ${registerDto.email} com perfil ${registerDto.role}`,
    );

    try {
      const newUser = await this.usersService.create(registerDto);
      const { ...userWithoutPassword } = newUser;

      this.logger.logAuth('register', newUser.id, true);

      const tokens = await this.generateTokens(newUser);
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
  async refreshTokens(refreshToken: string) {
    this.logger.debug(`Tentando renovar token`);

    try {
      const refreshTokenDoc = await this.findRefreshToken(refreshToken);

      // Verificar se o token existe, não foi revogado e não expirou
      if (
        !refreshTokenDoc ||
        refreshTokenDoc.isRevoked ||
        refreshTokenDoc.isExpired()
      ) {
        this.logger.logAuth(
          'token_refresh',
          undefined,
          false,
          'Token inválido ou expirado',
        );
        throw new UnauthorizedException('Refresh token inválido ou expirado');
      }

      const user = await this.usersService.findOne(refreshTokenDoc.userId);
      this.logger.logAuth('token_refresh', user.id, true);

      // Revogar o token atual
      await this.revokeRefreshToken(refreshTokenDoc.id);

      // Gerar novos tokens
      const tokens = await this.generateTokens(user);
      return tokens;
    } catch (error) {
      this.logger.error(
        `Erro na renovação de token: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @LogMethod()
  async revokeAllUserTokens(userId: string) {
    this.logger.debug(`Revogando todos os tokens do usuário: ${userId}`);

    try {
      await this.refreshTokenRepository.update(
        { userId, isRevoked: false },
        { isRevoked: true },
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

  @LogMethod()
  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    this.logger.debug('Buscando refresh token');
    return this.refreshTokenRepository.findOne({ where: { token } });
  }

  @LogMethod()
  async revokeRefreshToken(id: string): Promise<void> {
    this.logger.debug(`Revogando refresh token: ${id}`);
    await this.refreshTokenRepository.update(id, { isRevoked: true });
  }

  getProfile(user: User): Partial<User> {
    this.logger.debug(`Obtendo perfil do usuário: ${user.id}`);
    const { ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @LogMethod()
  private async generateTokens(user: Partial<User>) {
    this.logger.debug(`Gerando tokens para o usuário: ${user.id}`);

    const accessToken = this.generateAccessToken(user);

    if (!user.id) {
      this.logger.error('ID de usuário não fornecido para geração de tokens');
      throw new Error('User ID is required to generate tokens');
    }

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateAccessToken(user: Partial<User>): string {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  @LogMethod()
  private async generateRefreshToken(userId: string): Promise<string> {
    // Gerar um token aleatório
    const tokenValue = uuidv4();

    // Hash do token para armazenamento seguro
    const hashedToken = await bcrypt.hash(tokenValue, 10);

    // Expiração do refresh token (por exemplo, 7 dias)
    const expiresIn = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRATION_DAYS',
      7,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // Criar e salvar o registro de refresh token
    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token: hashedToken,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
    this.logger.debug(`Refresh token gerado para usuário: ${userId}`);

    return tokenValue;
  }

  @LogMethod()
  async logout(userId: string): Promise<void> {
    this.logger.logAuth('logout', userId, true);
    // Revogar todos os tokens do usuário ao fazer logout
    await this.revokeAllUserTokens(userId);
  }

  @LogMethod()
  async forgotPassword(email: string): Promise<void> {
    this.logger.log(`Solicitação de redefinição de senha para: ${email}`);

    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        // Não informar se o email não existe por questões de segurança
        this.logger.debug(`Solicitação para email não encontrado: ${email}`);
        return;
      }

      // Gerar token de redefinição de senha
      const resetToken = uuidv4();
      const hashedToken = await bcrypt.hash(resetToken, 10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expira em 1 hora

      // Salvar token de redefinição
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
    this.logger.log(`Tentativa de redefinição de senha`);

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

      // Revogar todos os tokens do usuário por segurança
      await this.revokeAllUserTokens(user.id);
    } catch (error) {
      this.logger.error(
        `Erro na redefinição de senha: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
