// backend/src/modules/users/entities/user.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  ADMIN = 'ADMIN',
  FUNCIONARIO = 'FUNCIONARIO',
  DOADOR = 'DOADOR',
  BENEFICIARIO = 'BENEFICIARIO',
}

@Entity('users')
// Indexes compostos para consultas de usuários
@Index('IDX_ROLE_ACTIVE', ['role', 'isActive']) // Para buscar usuários ativos por perfil
@Index('IDX_EMAIL_ACTIVE', ['email', 'isActive']) // Para login e verificações
@Index('IDX_CREATED_ROLE', ['createdAt', 'role']) // Para relatórios de cadastro
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  @Index('IDX_USER_EMAIL', { unique: true }) // Email único com index
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.DOADOR,
  })
  @Index('IDX_USER_ROLE') // Para filtros por perfil
  role: UserRole;

  @Column({ default: true })
  @Index('IDX_USER_ACTIVE') // Para filtrar usuários ativos
  isActive: boolean;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @CreateDateColumn()
  @Index('IDX_USER_CREATED') // Para relatórios temporais
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resetPasswordToken: string | null;

  @Column({ nullable: true })
  resetPasswordExpires: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}
