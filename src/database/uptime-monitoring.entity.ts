import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsDate, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { MonitorEntity } from '@/database/monitor.entity';
import { UserEntity } from './user.entity';

@Entity('uptime_monitoring')
export class UptimeMonitoringEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор',
    example: '1234567',
    format: 'uuid',
  })
  @IsUUID()
  id?: string;

  @Column({ type: 'integer' })
  processingHour!: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  count!: number;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id)
  @JoinColumn()
  monitor!: MonitorEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
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
  @IsDate()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDate()
  updatedAt!: Date;
}
