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
    nullable: true,
  })
  videoLayers?: EditorEntity[];

  @ManyToMany(() => EditorEntity, (editor) => editor.audioLayers, {
    nullable: true,
  })
  audioLayers?: EditorEntity[];

  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Индекс файла',
    example: '3',
    required: true,
  })
  @IsNumber()
  @Min(1)
  index!: number;

  @Column({ type: 'numeric' })
  @ApiProperty({
    description: 'Длительность',
    example: '0',
    required: true,
  })
  @IsNumber()
  duration!: number;

  @Column({ type: 'numeric' })
  @ApiProperty({
    description: 'С какой секунды начать вырезать клип',
    example: '0',
    required: true,
  })
  @IsNumber()
  cutFrom!: number;

  @Column({ type: 'numeric' })
  @ApiProperty({
    description: 'До какой секунды вырезать клип',
    example: '0',
    required: true,
  })
  @IsNumber()
  cutTo!: number;

  @Column({ type: 'numeric' })
  @ApiProperty({
    description: 'С какой секунды начинать воспроизводить клип',
    example: '0',
    required: true,
  })
  @IsNumber()
  start!: number;

  @Column({ type: 'numeric' })
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
    nullable: true,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Файл',
    type: 'string',
    format: 'uuid',
    isArray: true,
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
}
