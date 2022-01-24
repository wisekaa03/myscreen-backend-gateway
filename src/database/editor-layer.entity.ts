import { IsDate, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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

import { FileEntity } from '@/database/file.entity';
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
  })
  videoLayers!: EditorEntity[];

  @ManyToMany(() => EditorEntity, (editor) => editor.audioLayers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    nullable: true,
  })
  audioLayers!: EditorEntity[];

  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Индекс файла',
    example: '1',
    required: true,
  })
  @IsNumber()
  @Min(1)
  index!: number;

  @Column({ type: 'decimal', default: 0.0 })
  @ApiProperty({
    description: 'Длительность',
    example: '10',
    required: true,
  })
  @IsNumber()
  @Min(1)
  duration!: number;

  @Column({ type: 'decimal', default: 0.0 })
  @ApiProperty({
    description: 'С какой секунды начать вырезать клип',
    example: '0',
    required: true,
  })
  @IsNumber()
  cutFrom!: number;

  @Column({ type: 'decimal', default: 0.0 })
  @ApiProperty({
    description: 'До какой секунды вырезать клип',
    example: '10',
    required: true,
  })
  @IsNumber()
  @Min(1)
  cutTo!: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    description: 'С какой секунды начинать воспроизводить клип',
    example: '0',
    required: true,
  })
  @IsNumber()
  start!: number;

  @Column({ type: 'integer', default: 0.0 })
  @ApiProperty({
    description: '', // DEBUG: непонятно
    example: '1',
    default: 1,
    required: true,
  })
  @IsNumber()
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

  // For path name
  path!: string;
}
