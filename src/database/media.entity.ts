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
import { IsUUID } from 'class-validator';

import { FolderEntity } from '@/database/folder.entity';
import { UserEntity } from '@/database/user.entity';
import { EditorEntity } from '@/database/editor.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { VideoType } from './enums/video-type.enum';

export class MediaMeta {
  @ApiProperty({
    description: 'Длительность',
    example: '200',
  })
  duration: number;

  @ApiProperty({
    description: 'Размер файла',
    example: '20500',
  })
  filesize: number;
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
  hash?: string;

  @Column({ type: 'enum', enum: VideoType })
  @ApiProperty({
    description: 'Тип файла',
    type: VideoType,
    enum: VideoType,
    example: VideoType.Video,
  })
  type!: VideoType;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Метаинформация',
    type: MediaMeta,
    example: { duration: 200, filesize: 20500 },
    required: false,
  })
  meta?: MediaMeta;

  @ManyToOne(() => FolderEntity, (folder) => folder.id, { nullable: false })
  @JoinColumn()
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    name: 'folderId',
    required: false,
  })
  folder!: FolderEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  user!: UserEntity;

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
