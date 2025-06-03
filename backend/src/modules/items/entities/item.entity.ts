// backend/src/modules/items/entities/item.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from 'src/modules/categories/entities/category.entity';

export enum ItemType {
  ROUPA = 'roupa',
  CALCADO = 'calcado',
  UTENSILIO = 'utensilio',
  OUTRO = 'outro',
}

export enum ItemStatus {
  DISPONIVEL = 'disponivel',
  RESERVADO = 'reservado',
  DISTRIBUIDO = 'distribuido',
}

@Entity('items')
// Indexes compostos para queries mais comuns
@Index('IDX_DONOR_STATUS', ['donorId', 'status']) // Para buscar doações por doador e status
@Index('IDX_CATEGORY_STATUS', ['categoryId', 'status']) // Para filtrar por categoria disponível
@Index('IDX_STATUS_DATE', ['status', 'receivedDate']) // Para relatórios por período
@Index('IDX_TYPE_STATUS', ['type', 'status']) // Para buscar tipos específicos disponíveis
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ItemType,
  })
  @Index('IDX_ITEM_TYPE') // Index simples para filtros por tipo
  type: ItemType;

  @Column()
  description: string;

  @Column({ nullable: true })
  conservationState: string;

  @Column({ nullable: true })
  size: string;

  @CreateDateColumn()
  @Index('IDX_RECEIVED_DATE') // Para ordenação e filtros temporais
  receivedDate: Date;

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.DISPONIVEL,
  })
  @Index('IDX_ITEM_STATUS') // Index para filtros de status
  status: ItemStatus;

  @Column('text', { array: true, nullable: true })
  photos: string[];

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'donorId' })
  donor: User;

  @Column()
  @Index('IDX_DONOR_ID') // Para buscar doações por doador
  donorId: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  @Index('IDX_CATEGORY_ID') // Para filtros por categoria
  categoryId: string;
}
