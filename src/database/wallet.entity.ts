import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
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
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { UserEntity } from './user.entity';
import { InvoiceEntity } from './invoice.entity';
import { ActEntity } from './act.entity';
import { WalletTransactionType } from '@/enums';

@Entity('wallet', { comment: 'Деньги в бумажнике' })
export class WalletEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_wallet_id' })
  @ApiProperty({
    description: 'Идентификатор баланса',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
    default: WalletTransactionType.DEBIT,
    comment: 'Тип транзакции',
  })
  @ApiProperty({
    type: 'enum',
    enum: WalletTransactionType,
    enumName: 'WalletTransactionType',
    description: 'Тип транзакции',
    example: WalletTransactionType.DEBIT,
  })
  @IsEnum(WalletTransactionType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  type!: WalletTransactionType;

  @Column({ type: 'varchar', default: '' })
  @ApiProperty({
    type: 'string',
    description: 'Описание транзакции',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  description!: string;

  @Column({ type: 'numeric', default: 0 })
  @ApiProperty({
    description: 'Баланс',
    example: 0,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  sum!: number;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
    nullable: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_wallet_invoice_id' })
  invoice!: InvoiceEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @RelationId((wallet: WalletEntity) => wallet.invoice)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  invoiceId!: string | null;

  @ManyToOne(() => ActEntity, (invoice) => invoice.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
    nullable: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_wallet_act_id' })
  act!: ActEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @RelationId((wallet: WalletEntity) => wallet.act)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  actId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_wallet_user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @RelationId((wallet: WalletEntity) => wallet.user)
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
