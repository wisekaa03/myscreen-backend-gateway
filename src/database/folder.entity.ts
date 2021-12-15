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
import { IsUUID, MinLength, IsAlphanumeric, IsNotEmpty } from 'class-validator';
import { UserEntity } from '@/database/user.entity';
import { MediaEntity } from './media.entity';

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

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Наименование папки',
    example: 'bar',
  })
  @IsNotEmpty()
  @IsAlphanumeric()
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
  parentFolder!: FolderEntity | null;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Родительская папка',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  parentFolderId!: string | null;

  @OneToMany(() => MediaEntity, (media) => media.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  media?: MediaEntity[];

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
