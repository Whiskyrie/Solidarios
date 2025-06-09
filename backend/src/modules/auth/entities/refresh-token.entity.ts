// backend/src/modules/auth/entities/refresh-token.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
@Index(['userId', 'isRevoked']) // Otimização para queries por usuário
@Index(['tokenFamily']) // Para token rotation
@Index(['expiresAt']) // Para limpeza automática
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true, length: 255 })
  @Index()
  token: string;

  // ✅ NOVO: Token Family para rotation
  @Column({ type: 'uuid', nullable: true })
  @Index()
  tokenFamily: string;

  // ✅ NOVO: Versão do token para controle de rotação
  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ default: false })
  isRevoked: boolean;

  // ✅ NOVO: Motivo da revogação
  @Column({ type: 'varchar', length: 100, nullable: true })
  revokedReason: string;

  // ✅ NOVO: Detectar reuso de token
  @Column({ default: false })
  reuseDetected: boolean;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  // ✅ NOVO: Metadados de segurança
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  // ✅ NOVO: Última vez que foi usado
  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos de conveniência
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired() && !this.reuseDetected;
  }

  markAsUsed(): void {
    this.lastUsedAt = new Date();
  }

  revoke(reason: string = 'manual'): void {
    this.isRevoked = true;
    this.revokedReason = reason;
  }

  markReuseDetected(): void {
    this.reuseDetected = true;
    this.revokedReason = 'reuse_detected';
  }
}
