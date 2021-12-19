import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsObject,
  IsUUID,
  Length,
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

import {
  MonitorCategoryEnum,
  MonitorOrientation,
  MonitorStatus,
} from '@/enums';
import { UserEntity } from '@/database/user.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { FileEntity } from './file.entity';
import { PlaylistRequest } from '@/dto';

@Entity('monitor')
@Unique('IDX_user_name', ['user', 'name'])
export class MonitorEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор монитора',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Имя',
    example: 'имя монитора',
  })
  @IsNotEmpty()
  name!: string;

  // TODO: transformer functions
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Адрес монитора',
    example: {
      city: 'Krasnodar',
      country: 'Russia',
      street: 'Krasnaya',
      house: 122,
    },
  })
  @IsObject()
  address!: Record<string, string | number>;

  @Column({ type: 'enum', enum: MonitorCategoryEnum })
  @ApiProperty({
    description: 'Категория',
    type: MonitorCategoryEnum,
    enum: MonitorCategoryEnum,
    example: MonitorCategoryEnum.GAS_STATION,
  })
  @IsEnum(MonitorCategoryEnum)
  category!: MonitorCategoryEnum;

  // TODO: transformer functions
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Стоимость показов',
    example: { of1s: 0, show100: 0 },
  })
  @IsObject()
  price!: Record<string, number>;

  @Column({ type: 'enum', enum: MonitorOrientation })
  @ApiProperty({
    description: 'Ориентация экрана',
    type: MonitorOrientation,
    enum: MonitorOrientation,
    example: MonitorOrientation.Horizontal,
    required: true,
  })
  @IsEnum(MonitorOrientation)
  orientation!: MonitorOrientation;

  // TODO: transformer functions
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Модель и прочие характеристики монитора',
    example: {
      model: 'Samsung',
      resolution: 0,
      angle: 0,
      matrix: 0,
      brightness: 0,
    },
  })
  @IsObject()
  monitorInfo!: Record<string, string | number>;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Присоединен',
    example: false,
  })
  @IsBoolean()
  attached?: boolean;

  @Column()
  @ApiProperty({
    description: 'Идентификатор устройства',
    example: '111-111-111',
  })
  @IsNotEmpty()
  @Length(11, 11)
  code!: string;

  @Column({ type: 'enum', enum: MonitorStatus, default: MonitorStatus.Offline })
  @ApiProperty({
    description: 'Подключен',
    type: MonitorStatus,
    enum: MonitorStatus,
    example: MonitorStatus.Offline,
  })
  @IsEnum(MonitorStatus)
  status!: MonitorStatus;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Последний раз виден',
    example: null,
  })
  @IsDate()
  lastSeen?: Date;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({
    description: 'Широта',
    example: '45.0448400',
  })
  @IsLatitude()
  latitude?: number;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({
    description: 'Долгота',
    example: '38.9760300',
  })
  @IsLongitude()
  longitude?: number;

  @ManyToOne(() => UserEntity, (user) => user.monitors, {
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

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  @ApiProperty({
    description: 'Текущий плэйлист',
  })
  currentPlaylistId?: PlaylistEntity;

  @ManyToMany(() => PlaylistEntity, (playlist) => playlist.monitors, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Все плэйлисты',
    type: () => PlaylistEntity,
    isArray: true,
  })
  playlists?: PlaylistEntity[];

  @ManyToMany(() => FileEntity, (file) => file.monitors, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  @ApiProperty({
    description: 'Все файлы',
    type: () => FileEntity,
    isArray: true,
  })
  files?: FileEntity[];

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
