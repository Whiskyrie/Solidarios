import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtConfigService } from '../../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtConfig = JwtConfigService.getInstance(configService);
    const secrets = jwtConfig.getSecrets();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secrets.accessSecret,

      // ✅ NOVO: Validações adicionais
      issuer: configService.get<string>('JWT_ISSUER', 'solidarios-api'),
      audience: configService.get<string>('JWT_AUDIENCE', 'solidarios-app'),

      // ✅ Passar request para acessar IP/User-Agent
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: any) {
    // ✅ Validações de segurança aprimoradas
    const now = Math.floor(Date.now() / 1000);

    // Verificar se o token não expirou
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    // Verificar se o token foi emitido no futuro
    if (payload.iat && payload.iat > now + 60) {
      // 60s de tolerância
      throw new Error('Token issued in the future');
    }

    // ✅ Buscar usuário e verificar se ainda está ativo
    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // ✅ Adicionar informações de segurança ao usuário
    return {
      ...user,
      tokenPayload: {
        jti: payload.jti, // JWT ID para blacklist
        iat: payload.iat,
        exp: payload.exp,
        tokenFamily: payload.tokenFamily,
      },
      requestInfo: {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    };
  }
}

// ✅ NOVO: Strategy para Refresh Token
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtConfig = JwtConfigService.getInstance(configService);
    const secrets = jwtConfig.getSecrets();

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: secrets.refreshSecret,
      issuer: configService.get<string>('JWT_ISSUER', 'solidarios-api'),
      audience: configService.get<string>('JWT_AUDIENCE', 'solidarios-app'),
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: any) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return {
      ...user,
      tokenPayload: payload,
      requestInfo: {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    };
  }
}
