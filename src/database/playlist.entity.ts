import {
  IsArray,
  IsDate,
  IsDefined,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
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
    description: 'Идентификатор плэйлиста',
    example: '1234567',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Имя плэйлиста',
    example: 'имя плэйлиста',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @MinLength(6)
  name!: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Описание плэйлиста',
    example: 'описание плэйлиста',
    required: false,
  })
  @IsString()
  @MinLength(1)
  description!: string;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column()
  @IsUUID()
  userId!: string;

  @ManyToMany(() => FileEntity, (file) => file.playlists, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinTable()
  @IsArray()
  @ApiProperty({
    description: 'Файлы',
    isArray: true,
    allOf: [{ $ref: '#/components/schemas/FileResponse' }],
  })
  files!: FileEntity[];

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDate()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDate()
  updatedAt!: Date;
}
