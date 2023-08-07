import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import {
  IsUUID,
  MinLength,
  IsNotEmpty,
  IsDefined,
  IsString,
  IsDateString,
} from 'class-validator';

import { UserEntity } from '@/database/user.entity';
import { FileEntity } from './file.entity';

@Entity('folder')
@Unique('UNIQ_user_name_parentFolder', ['name', 'userId', 'parentFolderId'])
@Index('IDX_user_parentFolder', ['userId', 'parentFolderId'])
export class FolderEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Наименование папки',
    example: 'bar',
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  @Index()
  user!: UserEntity;

  @Column()
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
  parentFolder!: FolderEntity | null;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Родительская папка',
    type: 'string',
    format: 'uuid',
    nullable: true,
    required: false,
  })
  @IsUUID()
  parentFolderId!: string | null;

  @OneToMany(() => FileEntity, (file) => file.folder, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  files!: FileEntity[];

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  updatedAt!: Date;
}
