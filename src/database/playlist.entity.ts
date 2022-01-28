import {
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
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@/database/user.entity';
import { FileEntity } from '@/database/file.entity';
import { MonitorEntity } from '@/database/monitor.entity';

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
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column()
  @IsUUID()
  userId!: string;

  @ManyToMany(() => FileEntity, (file) => file.playlists, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Файлы',
    type: 'array',
    isArray: true,
    allOf: [{ $ref: '#/components/schemas/FileResponse' }],
  })
  @IsUUID('all', { each: true })
  files?: FileEntity[];

  @OneToMany(() => MonitorEntity, (monitor) => monitor.playlist, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  @ApiProperty({
    description: 'Мониторы',
    type: 'array',
    isArray: true,
    allOf: [{ $ref: '#/components/schemas/MonitorResponse' }],
  })
  monitors?: MonitorEntity[] | null;

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
