import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@/database/user.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { MonitorOrientation } from './enums/monitor-orientation.enum';
import { MonitorStatus } from './enums/monitor-status.enum';

@Entity('monitor')
export class MonitorEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ unique: true })
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

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user!: UserEntity;

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.monitors, {
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  playlists?: PlaylistEntity;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
