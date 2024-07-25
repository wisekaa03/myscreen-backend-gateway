import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  isNumber,
  IsNumber,
  isNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
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
  RelationId,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Point } from 'geojson';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

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
import { UserEntity } from './user.entity';
import { PlaylistEntity } from './playlist.entity';
import { FileEntity } from './file.entity';
import { StatisticsEntity } from './statistics.entity';

export class PointClass implements Point {
  @ApiProperty({
    type: 'string',
    description: 'Point',
    example: 'Point',
    required: true,
  })
  @IsIn(['Point'], { message: i18nValidationMessage('validation.IS_IN') })
  'type': 'Point' = 'Point' as const;

  @ApiProperty({
    type: Number,
    isArray: true,
    description: '[ Долгота, Широта ]',
    example: [38.97603, 45.04484],
    required: true,
  })
  @IsNumber(
    {},
    { each: true, message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  coordinates: number[] = [];
}

export class Address {
  @ApiProperty({
    description: 'Страна',
    example: 'Россия',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  country?: string;

  @ApiProperty({
    description: 'Город',
    example: 'Краснодар',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  city?: string;

  @ApiProperty({
    description: 'Улица',
    example: 'Красная',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  street?: string;

  @ApiProperty({
    description: 'Дом',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  house?: string;

  @ApiProperty({
    description: 'Комната',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  room?: string;
}

export class MonitorInfo {
  @ApiProperty({
    description: 'Модель',
    example: 'Samsung',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  model?: string;

  @ApiProperty({
    description: 'Разрешение',
    example: '3840x2190',
    required: false,
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  resolution?: string;

  @ApiProperty({
    description: 'Угол обзора',
    example: 0,
    required: false,
  })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  angle?: number;

  @ApiProperty({
    description: 'Тип матрицы',
    example: 'IPS',
    required: false,
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  matrix?: string;

  @ApiProperty({
    description: 'Яркость',
    example: 0,
    required: false,
  })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  brightness?: number;
}

@Entity('monitor', { comment: 'Мониторы' })
@Unique('UNQ_user_name', ['user', 'name'])
export class MonitorEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_monitor_id' })
  @ApiProperty({
    description: 'Идентификатор монитора',
    format: 'uuid',
    required: true,
  })
  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @Column()
  @ApiProperty({
    description: 'Имя',
    example: 'имя монитора',
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
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
  @IsOptional()
  @IsEnum(MonitorCategoryEnum, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  category!: MonitorCategoryEnum;

  @Column({ type: 'numeric', precision: 18, scale: 6, default: 0 })
  @ApiProperty({
    description: 'Стоимость показа 1 секунды в рублях',
    example: 1,
    required: false,
    default: '0',
  })
  @IsOptional()
  @ValidateIf(
    (object, value) =>
      typeof value === 'string'
        ? isNumberString(value)
        : isNumber(value, { allowInfinity: false, allowNaN: false }),
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  price1s!: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    type: 'integer',
    description: 'Гарантированное минимальное количество показов в день',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  minWarranty!: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    type: 'integer',
    description: 'Максимальная длительность плэйлиста в секундах',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
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
  @IsOptional()
  @IsEnum(MonitorOrientation, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  orientation!: MonitorOrientation;

  @Column({ type: 'jsonb', default: {} })
  monitorInfo?: MonitorInfo;

  @Column({ type: 'varchar', nullable: true, default: null })
  @ApiProperty({
    description: 'Модель',
    example: 'Samsung',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @Length(1, 255, { message: i18nValidationMessage('validation.LENGTH') })
  model?: string;

  @Column({ type: 'integer', nullable: true, default: null })
  @ApiProperty({
    description: 'Угол обзора',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  angle?: number;

  @Column({ type: 'varchar', nullable: true, default: null })
  @ApiProperty({
    description: 'Тип матрицы',
    example: 'IPS',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  matrix?: string;

  @Column({ type: 'integer', nullable: true, default: null })
  @ApiProperty({
    description: 'Яркость',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  brightness?: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    type: 'integer',
    description: 'Ширина',
    example: 1920,
    required: true,
  })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  width!: number;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    type: 'integer',
    description: 'Высота',
    example: 1080,
    required: true,
  })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  height!: number;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Присоединен',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  attached!: boolean;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({
    description: 'Есть звук: true/false',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  sound!: boolean;

  @Column({ type: 'enum', enum: MonitorStatus, default: MonitorStatus.Offline })
  @Index('monitorStatusIndex')
  @ApiProperty({
    description: 'Подключен',
    enum: MonitorStatus,
    enumName: 'MonitorStatus',
    example: MonitorStatus.Offline,
  })
  @IsOptional()
  @IsEnum(MonitorStatus, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status!: MonitorStatus;

  @Column({ type: 'integer', default: 0 })
  @ApiProperty({
    description: 'Количество подключенных мониторов в группе',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  groupOnlineMonitors?: number;

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
  @IsEnum(MonitorMultiple, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
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
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
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
  @Length(11, 11, { message: i18nValidationMessage('validation.LENGTH') })
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
  @IsDateString(
    { strict: true },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
  @ValidateIf((object, value) => value !== null)
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
  @JoinColumn({ foreignKeyConstraintName: 'FK_monitor_user_id' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @RelationId((monitor: MonitorEntity) => monitor.user)
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Пользователь ID',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  userId!: string;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.monitors, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_monitor_playlist_id' })
  playlist?: PlaylistEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  playlistId?: string | null;

  @ManyToMany(() => FileEntity, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  photos!: FileEntity[];

  @ManyToMany(() => FileEntity, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable()
  documents!: FileEntity[];

  @OneToMany(() => BidEntity, (bid) => bid.monitor, {
    eager: false,
  })
  bids?: BidEntity[];

  @OneToMany(() => StatisticsEntity, (stat) => stat.monitor, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    cascade: true,
    eager: false,
  })
  statistics!: StatisticsEntity[];

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
}
