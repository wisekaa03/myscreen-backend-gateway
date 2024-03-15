import {
  BaseEntity,
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
  IsEnum,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  IsBoolean,
} from 'class-validator';

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
  @IsUUID()
  id!: string;

  @Generated('increment')
  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Номер акта выполненных работ',
  })
  @IsNumber()
  seqNo!: number;

  @Column()
  @ApiProperty({
    description: 'Описание акта выполненных работ',
    example: 'описание акта выполненных работ',
  })
  @IsString()
  description!: string;

  @Column()
  @ApiProperty({
    description: 'Сумма акта выполненных работ',
    example: 1000,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  sum!: number;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
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
  @IsEnum(ActStatus)
  status!: ActStatus;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column({ type: 'uuid' })
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
