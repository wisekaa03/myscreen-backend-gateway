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
  BaseEntity,
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
import { i18nValidationMessage } from 'nestjs-i18n';

import { MonitorStatus, PlaylistStatusEnum } from '@/enums';
import { UserEntity } from '@/database/user.entity';
import { FileEntity } from '@/database/file.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { EditorEntity } from '@/database/editor.entity';

@Entity('playlist', { comment: 'Плейлисты' })
@Unique('IDX_userId_name', ['userId', 'name'])
export class PlaylistEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_column_id' })
  @ApiProperty({
    description: 'Идентификатор плэйлиста',
    format: 'uuid',
    required: true,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Имя плэйлиста',
    example: 'имя плэйлиста',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @MinLength(6, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  name!: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Описание плэйлиста',
    example: 'описание плэйлиста',
    nullable: true,
    required: false,
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(1, { message: i18nValidationMessage('validation.MIN_LENGTH') })
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
  @IsEnum(PlaylistStatusEnum, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status!: PlaylistStatusEnum;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'userId', foreignKeyConstraintName: 'FK_playlist_user' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @Index('playlistUserIdIndex')
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  userId!: string;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Скрытый',
    default: false,
    example: false,
    required: false,
  })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
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
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
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
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
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
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
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
