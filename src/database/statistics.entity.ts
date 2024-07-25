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
import { IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { UserEntity } from './user.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';

@Entity('statistics', {
  comment: 'Статистика устройств',
  orderBy: { createdAt: 'ASC' },
})
export class StatisticsEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_statistics_id',
  })
  @ApiProperty({
    description: 'Идентификатор акта выполненных работ',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id, {
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_statistics_monitor_id' })
  monitor!: MonitorEntity;

  @Column({ type: 'uuid' })
  @RelationId((stat: StatisticsEntity) => stat.monitor)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  monitorId!: string;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_statistics_playlist_id' })
  playlist!: PlaylistEntity;

  @Column({ type: 'uuid' })
  @RelationId((stat: StatisticsEntity) => stat.playlist)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  playlistId!: string;

  @Column({ type: 'boolean' })
  @ApiProperty({
    description: 'Проигрывается плэйлист',
    example: false,
  })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  playlistPlayed!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_statistics_user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @RelationId((stat: StatisticsEntity) => stat.user)
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
