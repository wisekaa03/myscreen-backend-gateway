import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
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
import { EditorLayerEntity } from '@/database/editor-layer.entity';
import { FileEntity } from './file.entity';

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

  @Column()
  @ApiProperty({
    description: 'Имя редактора',
    example: 'имя редактора',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  name!: string;

  @Column({ type: 'numeric', default: 1920 })
  @ApiProperty({
    description: 'Ширина редактора',
    example: '1920',
    required: true,
  })
  @IsNumber()
  width!: number;

  @Column({ type: 'numeric', default: 1080 })
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
    enum: RenderingStatus,
    example: RenderingStatus.Initial,
    required: true,
  })
  @IsEnum(RenderingStatus)
  renderingStatus!: RenderingStatus;

  @Column({
    type: 'integer',
    default: null,
    nullable: true,
  })
  @ApiProperty({
    type: 'integer',
    description: 'Процент рендеринга',
    example: '0',
    required: false,
  })
  @IsNumber()
  renderingPercent!: number | null;

  @Column({ type: 'varchar', nullable: true })
  @IsString()
  renderingError!: string | null;

  @ManyToOne(() => FileEntity, (file) => file.id, {
    onUpdate: 'NO ACTION',
    onDelete: 'NO ACTION',
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Обработанный файл',
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/FileResponse' }],
  })
  renderedFile!: FileEntity | null;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({
    description: '', // DEBUG: непонятно
    type: 'boolean',
    example: true,
    required: true,
  })
  @IsBoolean()
  keepSourceAudio!: boolean;

  @Column({ type: 'numeric', default: 0, nullable: true })
  @ApiProperty({
    description: 'Общее время',
    type: 'integer',
    example: 0,
    required: true,
  })
  @IsNumber()
  totalDuration!: number;

  @ManyToMany(() => EditorLayerEntity, (layer) => layer.videoLayers, {
    nullable: true,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Видео слой',
    type: 'string',
    format: 'uuid',
    isArray: true,
  })
  videoLayers!: EditorLayerEntity[];

  @ManyToMany(() => EditorLayerEntity, (layer) => layer.audioLayers, {
    nullable: true,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Аудио слой',
    type: 'string',
    format: 'uuid',
    isArray: true,
  })
  audioLayers!: EditorLayerEntity[];

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column()
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
