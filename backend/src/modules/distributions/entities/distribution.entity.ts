// backend/src/modules/distributions/entities/distribution.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Item } from '../../items/entities/item.entity';

@Entity('distributions')
// Indexes compostos para relatórios e buscas
@Index('IDX_BENEFICIARY_DATE', ['beneficiaryId', 'date']) // Para histórico do beneficiário
@Index('IDX_EMPLOYEE_DATE', ['employeeId', 'date']) // Para relatórios do funcionário
@Index('IDX_DATE_RANGE', ['date']) // Para filtros por período
@Index('IDX_BENEFICIARY_EMPLOYEE', ['beneficiaryId', 'employeeId']) // Para análises cruzadas
export class Distribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  @Index('IDX_DISTRIBUTION_DATE') // Para ordenação temporal
  date: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'beneficiaryId' })
  beneficiary: User;

  @Column()
  @Index('IDX_BENEFICIARY_ID') // Para buscar distribuições por beneficiário
  beneficiaryId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'employeeId' })
  employee: User;

  @Column()
  @Index('IDX_EMPLOYEE_ID') // Para relatórios por funcionário
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
