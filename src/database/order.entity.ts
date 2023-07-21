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
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { UserEntity } from '@/database/user.entity';
import { InvoiceApproved } from '@/enums/invoice-approved.enum';

@Entity('order')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @Generated('increment')
  @Column({ type: 'integer' })
  @IsNumber()
  seqNo?: number;

  @Column()
  @ApiProperty({
    description: 'Описание заказа',
    example: 'описание заказа',
  })
  @IsString()
  description!: string;

  @Column({
    type: 'enum',
    enum: InvoiceApproved,
    default: InvoiceApproved.PENDING,
    comment: 'Подтверждение/отклонение заказа',
  })
  @ApiProperty({
    description: 'Подтверждение/отклонение заказа',
    example: true,
  })
  @IsEnum(InvoiceApproved)
  approved!: InvoiceApproved;

  @Column()
  @ApiProperty({
    description: 'Сумма счета',
    example: 1000,
  })
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
