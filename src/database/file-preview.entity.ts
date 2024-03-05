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

import { FileEntity } from './file.entity';

@Entity('file_preview')
@Unique('preview_uniq_file', ['file'])
export class FilePreviewEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор превью',
    example: '1234567',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
  id!: string;

  @OneToOne(() => FileEntity, (file) => file.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  file!: FileEntity;

  @RelationId((preview: FilePreviewEntity) => preview.file)
  fileId!: string;

  @Column({ type: 'bytea', nullable: true })
  preview!: Uint8Array;

  @CreateDateColumn({ select: false })
  createdAt!: Date;

  @UpdateDateColumn({ select: false })
  updatedAt!: Date;
}
