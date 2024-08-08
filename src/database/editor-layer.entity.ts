import {
  IsUUID,
  Min,
  Max,
  IsInt,
  IsDateString,
  ValidateIf,
  isNumberString,
  isNumber,
  isPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FileEntity } from './file.entity';
import { EditorEntity } from './editor.entity';

@Entity('editor_layer')
export class EditorLayerEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_editor_layer_id',
  })
  @ApiProperty({
    description: 'Идентификатор слоя',
    example: '12345678',
    required: true,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @ManyToMany(() => EditorEntity, (editor) => editor.videoLayers, {
    eager: false,
  })
  video?: EditorEntity[];

  @ManyToMany(() => EditorEntity, (editor) => editor.audioLayers, {
    eager: false,
  })
  audio?: EditorEntity[];

  @Column({ type: 'integer', default: 1 })
  @ApiProperty({
    description: 'Индекс файла',
    type: 'integer',
    example: 1,
    default: 1,
    required: true,
  })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  index!: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 10 })
  @ApiProperty({
    type: 'number',
    description: 'Длительность',
    example: 10,
    default: 10,
    required: true,
  })
  @ValidateIf(
    (object, value) =>
      typeof value === 'string'
        ? isNumberString(value) && isPositive(Number(value))
        : isNumber(value, { allowInfinity: false, allowNaN: false }) &&
          isPositive(value),
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  duration!: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  @ApiProperty({
    type: 'number',
    description: 'С какой секунды начать вырезать клип',
    example: 0,
    default: 0,
    required: true,
  })
  @ValidateIf(
    (object, value) =>
      typeof value === 'string'
        ? isNumberString(value) && isPositive(Number(value))
        : isNumber(value, { allowInfinity: false, allowNaN: false }) &&
          isPositive(value),
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  cutFrom!: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 10 })
  @ApiProperty({
    type: 'number',
    description: 'До какой секунды вырезать клип',
    example: 10,
    default: 10,
    required: true,
  })
  @ValidateIf(
    (object, value) =>
      typeof value === 'string'
        ? isNumberString(value) && isPositive(Number(value))
        : isNumber(value, { allowInfinity: false, allowNaN: false }) &&
          isPositive(value),
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  cutTo!: number;

  @Column({ type: 'numeric', precision: 18, scale: 0, default: 0 })
  @ApiProperty({
    type: 'number',
    description: 'С какой секунды начинать воспроизводить клип',
    default: 0,
    example: 0,
    required: true,
  })
  @ValidateIf(
    (object, value) =>
      typeof value === 'string'
        ? isNumberString(value) && isPositive(Number(value))
        : isNumber(value, { allowInfinity: false, allowNaN: false }) &&
          isPositive(value),
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  start!: number;

  @Column({ type: 'numeric', nullable: true, default: null })
  @ApiProperty({
    description: 'Обрезать слева',
    type: 'number',
    required: false,
  })
  @ValidateIf(
    (object, value) =>
      typeof value === 'string'
        ? isNumberString(value)
        : isNumber(value, { allowInfinity: false, allowNaN: false }),
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  cropX!: number | null;

  @Column({ type: 'numeric', nullable: true, default: null })
  @ApiProperty({
    description: 'Обрезать сверху',
    type: 'number',
    required: false,
  })
  @ValidateIf(
    (object, value) =>
      typeof value === 'string'
        ? isNumberString(value)
        : isNumber(value, { allowInfinity: false, allowNaN: false }),
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  cropY!: number | null;

  @Column({ type: 'numeric', nullable: true, default: null })
  @ApiProperty({
    description: 'Ширина обрезки',
    type: 'number',
    required: false,
  })
  @ValidateIf(
    (object, value) =>
      typeof value === 'string'
        ? isNumberString(value)
        : isNumber(value, { allowInfinity: false, allowNaN: false }),
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  cropW!: number | null;

  @Column({ type: 'numeric', nullable: true, default: null })
  @ApiProperty({
    type: 'number',
    description: 'Высота обрезки',
    required: false,
  })
  @ValidateIf(
    (object, value) =>
      typeof value === 'string'
        ? isNumberString(value)
        : isNumber(value, { allowInfinity: false, allowNaN: false }),
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  cropH!: number | null;

  @Column({ type: 'integer', default: 1 })
  @ApiProperty({
    description: 'Аудио дорожка из видео, 0-выключен, 1-включен',
    type: 'integer',
    example: 1,
    default: 1,
    required: true,
  })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @Max(1, { message: i18nValidationMessage('validation.MAX') })
  mixVolume!: number;

  @ManyToOne(() => FileEntity, (file) => file.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    nullable: false,
    eager: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_editor_layer_file_id' })
  @ApiProperty({
    description: 'Файл',
    type: 'string',
    format: 'uuid',
  })
  file!: FileEntity;

  @Column({ type: 'uuid' })
  @RelationId((editorLayer: EditorLayerEntity) => editorLayer.file)
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  fileId!: string;

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
  createdAt!: Date;

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
  updatedAt!: Date;
}
