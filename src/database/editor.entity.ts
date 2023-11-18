import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AfterLoad,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

import { RenderingStatus } from '@/enums/rendering-status.enum';
import { UserEntity } from './user.entity';
import { EditorLayerEntity } from '@/database/editor-layer.entity';
import { FileEntity } from './file.entity';

@Entity('editor')
@Unique('IDX_editor_userId_name', ['userId', 'name'])
export class EditorEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор редактора',
    format: 'uuid',
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

  @Column({ type: 'integer', default: 1920 })
  @ApiProperty({
    description: 'Ширина редактора',
    type: 'integer',
    example: 1920,
    required: true,
  })
  @IsInt()
  width!: number;

  @Column({ type: 'integer', default: 1080 })
  @ApiProperty({
    description: 'Высота редактора',
    type: 'integer',
    example: 1080,
    required: true,
  })
  @IsInt()
  height!: number;

  @Column({ type: 'integer', default: 24 })
  @ApiProperty({
    description: 'Фреймрейт',
    type: 'integer',
    example: 24,
    required: true,
  })
  @IsInt()
  fps!: number;

  @Column({
    type: 'enum',
    enum: RenderingStatus,
    default: RenderingStatus.Initial,
  })
  @ApiProperty({
    description: 'Статус рендеринга',
    enum: RenderingStatus,
    enumName: 'RenderingStatus',
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
    example: 0,
    nullable: true,
    required: true,
  })
  @IsNumber()
  renderingPercent!: number | null;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    type: 'string',
    description: 'Ошибка рендеринга',
    nullable: true,
    required: true,
  })
  @IsString()
  renderingError!: string | null;

  @ManyToOne(() => FileEntity, (file) => file.id, {
    onDelete: 'CASCADE',
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Обработанный файл',
    type: 'string',
    nullable: true,
    allOf: [{ $ref: '#/components/schemas/FileResponse' }],
  })
  renderedFile!: FileEntity | null;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({
    description: 'Воспроизводить музыку с видео',
    type: 'boolean',
    example: true,
    required: true,
  })
  @IsBoolean()
  keepSourceAudio!: boolean;

  @Column({ type: 'numeric', default: 0 })
  @ApiProperty({
    description: 'Общее время',
    type: 'number',
    example: 0,
    required: true,
  })
  @IsNumber()
  totalDuration!: number;

  @ManyToMany(() => EditorLayerEntity, (layer) => layer.video, {
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

  @ManyToMany(() => EditorLayerEntity, (layer) => layer.audio, {
    nullable: true,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Аудио слой',
    type: 'string',
    format: 'uuid',
    isArray: true,
    nullable: true,
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

  @Column({ select: false })
  @IsUUID()
  userId!: string;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T00:00:00.000Z',
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T00:00:00.000Z',
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false })
  updatedAt?: Date;

  @AfterLoad()
  @AfterUpdate()
  after() {
    this.totalDuration = parseFloat(`${this.totalDuration || 0}`);
    if (Array.isArray(this.videoLayers) && this.videoLayers.length > 0) {
      this.videoLayers = this.videoLayers.sort((a, b) => a.index - b.index);
    }
    if (Array.isArray(this.audioLayers) && this.audioLayers.length > 0) {
      this.audioLayers = this.audioLayers.sort((a, b) => a.index - b.index);
    }
  }
}
