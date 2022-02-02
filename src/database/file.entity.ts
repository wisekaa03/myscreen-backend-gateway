import {
  AfterLoad,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import type { FfprobeData } from 'media-probe';
import {
  IsDate,
  IsDefined,
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { FileCategory, VideoType } from '@/enums';
import { FolderEntity } from '@/database/folder.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { FilePreviewEntity } from '@/database/file-preview.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { UserEntity } from './user.entity';

export class MediaMeta {
  @ApiProperty({
    description: 'Длительность',
    example: '200',
    required: false,
  })
  @IsNumber()
  duration?: number;

  @ApiProperty({
    description: 'Размер по горизонтали',
    example: '200',
    required: false,
  })
  @IsNumber()
  width?: number;

  @ApiProperty({
    description: 'Размер по вертикали',
    example: '200',
    required: false,
  })
  @IsNumber()
  height?: number;

  @ApiProperty({
    description: 'Размер файла',
    example: '20500',
  })
  @IsNumber()
  filesize!: number;

  @ApiProperty({
    description: 'Параметры видео, картинки или аудио',
    required: false,
  })
  @IsJSON()
  info?: FfprobeData;
}

@Entity('file')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    example: '1234567',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
  id!: string;

  @ManyToOne(() => FolderEntity, (folder) => folder.files, {
    eager: true,
  })
  @JoinColumn({ name: 'folderId' })
  folder!: FolderEntity;

  @Column()
  @ApiProperty({
    description: 'Идентификатор папки',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsNotEmpty()
  @IsUUID()
  folderId?: string;

  @Column()
  @ApiProperty({
    description: 'Имя файла',
    example: 'foo.mp4',
  })
  @IsNotEmpty()
  name!: string;

  @Column({ default: 'mp4' })
  @ApiProperty({
    description: 'Расширение файла',
    example: 'mp4',
  })
  @IsDefined()
  @IsNotEmpty()
  extension!: string;

  @Column()
  @ApiProperty({
    description: 'Hash файла',
    example: '2b0439011a3a215ae1756bfc342e5bbc',
  })
  @IsString()
  // @IsHash()
  hash!: string;

  @Column({ type: 'enum', enum: VideoType })
  @ApiProperty({
    description: 'Тип файла',
    enum: VideoType,
    example: VideoType.Video,
    required: true,
  })
  @IsEnum(VideoType)
  videoType!: VideoType;

  @Column({ type: 'enum', enum: FileCategory })
  @ApiProperty({
    description: 'В какую категорию относить файл',
    enum: FileCategory,
    example: FileCategory.Media,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Размер файла',
    example: 210000,
  })
  @IsNotEmpty()
  filesize!: number;

  @Column({ type: 'numeric', default: 0 })
  @ApiProperty({
    description: 'Продолжительность видео',
    type: 'number',
    example: 10,
  })
  @IsNotEmpty()
  duration!: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    description: 'Размер по горизонтали',
    example: 1024,
    required: true,
  })
  @IsNotEmpty()
  width!: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    description: 'Размер по вертикали',
    example: 1024,
    required: true,
  })
  @IsNotEmpty()
  height!: number;

  @Column({ select: false, type: 'json', nullable: true })
  meta!: MediaMeta;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ select: false, nullable: true })
  userId!: string;

  @OneToOne(() => FilePreviewEntity, (filePreview) => filePreview.file, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  preview!: FilePreviewEntity;

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.files, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  playlists?: PlaylistEntity[];

  @ManyToMany(() => MonitorEntity, (monitor) => monitor.files, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  monitors?: MonitorEntity[];

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
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDate()
  updatedAt!: Date;

  @AfterLoad()
  @AfterUpdate()
  after() {
    this.duration = parseFloat(this.duration as unknown as string);
  }
}
