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
      // Buscar o refresh token no banco
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

      // ✅ CORREÇÃO: Usar refreshTokenDoc.userId diretamente para garantir consistência
      const userId = refreshTokenDoc.userId;

      if (!userId) {
        this.logger.error('UserId não encontrado no refresh token');
        throw new UnauthorizedException('Token de refresh inválido');
      }

      // ✅ CORREÇÃO: Buscar usuário e validar sua existência
      const user = await this.usersService.findOne(userId);

      if (!user) {
        this.logger.error(`Usuário não encontrado: ${userId}`);
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // ✅ CORREÇÃO: Garantir que o user.id está correto antes da geração
      if (!user.id || user.id !== userId) {
        this.logger.error(
          `Inconsistência no ID do usuário: esperado ${userId}, obtido ${user.id}`,
        );
        // Forçar o ID correto
        user.id = userId;
      }

      // ✅ LOG: Adicionar logs detalhados para debug
      this.logger.debug('Estado do refresh token:', undefined, {
        tokenExists: !!refreshTokenDoc,
        isRevoked: refreshTokenDoc.isRevoked,
        isExpired: refreshTokenDoc.isExpired(),
        userId: refreshTokenDoc.userId,
      });

      this.logger.debug('Estado do usuário encontrado:', undefined, {
        userExists: !!user,
        userId: user.id,
        userEmail: user.email,
        typeofUserId: typeof user.id,
      });

      this.logger.logAuth('token_refresh', userId, true);

      // Revogar o token atual
      await this.revokeRefreshToken(refreshTokenDoc.id);

      // ✅ CORREÇÃO: Gerar novos tokens com validação adicional
      const tokens = await this.generateTokens(user);

      // ✅ VALIDAÇÃO: Verificar se os tokens foram gerados corretamente
      if (!tokens.accessToken || !tokens.refreshToken) {
        this.logger.error('Falha na geração de novos tokens');
        throw new Error('Erro interno na geração de tokens');
      }

      this.logger.debug('Tokens gerados com sucesso:', undefined, {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        userId: userId,
      });

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
    if (!token) {
      this.logger.debug('Token vazio fornecido para busca');
      return null;
    }

    try {
      // ✅ MELHORIA: Incluir o relacionamento com User para validação
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token },
        relations: ['user'], // Carregar relacionamento para validação
      });

      if (!refreshToken) {
        this.logger.debug('Refresh token não encontrado no banco');
        return null;
      }

      // ✅ VALIDAÇÃO: Verificar se o usuário ainda existe e está ativo
      if (refreshToken.user) {
        if (!refreshToken.user.id) {
          this.logger.warn(
            `RefreshToken encontrado mas usuário inválido: ${refreshToken.userId}`,
          );
          return null;
        }

        // ✅ VALIDAÇÃO: Verificar consistência entre userId do token e user.id
        if (refreshToken.userId !== refreshToken.user.id) {
          this.logger.error(
            `Inconsistência entre refreshToken.userId (${refreshToken.userId}) e user.id (${refreshToken.user.id})`,
          );
          return null;
        }
      } else {
        // Se não carregou o user, verificar se o userId existe
        this.logger.warn(
          `RefreshToken encontrado mas relacionamento user não carregado. userId: ${refreshToken.userId}`,
        );

        // Verificar se o usuário ainda existe no banco
        const userExists = await this.usersService.findOne(refreshToken.userId);
        if (!userExists) {
          this.logger.warn(
            `Usuário referenciado pelo refresh token não existe mais: ${refreshToken.userId}`,
          );
          return null;
        }
      }

      this.logger.debug('Refresh token encontrado e validado', undefined, {
        tokenId: refreshToken.id,
        userId: refreshToken.userId,
        isRevoked: refreshToken.isRevoked,
        isExpired: refreshToken.isExpired(),
        userExists: !!refreshToken.user,
      });

      return refreshToken;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar refresh token: ${error.message}`,
        error.stack,
      );
      return null;
    }
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
    // ✅ VALIDAÇÃO: Garantir que dados essenciais estão presentes
    if (!user.id) {
      this.logger.error(
        'User ID não fornecido para geração de access token',
        undefined,
        'AuthService',
        {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            typeofId: typeof user.id,
          },
        },
      );
      throw new Error('User ID é obrigatório para geração do token');
    }

    if (!user.email) {
      this.logger.error(
        'User email não fornecido para geração de access token',
        undefined,
        'AuthService',
        {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
      );
      throw new Error('User email é obrigatório para geração do token');
    }

    // ✅ VALIDAÇÃO: Verificar se o ID é um UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      this.logger.error(
        'User ID não é um UUID válido',
        undefined,
        'AuthService',
        {
          userId: user.id,
          typeofId: typeof user.id,
        },
      );
      throw new Error('User ID deve ser um UUID válido');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    // ✅ LOG: Para debug em desenvolvimento
    this.logger.debug(
      `Gerando access token para usuário: ${user.id}`,
      undefined,
      {
        payload: {
          email: payload.email,
          sub: payload.sub,
          role: payload.role,
          typeofSub: typeof payload.sub,
        },
      },
    );

    try {
      const token = this.jwtService.sign(payload);

      // ✅ VALIDAÇÃO: Verificar se o token foi criado corretamente
      if (!token) {
        this.logger.error('JWT Service retornou token vazio');
        throw new Error('Falha na criação do token JWT');
      }

      return token;
    } catch (error) {
      this.logger.error(
        `Erro ao assinar JWT: ${error.message}`,
        error.stack,
        'AuthService',
        {
          payload,
        },
      );
      throw new Error('Falha na assinatura do token JWT');
    }
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
  @LogMethod()
  async debugRefreshToken(refreshToken: string) {
    // ✅ SEGURANÇA: Só executar em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    try {
      console.log('=== DEBUG REFRESH TOKEN ===');
      console.log('Token recebido:', refreshToken ? 'Presente' : 'Ausente');

      if (!refreshToken) {
        console.log('=== FIM DEBUG - TOKEN AUSENTE ===');
        return;
      }

      const refreshTokenDoc = await this.findRefreshToken(refreshToken);

      console.log('RefreshToken doc:', {
        exists: !!refreshTokenDoc,
        id: refreshTokenDoc?.id,
        userId: refreshTokenDoc?.userId,
        isRevoked: refreshTokenDoc?.isRevoked,
        isExpired: refreshTokenDoc?.isExpired(),
        expiresAt: refreshTokenDoc?.expiresAt,
        typeofUserId: typeof refreshTokenDoc?.userId,
      });

      if (refreshTokenDoc) {
        try {
          const user = await this.usersService.findOne(refreshTokenDoc.userId);
          console.log('User encontrado:', {
            exists: !!user,
            id: user?.id,
            email: user?.email,
            role: user?.role,
            typeofId: typeof user?.id,
            idMatch: user?.id === refreshTokenDoc.userId,
          });

          // Verificar se o user.id é um UUID válido
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (user?.id) {
            console.log('UUID validation:', {
              isValidUUID: uuidRegex.test(user.id),
              idLength: user.id.length,
              idValue: user.id,
            });
          }

          // Testar geração de token
          if (user) {
            try {
              const testPayload = {
                email: user.email,
                sub: user.id,
                role: user.role,
              };
              console.log('Payload de teste:', testPayload);

              const testToken = this.jwtService.sign(testPayload);
              console.log('Token de teste gerado:', !!testToken);

              // Decodificar o token para verificar
              const decoded = this.jwtService.decode(testToken);
              console.log('Token decodificado:', decoded);
            } catch (tokenError) {
              console.log(
                'Erro na geração de token de teste:',
                tokenError.message,
              );
            }
          }
        } catch (userError) {
          console.log('Erro ao buscar usuário:', userError.message);
        }
      }

      console.log('=== FIM DEBUG ===');
    } catch (error) {
      console.error('Erro no debug:', error);
    }
  }
}
