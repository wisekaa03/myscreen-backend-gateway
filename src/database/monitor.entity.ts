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
import { FileEntity } from '@/database/file.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { MonitorOrientation } from './enums/monitor-orientation.enum';

@Entity('monitors')
export class MonitorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({ default: 'offline' })
  status!: string;

  @Column({ nullable: true })
  last_seen?: string;

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
  @JoinColumn({ name: 'ownerId' })
  users!: UserEntity;

  @ManyToMany(() => FileEntity, (file) => file.id)
  @JoinTable()
  files?: FileEntity[];

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.id)
  @JoinTable({ name: 'media_playlist_map' })
  playlists!: PlaylistEntity;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
