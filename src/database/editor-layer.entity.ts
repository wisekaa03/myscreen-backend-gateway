import { IsDate, IsUUID, Min, Max, IsInt, IsNumber } from 'class-validator';
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
  @IsInt()
  start!: number;

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

  @Column()
  @IsUUID()
  fileId!: string;

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

  @AfterLoad()
  @AfterUpdate()
  after() {
    this.start = parseFloat(this.start as unknown as string);
    this.duration = parseFloat(this.duration as unknown as string);
    this.cutFrom = parseFloat(this.cutFrom as unknown as string);
    this.cutTo = parseFloat(this.cutTo as unknown as string);
  }
}
