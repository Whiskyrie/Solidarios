// backend/src/modules/inventory/entities/inventory.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';

@Entity('inventory')
// Indexes compostos para operações de inventário
@Index('IDX_ITEM_QUANTITY', ['itemId', 'quantity']) // Para verificação de estoque
@Index('IDX_LOCATION_QUANTITY', ['location', 'quantity']) // Para buscar por localização
@Index('IDX_ALERT_LEVEL', ['quantity', 'alertLevel']) // Para alertas de estoque baixo
@Index('IDX_UPDATED_DATE', ['updatedAt']) // Para auditoria de mudanças
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Item, { eager: true })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  @Index('IDX_INVENTORY_ITEM_ID', { unique: true }) // Garantir unicidade e performance
  itemId: string;

  @Column({ default: 1 })
  @Index('IDX_QUANTITY') // Para filtros de quantidade
  quantity: number;

  @Column({ nullable: true })
  @Index('IDX_LOCATION') // Para buscar por localização
  location: string;

  @Column({ nullable: true })
  @Index('IDX_ALERT_LEVEL_VALUE') // Para monitoramento de alertas
  alertLevel: number;

  @CreateDateColumn()
  @Index('IDX_INVENTORY_CREATED') // Para auditoria
  createdAt: Date;

  @UpdateDateColumn()
  @Index('IDX_INVENTORY_UPDATED') // Para tracking de mudanças
  updatedAt: Date;
}
