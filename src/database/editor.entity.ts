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

import { UserEntity } from './user.entity';
import { MediaEntity } from './media.entity';

export enum RenderingStatus {
  Initial = 'initial',
  Ready = 'ready',
  Pending = 'pending',
  Error = 'error',
}

@Entity('editors')
export class EditorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'numeric' })
  width!: number;

  @Column({ type: 'numeric' })
  height!: number;

  @Column({ type: 'numeric', default: 24 })
  fps!: number;

  @Column({
    type: 'enum',
    enum: RenderingStatus,
    default: RenderingStatus.Initial,
    nullable: true,
  })
  renderingStatus!: RenderingStatus;

  @Column({ nullable: true })
  fileId?: string;

  @Column({ type: 'boolean', default: true })
  keep_source_audio!: boolean;

  @Column({ type: 'json', default: [], array: true })
  layers!: unknown[];

  @Column({ type: 'numeric', default: 0, nullable: true })
  total_duration!: number;

  @Column({ type: 'json', default: [], array: true })
  audio_tracks!: unknown[];

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'ownerId' })
  users!: UserEntity; // why users, user must be ?

  @ManyToMany(() => MediaEntity, (media) => media.id)
  @JoinTable({ name: 'media_playlist_map' })
  media?: MediaEntity[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
