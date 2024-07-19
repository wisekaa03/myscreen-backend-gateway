import {
  AfterLoad,
  AfterUpdate,
  BaseEntity,
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
  IsPositive,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FileType } from '@/enums';
import { UserEntity } from './user.entity';
import { PlaylistEntity } from './playlist.entity';
import { FolderEntity } from '@/database/folder.entity';
import { FilePreviewEntity } from '@/database/file-preview.entity';
import { MonitorEntity } from '@/database/monitor.entity';

@Entity('file', { comment: 'Файлы' })
export class FileEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_file_id' })
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
    required: true,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
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
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  folderId?: string;

  @Column()
  @ApiProperty({
    description: 'Имя файла',
    example: 'foo.mp4',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  name!: string;

  @Column({ default: 'mp4' })
  @ApiProperty({
    description: 'Расширение файла',
    example: 'mp4',
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  extension!: string;

  @Column()
  @ApiProperty({
    description: 'Hash файла',
    example: '2b0439011a3a215ae1756bfc342e5bbc',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  // @IsHash()
  hash!: string;

  @Column({ type: 'enum', enum: FileType })
  @ApiProperty({
    description: 'Тип файла',
    deprecated: true,
    enum: FileType,
    enumName: 'FileType',
    example: FileType.VIDEO,
    required: false,
  })
  @IsEnum(FileType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  videoType!: FileType;

  @Column({ type: 'integer' })
  @ApiProperty({
    description: 'Размер файла',
    example: 210000,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  filesize!: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  @ApiProperty({
    description: 'Продолжительность видео',
    example: 10,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsPositive({ message: i18nValidationMessage('validation.IS_POSITIVE') })
  duration!: number;

  @Column({ type: 'integer', default: 1024 })
  @ApiProperty({
    description: 'Размер по горизонтали',
    example: 1024,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  width!: number;

  @Column({ type: 'integer', default: 1024 })
  @ApiProperty({
    description: 'Размер по вертикали',
    example: 1024,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  height!: number;

  @Column({ select: false, type: 'jsonb', nullable: true })
  @ApiProperty({
    description:
      'Параметры видео, картинки или аудио, используется FfprobeData',
    example:
      '{ format: { size: "100000", filename: "foo.mp4" }, streams: [{ codec_name: "h264", width: 1024, height: 1024 }] }',
    required: false,
  })
  @IsJSON({ message: i18nValidationMessage('validation.IS_JSON') })
  info?: FfprobeData;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_file_user' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @Index('file_user_id_index')
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  userId!: string;

  @OneToOne(() => FilePreviewEntity, (filePreview) => filePreview.file, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  preview?: FilePreviewEntity;

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.files, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @ApiProperty({
    description: 'Мониторы',
    required: false,
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/PlaylistResponse' }],
    isArray: true,
  })
  playlists?: PlaylistEntity[];

  @ManyToMany(() => MonitorEntity, (monitor) => monitor.files, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @ApiProperty({
    description: 'Мониторы',
    required: false,
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/MonitorResponse' }],
    isArray: true,
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
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
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
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
  updatedAt?: Date;

  @ApiProperty({
    description: 'Подписанный URL на файл',
    example: 'https://storage.yandex.ru/file.mp4',
    type: 'string',
    required: false,
  })
  @IsUrl({}, { message: i18nValidationMessage('validation.IS_URL') })
  signedUrl?: string;

  @AfterLoad()
  @AfterUpdate()
  after() {
    if (this.duration !== undefined && this.duration !== null) {
      this.duration = parseFloat(`${this.duration}`);
    }
  }
}
