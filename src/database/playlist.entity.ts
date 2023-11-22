import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
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
  Index,
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
import { EditorEntity } from '@/database/editor.entity';

@Entity('playlist')
@Unique('IDX_userId_name', ['userId', 'name'])
export class PlaylistEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор плэйлиста',
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
    nullable: true,
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

  @Column()
  @Index()
  @IsUUID()
  userId!: string;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Скрытый',
    default: false,
    example: false,
    required: false,
  })
  @IsBoolean()
  hide!: boolean;

  @ManyToMany(() => FileEntity, (file) => file.playlists, {
    cascade: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Файлы',
    type: FileEntity,
  })
  @IsUUID('all', { each: true })
  files!: FileEntity[];

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
  monitors?: MonitorEntity[];

  @OneToMany(() => EditorEntity, (editor) => editor.id, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @ApiProperty({
    description: 'Подчиненные редакторы',
    type: 'array',
    required: false,
    items: { $ref: '#/components/schemas/EditorResponse' },
  })
  @IsOptional()
  editors?: EditorEntity[];

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
      if (monitorPlayed.length > 0) {
        this.status = PlaylistStatusEnum.Broadcast;
      } else if (monitorStatus.length > 0) {
        this.status = PlaylistStatusEnum.NoBroadcast;
      } else {
        this.status = PlaylistStatusEnum.Offline;
      }
    }
  }
}
