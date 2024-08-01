import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FileEntity } from './file.entity';

@Entity('file_preview')
@Unique('preview_uniq_file', ['file'])
export class FilePreviewEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_file_preview_id',
  })
  @ApiProperty({
    description: 'Идентификатор превью',
    format: 'uuid',
    required: true,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @OneToOne(() => FileEntity, (file) => file.preview, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  file!: FileEntity;

  @Column({ type: 'uuid', nullable: true })
  @RelationId((preview: FilePreviewEntity) => preview.file)
  fileId!: string;

  @Column({ type: 'bytea', nullable: true })
  preview!: Uint8Array;

  @CreateDateColumn({ select: false })
  createdAt!: Date;

  @UpdateDateColumn({ select: false })
  updatedAt!: Date;
}
