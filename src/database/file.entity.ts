import {
  AfterLoad,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
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
  IsDateString,
  IsDefined,
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';

import { FileCategory, VideoType } from '@/enums';
import { UserEntity } from './user.entity';
import { PlaylistEntity } from './playlist.entity';
import { FolderEntity } from '@/database/folder.entity';
import { FilePreviewEntity } from '@/database/file-preview.entity';
import { MonitorEntity } from '@/database/monitor.entity';

@Entity('file')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
  id!: string;

  @ManyToOne(() => FolderEntity, (folder) => folder.files, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
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
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  folderId?: string;

  @Column()
  @ApiProperty({
    description: 'Имя файла',
    example: 'foo.mp4',
    required: true,
  })
  @IsDefined()
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
    enumName: 'VideoType',
    example: VideoType.Video,
    required: true,
  })
  @IsEnum(VideoType)
  videoType!: VideoType;

  @Column({ type: 'enum', enum: FileCategory })
  @ApiProperty({
    description: 'В какую категорию относить файл',
    enum: FileCategory,
    enumName: 'FileCategory',
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
  @IsDefined()
  @IsNotEmpty()
  filesize!: number;

  @Column({ type: 'numeric', default: 0 })
  @ApiProperty({
    description: 'Продолжительность видео',
    type: 'number',
    example: 10,
  })
  @IsDefined()
  @IsNotEmpty()
  duration!: number;

  @Column({ type: 'integer', default: 1024 })
  @ApiProperty({
    description: 'Размер по горизонтали',
    example: 1024,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  width!: number;

  @Column({ type: 'integer', default: 1024 })
  @ApiProperty({
    description: 'Размер по вертикали',
    example: 1024,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  height!: number;

  @Column({ select: false, type: 'jsonb', nullable: true })
  @ApiProperty({
    description: 'Параметры видео, картинки или аудио',
    required: false,
  })
  @IsJSON()
  info?: FfprobeData;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  @Index()
  @IsUUID()
  userId!: string;

  @OneToOne(() => FilePreviewEntity, (filePreview) => filePreview.file, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  preview?: FilePreviewEntity | Partial<FilePreviewEntity>;

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
    description: 'Время изменения',
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

  @ApiProperty({
    description: 'Подписанный URL на файл',
    example: 'https://storage.yandex.ru/file.mp4',
    type: 'string',
    required: false,
  })
  @IsUrl()
  signedUrl?: string;

  @AfterLoad()
  @AfterUpdate()
  after() {
    if (this.duration !== undefined && this.duration !== null) {
      this.duration = parseFloat(`${this.duration}`);
    }
  }
}
