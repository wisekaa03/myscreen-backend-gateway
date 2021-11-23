import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { MonitorEntity } from '@/database/monitor.entity';

@Entity('uptime_monitoring')
export class UptimeMonitoringEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'integer', nullable: false })
  processing_hour!: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  count!: number;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.id, { nullable: false })
  @JoinColumn({ name: 'monitor_id' })
  monitor?: MonitorEntity;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
