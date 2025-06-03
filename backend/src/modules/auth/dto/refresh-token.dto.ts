import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token para renovar o access token',
  })
  @IsNotEmpty({ message: 'O refresh token é obrigatório' })
  @IsString({ message: 'O refresh token deve ser uma string' })
  refreshToken: string;

  @ApiPropertyOptional({
    description: 'Fingerprint do dispositivo para segurança adicional',
  })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class TokensResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de acesso (access token)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de atualização (refresh token)',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tempo de expiração do access token em segundos',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Tipo do token',
    example: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiPropertyOptional({
    description: 'ID da família do token (para rotation)',
  })
  tokenFamily?: string;
}

// ✅ NOVO: DTO para revogar tokens
export class RevokeTokenDto {
  @ApiProperty({
    description: 'Token a ser revogado',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiPropertyOptional({
    description: 'Revogar todos os tokens do usuário',
    default: false,
  })
  revokeAll?: boolean = false;
}

// ✅ NOVO: DTO para sessões ativas
export class ActiveSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceInfo: string;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  lastActivity: Date;

  @ApiProperty()
  current: boolean;
}
