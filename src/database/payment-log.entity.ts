import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID } from 'class-validator';

import { UserEntity } from '@/database/user.entity';
import { OrderEntity } from '@/database/order.entity';
import { PaymentEntity } from '@/database/payment.entity';

@Entity('payment_log')
export class PaymentLogEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор',
    example: '1234567',
    format: 'uuid',
  })
  @IsUUID()
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

  @Column({ type: 'json', default: {}, nullable: true })
  log?: unknown;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDate()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDate()
  updatedAt!: Date;
}
