import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsDefined,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  IsBoolean,
  IsInt,
  IsNumberString,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { ActStatus } from '@/enums/act-status.enum';
import { UserEntity } from './user.entity';

@Entity('act', {
  comment: 'Акты выполненных работ',
  orderBy: { createdAt: 'ASC' },
})
export class ActEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_act_id' })
  @ApiProperty({
    description: 'Идентификатор акта выполненных работ',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @Generated('increment')
  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Номер акта выполненных работ',
  })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  seqNo!: number;

  @Column()
  @ApiProperty({
    description: 'Описание акта выполненных работ',
    example: 'описание акта выполненных работ',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  description!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  @ApiProperty({
    description: 'Сумма акта выполненных работ',
    example: 1000,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsNumberString(
    {},
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(100, { message: i18nValidationMessage('validation.MIN') })
  sum!: number;

  @Column({ type: 'boolean', default: false })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isSubscription!: boolean;

  @Column({
    type: 'enum',
    enum: ActStatus,
    default: ActStatus.COMPLETE,
    comment: 'Подтверждение/отклонение акта выполненных работ',
  })
  @ApiProperty({
    type: 'enum',
    enum: ActStatus,
    enumName: 'ActStatus',
    description: 'Подтверждение/отклонение акта выполненных работ',
    example: ActStatus.COMPLETE,
  })
  @IsEnum(ActStatus, { message: i18nValidationMessage('validation.IS_ENUM') })
  status!: ActStatus;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_act_user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @RelationId((act: ActEntity) => act.user)
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
