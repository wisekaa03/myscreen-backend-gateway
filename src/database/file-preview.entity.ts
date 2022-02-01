import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { FileEntity } from './file.entity';

@Entity('file_preview')
export class FilePreviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => FileEntity, (file) => file.id)
  @JoinColumn()
  @Index()
  file!: FileEntity;

  @Column({ type: 'varchar' })
  @ApiProperty({
    description: 'Превью',
    type: 'string',
    required: true,
  })
  preview!: string;

  @CreateDateColumn({ select: false })
  createdAt!: Date;

  @UpdateDateColumn({ select: false })
  updatedAt!: Date;
}
