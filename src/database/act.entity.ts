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
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { ActStatus } from '@/enums/act-status.enum';
import { UserEntity } from './user.entity';

@Entity('act')
export class ActEntity {
  @PrimaryGeneratedColumn('uuid')
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
  seqNo?: number;

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
  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  sum!: number;

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
