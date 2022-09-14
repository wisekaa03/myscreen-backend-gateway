import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @ManyToOne(() => MonitorEntity, (monitor) => monitor.favorities)
  monitor!: MonitorEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  user!: UserEntity;
}
