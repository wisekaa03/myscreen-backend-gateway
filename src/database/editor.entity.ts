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
import { MediaEntity } from '@/database/media.entity';
import { RenderingStatus } from './enums/rendering-status.enum';

@Entity('editor')
export class EditorEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

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

  // ??
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

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user!: UserEntity;

  @ManyToMany(() => MediaEntity, (media) => media.editors, {
    nullable: true,
  })
  media?: MediaEntity[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
