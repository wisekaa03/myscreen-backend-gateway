import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { IsOptional, IsUUID, IsString } from 'class-validator';
import { UserEntity } from '@/database/user.entity';

@Entity('folder')
@Unique('UNIQ_user_name_parentFolder', ['name', 'userId', 'parentFolderId'])
export class FolderEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Наименование папки',
    required: false,
  })
  @IsString()
  name!: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  @Index()
  user!: UserEntity;

  @Column({ nullable: true })
  userId!: string;

  @ManyToOne(() => FolderEntity, (folder) => folder.id, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'parentFolderId' })
  @Index()
  @ApiProperty({
    description: 'Родительская папка',
    type: 'string',
    format: 'uuid',
    name: 'parentFolderId',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentFolder?: FolderEntity;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Родительская папка',
    type: 'string',
    format: 'uuid',
    name: 'parentFolderId',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentFolderId!: string;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  @IsOptional()
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  @IsOptional()
  updatedAt?: Date;
}
