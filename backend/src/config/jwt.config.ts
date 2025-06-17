import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import * as crypto from 'crypto';

export interface JwtSecrets {
  accessSecret: string;
  refreshSecret: string;
  resetSecret: string;
}

export class JwtConfigService {
  private static instance: JwtConfigService;
  private secrets: JwtSecrets;
  private configService: ConfigService;

  private constructor(configService: ConfigService) {
    this.configService = configService;
    this.validateAndSetSecrets();
  }

  static getInstance(configService: ConfigService): JwtConfigService {
    if (!JwtConfigService.instance) {
      JwtConfigService.instance = new JwtConfigService(configService);
    }
    return JwtConfigService.instance;
  }

  private validateAndSetSecrets(): void {
    // Validar se os secrets são seguros
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const resetSecret = this.configService.get<string>('JWT_RESET_SECRET');

    // Validações de segurança
    this.validateSecret(accessSecret, 'JWT_ACCESS_SECRET');
    this.validateSecret(refreshSecret, 'JWT_REFRESH_SECRET');
    this.validateSecret(resetSecret, 'JWT_RESET_SECRET');

    // Garantir que os secrets são diferentes
    if (
      accessSecret === refreshSecret ||
      accessSecret === resetSecret ||
      refreshSecret === resetSecret
    ) {
      throw new Error('JWT secrets must be different from each other');
    }

    this.secrets = {
      accessSecret: accessSecret!,
      refreshSecret: refreshSecret!,
      resetSecret: resetSecret!,
    };
  }

  private validateSecret(secret: string | undefined, name: string): void {
    if (!secret) {
      throw new Error(`${name} environment variable is required`);
    }

    if (secret.length < 32) {
      throw new Error(`${name} must be at least 32 characters long`);
    }

    if (
      secret === 'your-super-secret-jwt-key-here' ||
      secret.includes('example') ||
      secret.includes('test')
    ) {
      throw new Error(`${name} must not use default or example values`);
    }

    // Verificar entropia mínima
    const entropy = this.calculateEntropy(secret);
    if (entropy < 4.0) {
      throw new Error(
        `${name} has insufficient entropy. Use a more random secret`,
      );
    }
  }

  private calculateEntropy(str: string): number {
    const freq = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;
    for (const count of Object.values(freq)) {
      const p = (count as number) / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  getSecrets(): JwtSecrets {
    return { ...this.secrets };
  }

  getAccessTokenConfig(): JwtModuleOptions {
    return {
      secret: this.secrets.accessSecret,
      signOptions: {
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRATION',
          '15m',
        ),
        issuer: this.configService.get<string>('JWT_ISSUER', 'solidarios-api'),
        audience: this.configService.get<string>(
          'JWT_AUDIENCE',
          'solidarios-app',
        ),
      },
    };
  }

  getRefreshTokenConfig(): JwtModuleOptions {
    return {
      secret: this.secrets.refreshSecret,
      signOptions: {
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION',
          '7d',
        ),
        issuer: this.configService.get<string>('JWT_ISSUER', 'solidarios-api'),
        audience: this.configService.get<string>(
          'JWT_AUDIENCE',
          'solidarios-app',
        ),
      },
    };
  }

  generateSecureSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // Rotacionar secrets periodicamente (para uso em deploy/CI)
  static generateNewSecrets(): JwtSecrets {
    return {
      accessSecret: crypto.randomBytes(64).toString('hex'),
      refreshSecret: crypto.randomBytes(64).toString('hex'),
      resetSecret: crypto.randomBytes(64).toString('hex'),
    };
  }
}
