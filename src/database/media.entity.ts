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
import {
  IsEnum,
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

export class MediaMeta {
  @ApiProperty({
    description: 'Длительность',
    example: '200',
  })
  @IsNumber()
  duration!: number;

  @ApiProperty({
    description: 'Размер файла',
    example: '20500',
  })
  @IsNumber()
  filesize!: number;
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
  id?: string;

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
  hash?: string;

  @Column({ type: 'enum', enum: VideoType })
  @ApiProperty({
    description: 'Тип файла',
    type: VideoType,
    enum: VideoType,
    example: VideoType.Video,
  })
  @IsEnum(VideoType)
  type!: VideoType;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Метаинформация',
    type: MediaMeta,
    example: { duration: 200, filesize: 20500 },
    required: false,
  })
  @ValidateNested()
  @Type(() => MediaMeta)
  meta?: MediaMeta;

  @ManyToOne(() => FolderEntity, (folder) => folder.id)
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

  @ManyToMany(() => EditorEntity, (editor) => editor.id, { cascade: true })
  @JoinTable()
  editors!: EditorEntity[];

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.id, {
    cascade: true,
  })
  @JoinTable()
  playlists!: PlaylistEntity[];

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
