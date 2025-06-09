import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Matches,
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

  @ApiProperty({
    example: '(11) 99999-9999',
    description: 'Telefone do usuário',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string' })
  @Matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, {
    message:
      'Formato de telefone inválido. Use: (99) 99999-9999 ou (99) 9999-9999',
  })
  phone?: string;

  @ApiProperty({
    example: 'Rua das Flores, 123, Centro, São Paulo - SP',
    description: 'Endereço completo do usuário',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O endereço deve ser uma string' })
  @MinLength(5, { message: 'O endereço deve ter pelo menos 5 caracteres' })
  address?: string;
}
