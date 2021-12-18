import { IsUUID } from 'class-validator';
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
  UpdateDateColumn,
} from 'typeorm';

import { RenderingStatus } from '@/enums';
import { UserEntity } from '@/database/user.entity';
import { FileEntity } from '@/database/file.entity';

@Entity('editor')
export class EditorEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
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

  // ??
  @Column({ nullable: true })
  fileId?: string;

  @Column({ type: 'boolean', default: true })
  keep_source_audio!: boolean;

  @Column({ type: 'json', default: [], array: true })
  layers?: unknown[];

  @Column({ type: 'numeric', default: 0, nullable: true })
  total_duration?: number;

  @Column({ type: 'json', default: [], array: true })
  audio_tracks?: unknown[];

  @ManyToOne(() => UserEntity, (user) => user.id, {
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

  @ManyToMany(() => FileEntity, (file) => file.editors, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  files?: FileEntity[];

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  updatedAt?: Date;
}
