import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { i18nValidationMessage } from 'nestjs-i18n';

import { MonitorEntity } from './monitor.entity';
import { UserEntity } from './user.entity';

@Entity('monitor_favorite', { comment: 'Избранные мониторы по пользователям' })
export class MonitorFavoriteEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_monitor_favorite_id',
  })
  @ApiProperty({
    description: 'Идентификатор избранного монитора',
    format: 'uuid',
    required: true,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.favorities, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'monitorId',
    foreignKeyConstraintName: 'FK_monitor_favorite_monitor_id',
  })
  monitor?: MonitorEntity;

  @Column()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  monitorId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
  })
  @JoinColumn({ name: 'userId' })
  @Index()
  user?: UserEntity;

  @Column()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  userId!: string;
}
