import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { InvoiceStatus } from '@/enums/invoice-status.enum';
import { UserEntity } from './user.entity';

@Entity('invoice')
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор счёта',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @Generated('increment')
  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Номер счета',
  })
  @IsNumber()
  seqNo!: number;

  @Column()
  @ApiProperty({
    description: 'Описание заказа',
    example: 'описание заказа',
  })
  @IsString()
  description!: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.AWAITING_CONFIRMATION,
    comment: 'Подтверждение/отклонение счёта',
  })
  @ApiProperty({
    type: 'enum',
    enum: InvoiceStatus,
    enumName: 'InvoiceStatus',
    description: 'Подтверждение/отклонение счёта',
    example: InvoiceStatus.AWAITING_CONFIRMATION,
  })
  @IsEnum(InvoiceStatus)
  status!: InvoiceStatus;

  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Сумма счета',
    example: 1000,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  sum!: number;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column()
  @IsUUID()
  userId!: string;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T00:00:00.000Z',
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T00:00:00.000Z',
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false })
  updatedAt?: Date;
}
