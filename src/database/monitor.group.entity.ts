import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID } from 'class-validator';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MonitorEntity } from '@/database/monitor.entity';
import { UserEntity } from './user.entity';

@Entity('monitor_multiple', { comment: 'Групповые мониторы' })
export class MonitorGroupEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_id' })
  @ApiProperty({
    description: 'Групповой идентификатор монитора',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
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
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Монитор владелец (SCALING / MIRROR)',
    type: 'string',
    format: 'uuid',
  })
  @IsUUID()
  parentMonitor!: MonitorEntity;

  @Column()
  @IsUUID()
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
  @IsUUID()
  monitor!: MonitorEntity;

  @Column()
  @IsUUID()
  monitorId!: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  @IsUUID()
  userId!: string;
}
