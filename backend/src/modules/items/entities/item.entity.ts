import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
// import { Category } from './category.entity'; // Será criada depois

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
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ItemType,
  })
  type: ItemType;

  @Column()
  description: string;

  @Column({ nullable: true })
  conservationState: string; // Estado de conservação

  @Column({ nullable: true })
  size: string; // Tamanho (quando aplicável)

  @CreateDateColumn()
  receivedDate: Date; // Data de recebimento

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.DISPONIVEL,
  })
  status: ItemStatus;

  @Column('text', { array: true, nullable: true })
  photos: string[]; // URLs das fotos

  @ManyToOne(() => User, { eager: true }) // Eager loading para buscar o doador junto
  @JoinColumn({ name: 'donorId' })
  donor: User;

  @Column()
  donorId: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;
}
