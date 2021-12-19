import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@/database/user.entity';
import { OrderEntity } from '@/database/order.entity';
import { PaymentEntity } from '@/database/payment.entity';

@Entity('payment_log')
export class PaymentLogsEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @ManyToOne(() => OrderEntity, (order) => order.id)
  @JoinColumn()
  order!: OrderEntity;

  @ManyToOne(() => PaymentEntity, (payment) => payment.id)
  @JoinColumn()
  payment!: PaymentEntity;

  @Column({ type: 'jsonb', nullable: true })
  log?: unknown;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
