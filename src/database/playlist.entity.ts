import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@/database/user.entity';
import { FileEntity } from '@/database/file.entity';

@Entity('playlist')
@Unique('IDX_userId_name', ['userId', 'name'])
export class PlaylistEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор файла',
    example: '1234567',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Имя файла',
    example: 'bar',
  })
  @IsNotEmpty()
  name!: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Имя файла',
    example: 'Описание плэйлиста',
  })
  @IsNotEmpty()
  description!: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column({ nullable: true })
  @IsUUID()
  userId!: string;

  @ManyToMany(() => FileEntity, (file) => file.playlists, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Файлы',
    type: () => FileEntity,
    format: 'uuid',
    isArray: true,
  })
  @IsArray()
  files!: FileEntity[];

  @ManyToMany(() => FileEntity, (file) => file.rendered, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: true,
    eager: false,
  })
  @JoinTable()
  rendered?: FileEntity[];

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
