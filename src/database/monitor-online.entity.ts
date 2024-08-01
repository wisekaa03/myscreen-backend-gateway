import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { MonitorStatus } from '@/enums';
import { UserEntity } from './user.entity';
import { MonitorEntity } from './monitor.entity';

@Entity('monitor_online', {
  comment: 'Мониторы онлайн/оффлайн',
})
export class MonitorOnlineEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_monitoronline_id',
  })
  @ApiProperty({
    description: 'Идентификатор',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_monitoronline_monitor_id' })
  monitor!: MonitorEntity;

  @Column({ type: 'uuid' })
  @RelationId((stat: MonitorOnlineEntity) => stat.monitor)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  monitorId!: string;

  @Column({ type: 'enum', enum: MonitorStatus, default: MonitorStatus.Offline })
  @Index('monitorOnlineStatus')
  @ApiProperty({
    description: 'Подключен',
    enum: MonitorStatus,
    enumName: 'MonitorStatus',
    example: MonitorStatus.Offline,
  })
  @IsOptional()
  @IsEnum(MonitorStatus, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status!: MonitorStatus;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_monitoronline_user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @RelationId((stat: MonitorOnlineEntity) => stat.user)
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
