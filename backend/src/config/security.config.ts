import { ConfigService } from '@nestjs/config';

export interface SecurityConfig {
  maxActiveSessionsPerUser: number;
  refreshTokenRotationEnabled: boolean;
  refreshTokenReuseDetection: boolean;
  sessionTimeout: number;
  bruteForceProtection: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  tokenBlacklistEnabled: boolean;
  csrfProtectionEnabled: boolean;
  secureHeaders: boolean;
}

export class SecurityConfigService {
  private config: SecurityConfig;

  constructor(private configService: ConfigService) {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.config = {
      maxActiveSessionsPerUser: this.configService.get<number>(
        'MAX_ACTIVE_SESSIONS',
        5,
      ),
      refreshTokenRotationEnabled: this.configService.get<boolean>(
        'REFRESH_TOKEN_ROTATION',
        true,
      ),
      refreshTokenReuseDetection: this.configService.get<boolean>(
        'REFRESH_TOKEN_REUSE_DETECTION',
        true,
      ),
      sessionTimeout: this.configService.get<number>(
        'SESSION_TIMEOUT',
        24 * 60 * 60 * 1000,
      ), // 24h
      bruteForceProtection: this.configService.get<boolean>(
        'BRUTE_FORCE_PROTECTION',
        true,
      ),
      maxLoginAttempts: this.configService.get<number>('MAX_LOGIN_ATTEMPTS', 5),
      lockoutDuration: this.configService.get<number>(
        'LOCKOUT_DURATION',
        15 * 60 * 1000,
      ), // 15min
      tokenBlacklistEnabled: this.configService.get<boolean>(
        'TOKEN_BLACKLIST_ENABLED',
        true,
      ),
      csrfProtectionEnabled: this.configService.get<boolean>(
        'CSRF_PROTECTION',
        false,
      ),
      secureHeaders: this.configService.get<boolean>('SECURE_HEADERS', true),
    };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  isRefreshTokenRotationEnabled(): boolean {
    return this.config.refreshTokenRotationEnabled;
  }

  isRefreshTokenReuseDetectionEnabled(): boolean {
    return this.config.refreshTokenReuseDetection;
  }

  getMaxActiveSessionsPerUser(): number {
    return this.config.maxActiveSessionsPerUser;
  }

  isBruteForceProtectionEnabled(): boolean {
    return this.config.bruteForceProtection;
  }

  getMaxLoginAttempts(): number {
    return this.config.maxLoginAttempts;
  }

  getLockoutDuration(): number {
    return this.config.lockoutDuration;
  }
}
