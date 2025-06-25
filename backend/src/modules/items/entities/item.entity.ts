import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  ValueTransformer,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Distribution } from '../../distributions/entities/distribution.entity';

// Transformer para formatar datas apenas como YYYY-MM-DD
const dateOnlyTransformer: ValueTransformer = {
  to: (value: Date | string) => {
    if (!value) return null;
    const date = typeof value === 'string' ? new Date(value) : value;
    return date instanceof Date && !isNaN(date.getTime()) ? date : null;
  },
  from: (value: Date | string) => {
    if (!value) return null;
    const date = typeof value === 'string' ? new Date(value) : value;
    if (date instanceof Date && !isNaN(date.getTime())) {
      // Retorna apenas a data no formato YYYY-MM-DD
      return date.toISOString().split('T')[0];
    }
    return null;
  },
};
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

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    transformer: dateOnlyTransformer,
  })
  receivedDate: string; // Data de recebimento - alterado para string

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

  @ManyToMany(() => Distribution, (distribution) => distribution.items)
  distributions: Distribution[];
}
