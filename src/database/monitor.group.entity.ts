import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { i18nValidationMessage } from 'nestjs-i18n';

import { MonitorEntity } from '@/database/monitor.entity';
import { UserEntity } from './user.entity';

@Entity('monitor_multiple', { comment: 'Групповые мониторы' })
export class MonitorGroupEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_monitor_group_id',
  })
  @ApiProperty({
    description: 'Групповой идентификатор монитора',
    format: 'uuid',
    required: true,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @Column({ type: 'smallint', nullable: false, default: 0 })
  @ApiProperty({
    description: 'Номер монитора в группе (строка)',
    example: 0,
    required: true,
  })
  @IsNumber()
  row!: number;

  @Column({ type: 'smallint', nullable: false, default: 0 })
  @ApiProperty({
    description: 'Номер монитора в группе (колонка)',
    example: 0,
    required: true,
  })
  @IsNumber()
  col!: number;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id, {
    eager: false,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Монитор владелец (SCALING / MIRROR)',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  parentMonitor!: MonitorEntity;

  @Column()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  parentMonitorId!: string;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Подчиненный монитор ID',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  monitor!: MonitorEntity;

  @Column()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  monitorId!: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @Index('monitorGroupUserIdIndex')
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  userId!: string;
}
