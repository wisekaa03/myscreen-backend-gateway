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
import { MonitorEntity } from '@/database/monitor.entity';
import { VideoEntity } from '@/database/video.entity';
import { MediaEntity } from '@/database/media.entity';

@Entity('playlists')
export class PlaylistEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ type: 'uuid', array: true, nullable: true })
  video_ids!: string[];

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'ownerId' })
  users!: UserEntity; // why users, user must be ?

  @ManyToMany(() => MonitorEntity, (monitor) => monitor.id)
  @JoinTable({ name: 'monitor_playlist_map' })
  monitors?: MonitorEntity[];

  @ManyToMany(() => VideoEntity, (video) => video.id)
  @JoinTable({ name: 'video_playlist_map' })
  videos?: VideoEntity[];

  @ManyToMany(() => MonitorEntity, (monitor) => monitor.id)
  @JoinTable({ name: 'media_playlist_map' })
  media?: MediaEntity[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
