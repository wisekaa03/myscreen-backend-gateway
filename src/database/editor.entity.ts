import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AfterLoad,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
  RelationId,
  BaseEntity,
} from 'typeorm';
import { i18nValidationMessage } from 'nestjs-i18n';

import { RenderingStatus } from '@/enums/rendering-status.enum';
import { UserEntity } from './user.entity';
import { EditorLayerEntity } from '@/database/editor-layer.entity';
import { FileEntity } from './file.entity';
import { PlaylistEntity } from './playlist.entity';

@Entity('editor')
@Unique('IDX_editor_userId_name', ['userId', 'name'])
export class EditorEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_editor_id' })
  @ApiProperty({
    description: 'Идентификатор редактора',
    format: 'uuid',
    required: true,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Имя редактора',
    example: 'имя редактора',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  name!: string;

  @Column({ type: 'integer', default: 1920 })
  @ApiProperty({
    description: 'Ширина редактора',
    type: 'integer',
    example: 1920,
    required: true,
  })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  width!: number;

  @Column({ type: 'integer', default: 1080 })
  @ApiProperty({
    description: 'Высота редактора',
    type: 'integer',
    example: 1080,
    required: true,
  })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  height!: number;

  @Column({ type: 'integer', default: 24 })
  @ApiProperty({
    description: 'Фреймрейт',
    type: 'integer',
    example: 24,
    required: true,
  })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  fps!: number;

  @Column({
    type: 'enum',
    enum: RenderingStatus,
    default: RenderingStatus.Initial,
  })
  @ApiProperty({
    description: 'Статус рендеринга',
    enum: RenderingStatus,
    enumName: 'RenderingStatus',
    example: RenderingStatus.Initial,
    required: true,
  })
  @IsEnum(RenderingStatus, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  renderingStatus!: RenderingStatus;

  @Column({
    type: 'integer',
    default: null,
    nullable: true,
  })
  @ApiProperty({
    type: 'integer',
    description: 'Процент рендеринга',
    example: 0,
    nullable: true,
    required: true,
  })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  renderingPercent!: number | null;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    type: 'string',
    description: 'Ошибка рендеринга',
    nullable: true,
    required: true,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  renderingError!: string | null;

  @ManyToOne(() => FileEntity, (file) => file.id, {
    onDelete: 'CASCADE',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_editor_renderedFile_id' })
  @ApiProperty({
    description: 'Обработанный файл',
    nullable: true,
    allOf: [{ $ref: '#/components/schemas/FileResponse' }],
    required: false,
  })
  renderedFile!: FileEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @RelationId((editor: EditorEntity) => editor.renderedFile)
  renderedFileId!: string | null;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.id, {
    nullable: true,
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_editor_playlist_id' })
  playlist?: PlaylistEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @RelationId((editor: EditorEntity) => editor.playlist)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  playlistId?: string | null;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({
    description: 'Воспроизводить музыку с видео',
    type: 'boolean',
    example: true,
    required: true,
  })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  keepSourceAudio!: boolean;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  @ApiProperty({
    description: 'Общее время',
    example: 0,
    required: true,
  })
  @IsPositive({ message: i18nValidationMessage('validation.IS_POSITIVE') })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  totalDuration!: number;

  @ManyToMany(() => EditorLayerEntity, (layer) => layer.video, {
    nullable: true,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Видео слой',
    type: 'string',
    format: 'uuid',
    isArray: true,
  })
  videoLayers!: EditorLayerEntity[];

  @ManyToMany(() => EditorLayerEntity, (layer) => layer.audio, {
    nullable: true,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Аудио слой',
    type: 'string',
    format: 'uuid',
    isArray: true,
    nullable: true,
  })
  audioLayers!: EditorLayerEntity[];

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_editor_user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @RelationId((editor: EditorEntity) => editor.user)
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Пользователь ID',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  userId!: string;

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
  updatedAt?: Date;

  @AfterLoad()
  @AfterUpdate()
  after() {
    this.totalDuration = parseFloat(`${this.totalDuration || 0}`);
    if (Array.isArray(this.videoLayers) && this.videoLayers.length > 0) {
      this.videoLayers = this.videoLayers.sort((a, b) => a.index - b.index);
    }
    if (Array.isArray(this.audioLayers) && this.audioLayers.length > 0) {
      this.audioLayers = this.audioLayers.sort((a, b) => a.index - b.index);
    }
  }
}
