import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Partial<User> | null> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (user && (await user.validatePassword(password))) {
        const { ...result } = user;
        return result;
      }
      return null;
    } catch {
      return null;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto) {
    const newUser = await this.usersService.create(registerDto);

    const { ...userWithoutPassword } = newUser;
    const tokens = await this.generateTokens(newUser);

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const refreshTokenDoc = await this.findRefreshToken(refreshToken);

    // Verificar se o token existe, não foi revogado e não expirou
    if (
      !refreshTokenDoc ||
      refreshTokenDoc.isRevoked ||
      refreshTokenDoc.isExpired()
    ) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = await this.usersService.findOne(refreshTokenDoc.userId);

    // Revogar o token atual
    await this.revokeRefreshToken(refreshTokenDoc.id);

    // Gerar novos tokens
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  async revokeAllUserTokens(userId: string) {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({ where: { token } });
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.refreshTokenRepository.update(id, { isRevoked: true });
  }

  getProfile(user: User): Partial<User> {
    const { ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private async generateTokens(user: Partial<User>) {
    const accessToken = this.generateAccessToken(user);

    if (!user.id) {
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

    return tokenValue;
  }

  async logout(userId: string): Promise<void> {
    // Revogar todos os tokens do usuário ao fazer logout
    await this.revokeAllUserTokens(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Não informar se o email não existe por questões de segurança
      return;
    }

    // Gerar token de redefinição de senha
    const resetToken = uuidv4();
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expira em 1 hora

    // Salvar token de redefinição (pode ser em uma nova entidade ou no usuário)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expiresAt;
    await this.usersService.update(user.id, user);

    // Enviar email com o token (implementação de envio de email não inclusa)
    // Exemplo: await this.emailService.sendResetPasswordEmail(email, resetToken);
    console.log(`Token de redefinição para ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new UnauthorizedException(
        'Token de redefinição inválido ou expirado',
      );
    }

    // Atualizar senha
    user.password = newPassword; // A entidade deve cuidar do hash
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.usersService.update(user.id, user);

    // Revogar todos os tokens do usuário por segurança
    await this.revokeAllUserTokens(user.id);
  }
}
