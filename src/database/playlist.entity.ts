import {
  IsDate,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
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

import { MonitorStatus, PlaylistStatusEnum } from '@/enums';
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

  @Column({
    type: 'enum',
    enum: PlaylistStatusEnum,
    default: PlaylistStatusEnum.Offline,
  })
  @ApiProperty({
    description: 'Статус',
    enum: PlaylistStatusEnum,
    enumName: 'PlaylistStatus',
    example: PlaylistStatusEnum.Offline,
    required: true,
  })
  @IsEnum(PlaylistStatusEnum)
  status!: PlaylistStatusEnum;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ select: false })
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
    items: { $ref: '#/components/schemas/FileResponse' },
  })
  @IsUUID('all', { each: true })
  files?: FileEntity[];

  @OneToMany(() => MonitorEntity, (monitor) => monitor.playlist, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @ApiProperty({
    description: 'Мониторы',
    type: 'array',
    items: { $ref: '#/components/schemas/MonitorResponse' },
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

  @AfterLoad()
  @BeforeInsert()
  @BeforeUpdate()
  after() {
    if (this.monitors) {
      const monitorStatus = this.monitors.filter(
        (monitor) => monitor.status === MonitorStatus.Online,
      );
      const monitorPlayed = this.monitors.filter(
        (monitor) => monitor.playlistPlayed,
      );

      this.status =
        monitorPlayed.length > 0
          ? PlaylistStatusEnum.Broadcast
          : monitorStatus.length > 0
          ? PlaylistStatusEnum.NoBroadcast
          : PlaylistStatusEnum.Offline;
    }
  }
}
