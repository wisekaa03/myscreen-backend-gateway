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

  @ManyToMany(() => MonitorEntity, (monitor) => monitor.id, {
    nullable: true,
    cascade: true,
  })
  @JoinTable()
  monitors?: MonitorEntity[];

  @ManyToMany(() => VideoEntity, (video) => video.id, {
    nullable: true,
    cascade: true,
  })
  @JoinTable()
  videos?: VideoEntity[];

  @ManyToMany(() => MonitorEntity, (monitor) => monitor.id, {
    nullable: true,
    cascade: true,
  })
  @JoinTable()
  media?: MediaEntity[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
