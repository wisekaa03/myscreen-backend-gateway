import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
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

@Entity('payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

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

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @ManyToMany(() => OrderEntity, (order) => order.id, { cascade: true })
  @JoinColumn()
  orders!: OrderEntity[];

  @Column({ type: 'enum', enum: PaymentService })
  paymentService!: PaymentService;

  @Column()
  amount!: string;

  @Column({ nullable: true })
  incomeAmount?: string;

  @Column()
  description!: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  status!: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  capturedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'enum', enum: PaymentReceiptStatus, nullable: true })
  receiptStatus?: PaymentReceiptStatus;

  @Column({ type: 'enum', enum: PaymentCancellationParty, nullable: true })
  cancellationParty?: PaymentCancellationParty;

  @Column({ type: 'enum', enum: PaymentCancellationReason, nullable: true })
  cancellationReason?: PaymentCancellationReason;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
