import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import type { FfprobeData } from 'media-probe';
import {
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { MonitorRequest } from '@/dto';
import { FileCategory, VideoType } from '@/enums';
import { FolderEntity } from '@/database/folder.entity';
import { EditorEntity } from '@/database/editor.entity';
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

  @ManyToOne(() => FolderEntity, (folder) => folder.id, { eager: false })
  @JoinColumn({ name: 'folderId' })
  folder!: FolderEntity;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Папка',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsNotEmpty()
  @IsUUID()
  folderId!: string;

  @Column()
  @ApiProperty({
    description: 'Изначальное имя файла',
    example: 'foo.mp4',
  })
  @IsNotEmpty()
  originalName!: string;

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
    type: VideoType,
    enum: VideoType,
    example: VideoType.Video,
    required: true,
  })
  @IsEnum(VideoType)
  videoType!: VideoType;

  @Column({ type: 'enum', enum: FileCategory })
  @ApiProperty({
    description: 'В какую категорию относить файл',
    type: FileCategory,
    enum: FileCategory,
    example: FileCategory.Media,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(FileCategory)
  category!: FileCategory;

  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Размер файла',
    example: 210000,
  })
  filesize!: number;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Метаинформация',
    type: MediaMeta,
    example: { duration: 200, filesize: 20500 },
    required: true,
  })
  @ValidateNested()
  @Type(() => MediaMeta)
  meta!: MediaMeta;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Идентификатор пользователя',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
  userId!: string;

  @OneToMany(() => FilePreviewEntity, (filePreview) => filePreview.file)
  preview?: FilePreviewEntity[];

  @ManyToMany(() => EditorEntity, (editor) => editor.files, {
    nullable: true,
  })
  editors?: EditorEntity[];

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.files, {
    nullable: true,
  })
  playlists?: PlaylistEntity[];

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.rendered, {
    nullable: true,
  })
  rendered?: PlaylistEntity[];

  @ManyToMany(() => MonitorEntity, (monitor) => monitor.files, {
    nullable: true,
  })
  monitors?: MonitorEntity[];

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  updatedAt?: Date;
}
