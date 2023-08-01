import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Validate,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
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
import { Point } from 'geojson';
import { Type } from 'class-transformer';

import {
  MonitorCategoryEnum,
  MonitorOrientation,
  MonitorStatus,
} from '@/enums';
import { IsDateStringOrNull } from '@/utils/is-date-string-or-null';
import { UserEntity } from './user.entity';
import { PlaylistEntity } from './playlist.entity';
import { FileEntity } from './file.entity';
// eslint-disable-next-line import/no-cycle
import { MonitorFavoriteEntity } from './monitor.favorite.entity';

export class PointClass implements Point {
  @ApiProperty({
    type: 'string',
    description: 'Point',
    example: 'Point',
    required: true,
  })
  @IsIn(['Point'])
  'type': 'Point' = 'Point' as const;

  @ApiProperty({
    type: Number,
    isArray: true,
    description: '[ Долгота, Широта ]',
    example: [38.97603, 45.04484],
    required: true,
  })
  @IsNumber({}, { each: true })
  coordinates: number[] = [];
}

export class Address {
  @ApiProperty({
    description: 'Страна',
    example: 'Россия',
    required: false,
  })
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Город',
    example: 'Краснодар',
    required: false,
  })
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Улица',
    example: 'Красная',
    required: false,
  })
  @IsString()
  street?: string;

  @ApiProperty({
    description: 'Дом',
    example: '1',
    required: false,
  })
  @IsString()
  house?: string;

  @ApiProperty({
    description: 'Комната',
    example: '1',
    required: false,
  })
  @IsString()
  room?: string;
}

export class MonitorInfo {
  @ApiProperty({
    description: 'Модель',
    example: 'Samsung',
    required: false,
  })
  @IsString()
  model?: string;

  @ApiProperty({
    description: 'Разрешение',
    example: '3840x2190',
    required: false,
  })
  @IsString()
  resolution?: string;

  @ApiProperty({
    description: 'Угол обзора',
    example: 0,
    required: false,
  })
  @IsNumber()
  angle?: number;

  @ApiProperty({
    description: 'Тип матрицы',
    example: 'IPS',
    required: false,
  })
  @IsString()
  matrix?: string;

  @ApiProperty({
    description: 'Яркость',
    example: 0,
    required: false,
  })
  @IsNumber()
  brightness?: number;
}

@Entity('monitor')
@Unique('IDX_user_name', ['user', 'name'])
export class MonitorEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор монитора',
    format: 'uuid',
    required: true,
  })
  @IsUUID()
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Имя',
    example: 'имя монитора',
  })
  @IsDefined()
  @IsNotEmpty()
  name!: string;

  @Column({ type: 'jsonb', default: {} })
  @ApiProperty({
    type: Address,
    description: 'Адрес монитора',
    example: {
      city: 'Krasnodar',
      country: 'Russia',
      street: 'Krasnaya',
      house: '122',
      room: '1',
    },
    required: false,
  })
  @ValidateNested()
  @Type(() => Address)
  address!: Address;

  @Column({ type: 'enum', enum: MonitorCategoryEnum })
  @ApiProperty({
    description: 'Категория',
    enum: MonitorCategoryEnum,
    enumName: 'MonitorCategory',
    example: MonitorCategoryEnum.GAS_STATION,
    required: true,
  })
  @IsEnum(MonitorCategoryEnum)
  category!: MonitorCategoryEnum;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    type: 'integer',
    description: 'Стоимость показа 1 секунды в рублях',
    example: 1,
    required: false,
  })
  @IsInt()
  price1s!: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    type: 'integer',
    description: 'Гарантированное минимальное количество показов в день',
    example: 1,
    required: false,
  })
  @IsInt()
  minWarranty!: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    type: 'integer',
    description: 'Максимальная длительность плэйлиста в секундах',
    example: 1,
    required: false,
  })
  @IsInt()
  maxDuration!: number;

  @Column({ type: 'enum', enum: MonitorOrientation })
  @ApiProperty({
    description: 'Ориентация экрана',
    enum: MonitorOrientation,
    enumName: 'MonitorOrientation',
    example: MonitorOrientation.Horizontal,
    required: true,
  })
  @IsEnum(MonitorOrientation)
  orientation!: MonitorOrientation;

  @Column({ type: 'jsonb', default: {} })
  @ApiProperty({
    type: MonitorInfo,
    description: 'Модель и прочие характеристики монитора',
    example: {
      model: 'Samsung',
      resolution: '1920 x 1080 px',
      angle: 0,
      matrix: 'IPS',
      brightness: 0,
    },
  })
  @ValidateNested()
  @Type(() => MonitorInfo)
  monitorInfo!: MonitorInfo;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Присоединен',
    example: false,
  })
  @IsBoolean()
  attached!: boolean;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({
    description: 'Есть звуковая дорожка',
    example: true,
  })
  @IsBoolean()
  sound!: boolean;

  @Column({ type: 'enum', enum: MonitorStatus, default: MonitorStatus.Offline })
  @Index()
  @ApiProperty({
    description: 'Подключен',
    enum: MonitorStatus,
    enumName: 'MonitorStatus',
    example: MonitorStatus.Offline,
  })
  @IsEnum(MonitorStatus)
  status!: MonitorStatus;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Проигрывается плэйлист',
    example: false,
  })
  @IsBoolean()
  playlistPlayed!: boolean;

  @Column({ type: 'char', length: 11, nullable: true })
  @Index()
  @ApiProperty({
    type: 'string',
    description: 'Идентификатор устройства',
    example: '111-111-111',
    nullable: true,
    required: false,
  })
  @Length(11, 11)
  code!: string | null;

  @Column({ type: 'timestamp', default: null, nullable: true })
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Последний раз виден',
    example: '2021-10-01T10:00:00.147Z',
    nullable: true,
  })
  @Validate(IsDateStringOrNull)
  lastSeen?: Date | null;

  @Column({
    type: 'geometry',
    nullable: true,
    srid: 4326,
    spatialFeatureType: 'Point',
  })
  @ApiProperty({
    type: PointClass,
    example: { type: 'Point', coordinates: [38.97603, 45.04484] },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PointClass)
  location?: Point | null;

  @OneToMany(
    () => MonitorFavoriteEntity,
    (monitorFavorites) => monitorFavorites.monitor,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      cascade: true,
    },
  )
  favorities?: MonitorFavoriteEntity[];

  @ApiProperty({
    description: 'Избранный монитор',
    example: false,
    required: true,
  })
  favorite!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.monitors, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  user!: UserEntity;

  @Column()
  @Index()
  @IsUUID()
  userId!: string;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.monitors, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  playlist?: PlaylistEntity | null;

  @ManyToMany(() => FileEntity, (file) => file.monitors, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  files?: FileEntity[];

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
