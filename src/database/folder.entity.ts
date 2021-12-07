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
import {
  IsUUID,
  IsString,
  MinLength,
  IsAlphanumeric,
  IsDefined,
} from 'class-validator';
import { UserEntity } from '@/database/user.entity';

@Entity('folder')
@Unique('UNIQ_user_name_parentFolder', ['name', 'userId', 'parentFolderId'])
@Index('IDX_user_parentFolder', ['userId', 'parentFolderId'])
export class FolderEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  id?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Наименование папки',
    example: 'bar',
    required: false,
  })
  @IsDefined()
  @IsString()
  @IsAlphanumeric()
  @MinLength(1)
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
  @IsUUID()
  userId!: string;

  @ManyToOne(() => FolderEntity, (folder) => folder.id, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ name: 'parentFolderId' })
  @Index()
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
  parentFolderId!: string;

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
