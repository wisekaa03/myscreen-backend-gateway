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

// eslint-disable-next-line import/no-cycle
import { MonitorEntity } from './monitor.entity';
import { UserEntity } from './user.entity';

@Entity('monitor_favorite')
export class MonitorFavoriteEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор избранного монитора',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
  id!: string;

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.favorities, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'monitorId' })
  monitor?: MonitorEntity;

  @Column()
  @IsUUID()
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
  @IsUUID()
  userId!: string;
}
