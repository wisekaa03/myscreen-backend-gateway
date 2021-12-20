import { IsBoolean, IsDate, IsEnum, IsNumber, IsUUID } from 'class-validator';
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
  @ApiProperty({
    description: 'Идентификатор редактора',
    example: '12345678',
    required: true,
  })
  @IsUUID()
  id!: string;

  @Column({ type: 'numeric' })
  @ApiProperty({
    description: 'Ширина редактора',
    example: '1920',
    required: true,
  })
  @IsNumber()
  width!: number;

  @Column({ type: 'numeric' })
  @ApiProperty({
    description: 'Высота редактора',
    example: '1080',
    required: true,
  })
  @IsNumber()
  height!: number;

  @Column({ type: 'numeric', default: 24 })
  @ApiProperty({
    description: 'Фреймрейт',
    type: 'integer',
    example: 24,
    required: true,
  })
  @IsNumber()
  fps!: number;

  @Column({
    type: 'enum',
    enum: RenderingStatus,
    default: RenderingStatus.Initial,
    nullable: true,
  })
  @ApiProperty({
    description: 'Статус рендеринга',
    type: RenderingStatus,
    enum: RenderingStatus,
    example: RenderingStatus.Initial,
    required: true,
  })
  @IsEnum(RenderingStatus)
  renderingStatus!: RenderingStatus;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({
    description: 'Эмм...',
    type: 'boolean',
    example: true,
    required: true,
  })
  @IsBoolean()
  keep_source_audio!: boolean;

  @Column({ type: 'numeric', default: 0, nullable: true })
  @ApiProperty({
    description: 'Общее время',
    type: 'integer',
    example: 0,
    required: true,
  })
  @IsNumber()
  total_duration?: number;

  @Column({ type: 'json', default: [], array: true })
  audio_tracks?: unknown[];

  @Column({ type: 'json', default: [], array: true })
  layers?: unknown[];

  @ManyToMany(() => FileEntity, (file) => file.editors, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  files?: FileEntity[];

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

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDate()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDate()
  updatedAt!: Date;
}
