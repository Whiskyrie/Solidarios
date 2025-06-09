import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    // Payload contém as informações que foram incluídas no token JWT
    // Normalmente: { email: user.email, sub: user.id, role: user.role }

    // Opcionalmente, podemos buscar o usuário no banco de dados para ter informações atualizadas
    const user = await this.usersService.findOne(payload.sub);

    // Retorna o usuário que será injetado no objeto Request
    return {
      ...user,
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
