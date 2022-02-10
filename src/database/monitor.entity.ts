import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
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
import { Type } from 'class-transformer';

import {
  MonitorCategoryEnum,
  MonitorOrientation,
  MonitorStatus,
} from '@/enums';
import { UserEntity } from '@/database/user.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { FileEntity } from './file.entity';

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
    example: 1,
    required: false,
  })
  @IsString()
  house?: string;

  @ApiProperty({
    description: 'Комната',
    example: 1,
    required: false,
  })
  @IsString()
  room?: string;
}

export class MonitorPrice {
  @ApiProperty({
    description: 'Стоимость показа 1 секунды',
    example: 1,
    required: false,
  })
  @IsNumber()
  of1s?: number;

  @ApiProperty({
    description: 'Стоимость 100 показов в день',
    example: 100,
    required: false,
  })
  @IsNumber()
  show100?: number;
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

  // TODO: transformer functions
  @Column({ type: 'json' })
  @ApiProperty({
    type: Address,
    description: 'Адрес монитора',
    example: {
      city: 'Krasnodar',
      country: 'Russia',
      street: 'Krasnaya',
      house: 122,
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

  // TODO: transformer functions
  @Column({ type: 'json' })
  @ApiProperty({
    type: MonitorPrice,
    description: 'Стоимость показов',
    example: { of1s: 0, show100: 0 },
    required: false,
  })
  @ValidateNested()
  @Type(() => MonitorPrice)
  price!: MonitorPrice;

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

  // TODO: transformer functions
  @Column({ type: 'json' })
  @ApiProperty({
    type: MonitorInfo,
    description: 'Модель и прочие характеристики монитора',
    example: {
      model: 'Samsung',
      resolution: 0,
      angle: 0,
      matrix: 0,
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
  attached?: boolean;

  @Column({ unique: true })
  @ApiProperty({
    description: 'Идентификатор устройства',
    example: '111-111-111',
  })
  @IsDefined()
  @IsNotEmpty()
  @Length(11, 11)
  code!: string;

  @Column({ type: 'enum', enum: MonitorStatus, default: MonitorStatus.Offline })
  @ApiProperty({
    description: 'Подключен',
    enum: MonitorStatus,
    enumName: 'MonitorStatus',
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

  @Column({ select: false })
  @IsUUID()
  userId!: string;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.monitors, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  playlist?: PlaylistEntity | null;

  @ManyToMany(() => FileEntity, (file) => file.monitors, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinTable()
  files?: FileEntity[] | null;

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
