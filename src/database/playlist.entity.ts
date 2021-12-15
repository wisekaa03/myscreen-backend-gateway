import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@/database/user.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { MediaEntity } from '@/database/media.entity';

@Entity('playlist')
export class PlaylistEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ type: 'uuid', array: true, nullable: true })
  videoIds!: string[];

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user!: UserEntity;

  @ManyToMany(
    () => MonitorEntity,
    (monitor: MonitorEntity) => monitor.playlists,
    {
      nullable: true,
    },
  )
  monitors?: MonitorEntity[];

  @ManyToMany(() => MediaEntity, (media: MediaEntity) => media.playlists, {
    nullable: true,
  })
  media?: MediaEntity[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
