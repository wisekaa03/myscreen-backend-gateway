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
  BaseEntity,
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
  MonitorMultiple,
  MonitorOrientation,
  MonitorStatus,
} from '@/enums';
import { MonitorGroup } from '@/dto/request/monitor-group';
import { MonitorFavoriteEntity } from '@/database/monitor.favorite.entity';
import { BidEntity } from '@/database/bid.entity';
import { MonitorGroupEntity } from '@/database/monitor.group.entity';
import { IsDateStringOrNull } from '@/utils/is-date-string-or-null';
import { UserEntity } from './user.entity';
import { PlaylistEntity } from './playlist.entity';
import { FileEntity } from './file.entity';

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

@Entity('monitor', { comment: 'Мониторы' })
@Unique('user_name_Unique', ['user', 'name'])
export class MonitorEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_id' })
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
  @IsString()
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

  @Column({
    type: 'enum',
    enum: MonitorOrientation,
    default: MonitorOrientation.Horizontal,
  })
  @ApiProperty({
    description: 'Ориентация экрана',
    enum: MonitorOrientation,
    enumName: 'MonitorOrientation',
    example: MonitorOrientation.Horizontal,
    required: false,
  })
  @IsEnum(MonitorOrientation)
  orientation!: MonitorOrientation;

  @Column({ type: 'jsonb', default: {} })
  monitorInfo?: MonitorInfo;

  @Column({ type: 'varchar', nullable: true, default: null })
  @ApiProperty({
    description: 'Модель',
    example: 'Samsung',
    required: false,
  })
  @IsString()
  @Length(1, 255)
  model?: string;

  @Column({ type: 'integer', nullable: true, default: null })
  @ApiProperty({
    description: 'Угол обзора',
    example: 0,
    required: false,
  })
  @IsNumber()
  angle?: number;

  @Column({ type: 'varchar', nullable: true, default: null })
  @ApiProperty({
    description: 'Тип матрицы',
    example: 'IPS',
    required: false,
  })
  @IsString()
  matrix?: string;

  @Column({ type: 'integer', nullable: true, default: null })
  @ApiProperty({
    description: 'Яркость',
    example: 100,
    required: false,
  })
  @IsNumber()
  brightness?: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    type: 'integer',
    description: 'Ширина',
    example: 1920,
    required: true,
  })
  @IsNumber()
  width!: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    type: 'integer',
    description: 'Высота',
    example: 1080,
    required: true,
  })
  @IsNumber()
  height!: number;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Присоединен',
    example: false,
  })
  @IsBoolean()
  attached!: boolean;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({
    description: 'Есть звук: true/false',
    example: true,
  })
  @IsBoolean()
  sound!: boolean;

  @Column({ type: 'enum', enum: MonitorStatus, default: MonitorStatus.Offline })
  @Index('monitorStatusIndex')
  @ApiProperty({
    description: 'Подключен',
    enum: MonitorStatus,
    enumName: 'MonitorStatus',
    example: MonitorStatus.Offline,
  })
  @IsEnum(MonitorStatus)
  status!: MonitorStatus;

  @Column({
    type: 'enum',
    enum: MonitorMultiple,
    default: MonitorMultiple.SINGLE,
  })
  @ApiProperty({
    enum: MonitorMultiple,
    enumName: 'MonitorMultiple',
    default: MonitorMultiple.SINGLE,
    description:
      'Обычный монитор, много мониторов с режимом масштабирования или зеркалирования',
    example: MonitorMultiple.SINGLE,
    required: false,
  })
  @IsOptional()
  @IsEnum(MonitorMultiple)
  multiple!: MonitorMultiple;

  @OneToMany(
    () => MonitorGroupEntity,
    (groupMonitor) => groupMonitor.parentMonitor,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      cascade: true,
      eager: false,
    },
  )
  groupMonitors?: MonitorGroupEntity[];

  @ApiProperty({
    description: 'Подчиненные мониторы в группе мониторов',
    type: MonitorGroup,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonitorGroup)
  groupIds?: MonitorGroup[];

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Проигрывается плэйлист',
    example: false,
  })
  @IsBoolean()
  playlistPlayed!: boolean;

  @Column({ type: 'char', length: 11, nullable: true })
  @Index('monitorCodeIndex')
  @ApiProperty({
    type: 'string',
    description: 'Идентификатор устройства',
    example: '111-111-111',
    nullable: true,
    required: false,
  })
  @Length(11, 11)
  code!: string | null;

  @Column({ type: 'timestamptz', default: null, nullable: true })
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Последний раз виден',
    example: '2021-10-01T10:00:00.147Z',
    nullable: true,
    required: false,
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
  @IsUUID()
  userId!: string;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.monitors, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  playlist?: PlaylistEntity | null;

  @Column({ nullable: true })
  @IsUUID()
  playlistId?: string | null;

  @ManyToMany(() => FileEntity, (file) => file.monitors, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  files?: FileEntity[];

  @OneToMany(() => BidEntity, (bid) => bid.monitor, {
    eager: false,
  })
  requests?: BidEntity[];

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
