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

export enum PaymentService {
  Youkassa = 'youkassa',
  Invoice = 'invoice',
}

export enum Status {
  Pending = 'pending',
  Succeded = 'succeeded',
  Cancelled = 'cancelled',
  WaitingForCapture = 'waiting_for_capture',
}

export enum ReceiptStatus {
  Pending = 'pending',
  Succeeded = 'succeeded',
  Cancelled = 'cancelled',
}

export enum CancellationParty {
  YandexCheckout = 'yandex_checkout',
  YooMoney = 'yoo_money',
  PaymentNetwork = 'payment_network',
  Merchant = 'merchant',
}

export enum CancellationReason {
  ThreeDSecureFailed = '3d_secure_failed',
  CallIssuer = 'call_issuer',
  CancelledByMerchant = 'canceled_by_merchant',
  CardExpired = 'card_expired',
  CountryForbidden = 'country_forbidden',
  ExpiredOnCapture = 'expired_on_capture',
  ExpiredOnConfirmation = 'expired_on_confirmation',
  FraudSuspected = 'fraud_suspected',
  GeneralDecline = 'general_decline',
  IdentificationRequired = 'identification_required',
  InsufficientFunds = 'insufficient_funds',
  InternalTimeout = 'internal_timeout',
  InvalidCardNumber = 'invalid_card_number',
  InvalidCsc = 'invalid_csc',
  IssuerUnavailable = 'issuer_unavailable',
  PaymentMethodLimitExceeded = 'payment_method_limit_exceeded',
  PaymentMethodRestricted = 'payment_method_restricted',
  PermissionRevoked = 'permission_revoked',
  UnsupportedMobileOperator = 'unsupported_mobile_operator',
}

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

  @Column({ type: 'enum', enum: Status })
  status!: Status;

  @Column({ type: 'timestamp', nullable: true })
  capturedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date;

  @Column({ type: 'enum', enum: ReceiptStatus, nullable: true })
  receiptStatus!: ReceiptStatus;

  @Column({ type: 'enum', enum: CancellationParty, nullable: true })
  cancellationParty!: CancellationParty;

  @Column({ type: 'enum', enum: CancellationReason, nullable: true })
  cancellationReason!: CancellationReason;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
