import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsEnum,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  IsDefined,
} from 'class-validator';
import { MonitorEntity } from '@/database/monitor.entity';
import { UserRole, UserRoleEnum } from './enums/role.enum';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор пользователя',
    format: 'uuid',
    example: '1234567',
  })
  @IsUUID()
  id!: string;

  @Column({ unique: true })
  @ApiProperty({
    description: 'EMail пользователя',
    format: 'email',
    example: 'foo@bar.baz',
  })
  @IsDefined()
  @IsEmail()
  email!: string;

  @Index()
  @Column({ type: 'boolean', default: false })
  @ApiHideProperty()
  disabled!: boolean;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Фамилия', example: 'Steve', required: false })
  @IsString()
  surname?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Имя', example: 'John', required: false })
  @IsString()
  name?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Отчество', example: 'Doe', required: false })
  @IsString()
  middleName?: string;

  @Column()
  @ApiProperty({
    example: 'Secret~12345678',
    description:
      'Пароля пользователя (должен удовлетворять минимальным требованиям)',
    minLength: 8,
    maxLength: 30,
    pattern: '/((?=.*d)|(?=.*W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',
  })
  @IsString()
  @MinLength(8, { message: 'password is too short' })
  @MaxLength(30, { message: 'password is too long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Телефон пользователя',
    example: '+78002000000',
    required: false,
  })
  @IsString()
  phoneNumber?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Город', example: 'Krasnodar', required: false })
  @IsString()
  city?: string;

  @Column({ default: 'RU', nullable: true })
  @ApiProperty({ description: 'Страна', example: 'RU', required: false })
  @IsString()
  country?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Компания',
    example: 'ACME corporation',
    required: false,
  })
  @IsString()
  company?: string;

  @Column({ type: 'enum', enum: UserRoleEnum })
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    type: UserRole,
    example: UserRoleEnum.Advertiser,
  })
  @IsDefined()
  @IsEnum(UserRole)
  role!: UserRoleEnum;

  @Column({ type: 'varchar', nullable: true })
  forgotConfirmKey?: string | null;

  @Column({ type: 'varchar', nullable: true })
  emailConfirmKey?: string | null;

  @OneToMany(() => MonitorEntity, (monitor) => monitor.id)
  @JoinColumn()
  monitors?: MonitorEntity[];

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'EMail подтвержден',
    example: true,
    required: false,
  })
  verified!: boolean;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Демо пользователь',
    example: true,
    required: false,
  })
  isDemoUser!: boolean;

  @Column({ type: 'float', default: 0 })
  @ApiProperty({
    description: 'Использованное место',
    example: 21000000,
    required: false,
  })
  countUsedSpace!: number;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: false,
  })
  updatedAt?: Date;
}
