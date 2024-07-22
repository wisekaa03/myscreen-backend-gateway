import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToOne,
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
import { i18nValidationMessage } from 'nestjs-i18n';

import { InvoiceStatus } from '@/enums/invoice-status.enum';
import { FileEntity } from './file.entity';
import { UserEntity } from './user.entity';

@Entity('invoice', { comment: 'Счета' })
export class InvoiceEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_invoice_id' })
  @ApiProperty({
    description: 'Идентификатор счёта',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @Generated('increment')
  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Номер счета',
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.IS_NUMBER') })
  seqNo!: number;

  @Column()
  @ApiProperty({
    description: 'Описание заказа',
    example: 'описание заказа',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
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
  @IsEnum(InvoiceStatus, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status!: InvoiceStatus;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  @ApiProperty({
    description: 'Сумма счета',
    example: 1000,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsNumber({}, { message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.IS_MIN') })
  sum!: number;

  @OneToOne(() => FileEntity, (file) => file.id, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
    nullable: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_invoice_file' })
  @ApiProperty({
    description: 'Файл',
    nullable: true,
    allOf: [{ $ref: '#/components/schemas/FileResponse' }],
    required: true,
  })
  file!: FileEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_invoice_user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
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
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
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
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
  updatedAt?: Date;
}
