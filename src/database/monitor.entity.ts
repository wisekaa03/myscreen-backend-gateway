import { IsDefined, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@/database/user.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { MonitorOrientation } from './enums/monitor-orientation.enum';
import { MonitorStatus } from './enums/monitor-status.enum';

@Entity('monitor')
@Unique('IDX_user_name', ['user', 'name'])
export class MonitorEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id!: string;

  @Column()
  @IsDefined()
  name!: string;

  @Column({ type: 'json' })
  address!: Record<string, string>;

  @Column({ type: 'integer' })
  category!: number;

  @Column({ type: 'json' })
  price!: unknown;

  @Column({ type: 'enum', enum: MonitorOrientation })
  orientation!: MonitorOrientation;

  @Column({ type: 'json' })
  monitor!: any;

  @Column({ type: 'boolean', default: false })
  attached?: boolean;

  @Column()
  code!: string;

  // Fuck this
  @Column({ type: 'simple-array', default: [], array: true })
  media!: string[];

  @Column({ type: 'enum', enum: MonitorStatus, default: MonitorStatus.Offline })
  status!: MonitorStatus;

  @Column({ nullable: true })
  lastSeen?: string;

  @Column({ type: 'uuid', nullable: true })
  currentPlaylistId?: string;

  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Column({ type: 'float', nullable: true })
  longitude?: number;

  @ManyToOne(() => UserEntity, (user) => user.monitors, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column({ nullable: true })
  @IsUUID()
  userId!: string;

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.monitors, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  playlists?: PlaylistEntity;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  updatedAt?: Date;
}
