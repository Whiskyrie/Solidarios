// backend/src/modules/categories/entities/category.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';

@Entity('categories')
// Indexes para performance de categorias
@Index('IDX_CATEGORY_NAME', ['name'], { unique: true }) // Nome único com performance
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index('IDX_CATEGORY_NAME_SEARCH') // Para buscas textuais
  name: string;

  @Column({ nullable: true })
  description: string;

  // Relacionamento: Uma categoria pode ter muitos itens
  @OneToMany(() => Item, (item) => item.category)
  items: Item[];
}
