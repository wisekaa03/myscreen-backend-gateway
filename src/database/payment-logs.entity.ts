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

@Entity('payment_logs')
export class PaymentLogsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  users!: UserEntity; // why users, user must be ?

  @ManyToOne(() => OrderEntity, (order) => order.id)
  @JoinColumn({ name: 'orderId' })
  orders!: OrderEntity; // why orders, order must be ?

  @ManyToOne(() => PaymentEntity, (payment) => payment.id)
  @JoinColumn({ name: 'paymentId' })
  payments!: PaymentEntity; // why payments, payment must be ?

  @Column({ type: 'jsonb', nullable: true })
  log!: unknown;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
