import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
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

@Entity('folder', { comment: 'Папки' })
@Index('user_name_parentFolder_Index', ['name', 'userId'])
@Index('user_parentFolder_Index', ['userId', 'parentFolderId'])
export class FolderEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_id' })
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
  @JoinColumn()
  user!: UserEntity;

  @Column()
  @RelationId((folder: FolderEntity) => folder.user)
  @IsUUID()
  userId!: string;

  @ManyToOne(() => FolderEntity, (folder) => folder.id, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  parentFolder!: FolderEntity | null;

  @Column({ nullable: true })
  @RelationId((folder: FolderEntity) => folder.parentFolder)
  @ApiProperty({
    description: 'Родительская папка ID',
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
    example: '2021-01-01T00:00:00.000Z',
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T00:00:00.000Z',
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false })
  updatedAt?: Date;
}
