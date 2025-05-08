import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class LoginDto {
  @ApiProperty({
    example: 'usuario@exemplo.com',
    description: 'Email do usuário',
  })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  name: string;

  @ApiProperty({
    example: 'usuario@exemplo.com',
    description: 'Email do usuário',
  })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiProperty({
    example: 'DOADOR',
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    default: UserRole.DOADOR,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Papel inválido' })
  role?: UserRole;
}
