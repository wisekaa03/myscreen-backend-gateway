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
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID } from 'class-validator';

import {
  PaymentEnumService,
  PaymentEnumStatus,
  PaymentEnumReceiptStatus,
  PaymentEnumCancellationParty,
  PaymentEnumCancellationReason,
} from '@/enums';
import { UserEntity } from '@/database/user.entity';
import { OrderEntity } from '@/database/order.entity';

@Entity('payment')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    example: '1234567',
    format: 'uuid',
  })
  @IsUUID()
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

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column({ select: false })
  @IsUUID()
  userId!: string;

  @ManyToMany(() => OrderEntity, (order) => order.id, { cascade: true })
  @JoinColumn()
  orders!: OrderEntity[];

  @Column({ type: 'enum', enum: PaymentEnumService })
  paymentService!: PaymentEnumService;

  @Column()
  @ApiProperty({
    description: 'Описание платежа',
    example: '1000 RUB',
  })
  @IsString()
  amount?: string;

  @Column()
  @ApiProperty({
    description: 'Описание платежа',
    example: '1000 RUB',
  })
  @IsString()
  incomeAmount?: string;

  @Column()
  @ApiProperty({
    description: 'Описание платежа',
    example: 'описание платежа',
  })
  @IsString()
  description!: string;

  @Column({ type: 'enum', enum: PaymentEnumStatus })
  status!: PaymentEnumStatus;

  @Column({ type: 'timestamp', nullable: true })
  capturedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'enum', enum: PaymentEnumReceiptStatus, nullable: true })
  receiptStatus?: PaymentEnumReceiptStatus;

  @Column({ type: 'enum', enum: PaymentEnumCancellationParty, nullable: true })
  cancellationParty?: PaymentEnumCancellationParty;

  @Column({ type: 'enum', enum: PaymentEnumCancellationReason, nullable: true })
  cancellationReason?: PaymentEnumCancellationReason;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  updatedAt!: Date;
}
