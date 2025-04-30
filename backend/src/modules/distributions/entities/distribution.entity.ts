import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Item } from '../../items/entities/item.entity';

@Entity('distributions')
export class Distribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  date: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'beneficiaryId' })
  beneficiary: User;

  @Column()
  beneficiaryId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'employeeId' })
  employee: User;

  @Column()
  employeeId: string;

  @ManyToMany(() => Item, { eager: true })
  @JoinTable({
    name: 'distribution_items',
    joinColumn: { name: 'distributionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'itemId', referencedColumnName: 'id' },
  })
  items: Item[];

  @Column({ nullable: true })
  observations: string;
}
