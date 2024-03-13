import {
  BaseEntity,
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
export class FilePreviewEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_id' })
  @ApiProperty({
    description: 'Идентификатор превью',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
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
