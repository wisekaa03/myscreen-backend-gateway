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
import { ApiProperty } from '@nestjs/swagger';
import type { FfprobeData } from 'media-probe';
import {
  IsEnum,
  IsJSON,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { FolderEntity } from '@/database/folder.entity';
import { EditorEntity } from '@/database/editor.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { VideoType } from './enums/video-type.enum';
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

@Entity('media')
export class MediaEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    example: '1234567',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Изначальное имя файла',
    example: 'foo.mp4',
  })
  originalName!: string;

  @Column()
  @ApiProperty({
    description: 'Имя файла',
    example: 'bar',
  })
  name!: string;

  @Column({ nullable: true })
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
  })
  @IsEnum(VideoType)
  type!: VideoType;

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
  @IsUUID()
  userId!: string;

  @ManyToOne(() => FolderEntity, (folder) => folder.id, { eager: false })
  @JoinColumn({ name: 'folderId' })
  folder!: FolderEntity;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Папка',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  folderId!: string;

  @ManyToMany(() => EditorEntity, (editor: EditorEntity) => editor.media, {
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  editors?: EditorEntity[];

  @ManyToMany(
    () => PlaylistEntity,
    (playlist: PlaylistEntity) => playlist.media,
    {
      cascade: true,
      nullable: true,
    },
  )
  @JoinTable()
  playlists?: PlaylistEntity[];

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  updatedAt?: Date;
}
