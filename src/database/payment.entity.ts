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
import {
  PaymentService,
  PaymentStatus,
  PaymentReceiptStatus,
  PaymentCancellationParty,
  PaymentCancellationReason,
} from './enums/payments.enum';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  externalPayment!: string;

  @Column({ type: 'boolean' })
  paid!: boolean;

  @Column({ type: 'boolean', default: false })
  refunded!: boolean;

  @Column()
  refundId!: string;

  @Column({ type: 'boolean', nullable: true })
  test!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  users!: UserEntity; // why users, user must be ?

  @ManyToOne(() => OrderEntity, (order) => order.id)
  @JoinColumn({ name: 'orderId' })
  orders!: OrderEntity; // why orders, order must be ?

  @Column({ type: 'enum', enum: PaymentService, nullable: false })
  paymentService!: PaymentService;

  @Column({ nullable: false })
  amount!: string;

  @Column({ nullable: true })
  incomeAmount!: string;

  @Column()
  description!: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  status!: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  capturedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date;

  @Column({ type: 'enum', enum: PaymentReceiptStatus, nullable: true })
  receiptStatus!: PaymentReceiptStatus;

  @Column({ type: 'enum', enum: PaymentCancellationParty, nullable: true })
  cancellationParty!: PaymentCancellationParty;

  @Column({ type: 'enum', enum: PaymentCancellationReason, nullable: true })
  cancellationReason!: PaymentCancellationReason;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
