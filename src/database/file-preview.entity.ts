import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { FileEntity } from './file.entity';

@Entity('file_preview')
export class FilePreviewEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    example: '1234567',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @ManyToOne(() => FileEntity, (file) => file.preview)
  file!: FileEntity;

  @Column()
  @ApiProperty({
    description: 'Hash файла',
    example: '2b0439011a3a215ae1756bfc342e5bbc',
  })
  @IsString()
  // @IsHash()
  hash!: string;

  @Column()
  @ApiProperty({
    type: 'string',
    description: 'Предпросмотр',
    required: true,
  })
  @IsNotEmpty()
  name!: string;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  updatedAt?: Date;
}
