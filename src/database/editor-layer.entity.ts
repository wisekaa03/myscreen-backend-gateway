import {
  IsUUID,
  Min,
  Max,
  IsInt,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AfterLoad,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { FileEntity } from './file.entity';
import { EditorEntity } from './editor.entity';

@Entity('editor_layer')
export class EditorLayerEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор слоя',
    example: '12345678',
    required: true,
  })
  @IsUUID()
  id!: string;

  @ManyToMany(() => EditorEntity, (editor) => editor.videoLayers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    nullable: true,
    eager: false,
  })
  video!: EditorEntity[];

  @ManyToMany(() => EditorEntity, (editor) => editor.audioLayers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    nullable: true,
    eager: false,
  })
  audio!: EditorEntity[];

  @Column({ type: 'integer', default: 1 })
  @ApiProperty({
    description: 'Индекс файла',
    type: 'integer',
    example: 1,
    default: 1,
    required: true,
  })
  @IsInt()
  @Min(1)
  index!: number;

  @Column({ type: 'numeric', default: 10.0 })
  @ApiProperty({
    type: 'number',
    description: 'Длительность',
    example: 10,
    default: 10,
    required: true,
  })
  @IsNumber()
  @Min(1)
  duration!: number;

  @Column({ type: 'numeric', default: 0.0 })
  @ApiProperty({
    type: 'number',
    description: 'С какой секунды начать вырезать клип',
    example: 0,
    default: 0,
    required: true,
  })
  @IsNumber()
  cutFrom!: number;

  @Column({ type: 'numeric', default: 10 })
  @ApiProperty({
    type: 'number',
    description: 'До какой секунды вырезать клип',
    example: 10,
    default: 10,
    required: true,
  })
  @IsNumber()
  @Min(1)
  cutTo!: number;

  @Column({ type: 'numeric', default: 0 })
  @ApiProperty({
    description: 'С какой секунды начинать воспроизводить клип',
    type: 'number',
    default: 0,
    example: 0,
    required: true,
  })
  @IsNumber()
  @Min(0)
  start!: number;

  @Column({ type: 'numeric', nullable: true, default: null })
  @ApiProperty({
    description: 'Обрезать слева',
    type: 'number',
    required: false,
  })
  @IsNumber()
  cropX!: number;

  @Column({ type: 'numeric', nullable: true, default: null })
  @ApiProperty({
    description: 'Обрезать сверху',
    type: 'number',
    required: false,
  })
  @IsNumber()
  cropY!: number;

  @Column({ type: 'numeric', nullable: true, default: null })
  @ApiProperty({
    description: 'Ширина обрезки',
    type: 'number',
    required: false,
  })
  @IsNumber()
  cropW!: number;

  @Column({ type: 'numeric', nullable: true, default: null })
  @ApiProperty({
    type: 'number',
    description: 'Высота обрезки',
    required: false,
  })
  @IsNumber()
  cropH!: number;

  @Column({ type: 'integer', default: 1 })
  @ApiProperty({
    description: 'Аудио дорожка из видео, 0-выключен, 1-включен',
    type: 'integer',
    example: 1,
    default: 1,
    required: true,
  })
  @IsInt()
  @Min(0)
  @Max(1)
  mixVolume!: number;

  @ManyToOne(() => FileEntity, (file) => file.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    nullable: false,
    eager: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Файл',
    type: 'string',
    format: 'uuid',
  })
  file!: FileEntity;

  @Column({ select: false })
  @IsUUID()
  fileId!: string;

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

  // For path name
  path!: string;

  @AfterLoad()
  @AfterUpdate()
  after() {
    this.start = parseFloat(`${this.start || 0}`);
    this.duration = parseFloat(`${this.duration || 0}`);
    this.cutFrom = parseFloat(`${this.cutFrom}`);
    this.cutTo = parseFloat(`${this.cutTo}`);
  }
}
