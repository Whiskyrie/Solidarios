import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Item } from '../../items/entities/item.entity'; // Importa a entidade Item

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  // Relacionamento: Uma categoria pode ter muitos itens
  @OneToMany(() => Item, (item) => item.category)
  items: Item[];
}
