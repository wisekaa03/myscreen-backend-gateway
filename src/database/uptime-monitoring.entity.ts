import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

import { MonitorEntity } from '@/database/monitor.entity';
import { UserEntity } from './user.entity';

@Entity('uptime_monitoring', { comment: 'Что это!!!' })
export class UptimeMonitoringEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_uptime_monitoring_id',
  })
  @ApiProperty({
    description: 'Идентификатор',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id?: string;

  @Column({ type: 'integer' })
  processingHour!: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  count!: number;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id)
  @JoinColumn({ foreignKeyConstraintName: 'FK_uptime_monitoring_monitor_id' })
  monitor!: MonitorEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_uptime_monitoring_user_id' })
  user!: UserEntity;

  @Column({ select: false })
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
