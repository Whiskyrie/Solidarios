import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

    return {
      user,
      access_token: this.generateToken(user),
    };
  }

  async register(registerDto: RegisterDto) {
    const newUser = await this.usersService.create(registerDto);

    const { ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      access_token: this.generateToken(newUser),
    };
  }

  getProfile(user: User): Partial<User> {
    const { ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private generateToken(user: Partial<User>): string {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
