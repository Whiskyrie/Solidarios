import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { User } from '../../users/entities/user.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Item, { eager: true })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column()
  itemId: string;

  // ADIÇÃO: Relacionamento direto com doador
  @ManyToOne(() => User)
  @JoinColumn({ name: 'donorId' })
  donor?: User;

  @Column({ nullable: true })
  donorId?: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  alertLevel: number; // Nível mínimo para alerta de estoque baixo

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
