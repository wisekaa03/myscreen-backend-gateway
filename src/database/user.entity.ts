import {
  IsEmail,
  IsEnum,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsISO31661Alpha2,
  IsPhoneNumber,
  IsDate,
  IsDefined,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

import { UserRole, UserRoleEnum } from '@/enums';
import { MonitorEntity } from '@/database/monitor.entity';

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
  @IsNotEmpty()
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
  @IsPhoneNumber()
  phoneNumber?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Город', example: 'Krasnodar', required: false })
  @IsString()
  city?: string;

  @Column({ default: 'RU', nullable: true })
  @ApiProperty({ description: 'Страна', example: 'RU', required: false })
  @IsISO31661Alpha2()
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
    example: UserRoleEnum.Advertiser,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRoleEnum;

  @Column({ type: 'varchar', nullable: true })
  forgotConfirmKey?: string | null;

  @Column({ type: 'varchar', nullable: true })
  emailConfirmKey?: string | null;

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

  @OneToMany(() => MonitorEntity, (monitor) => monitor.user)
  monitors?: MonitorEntity[];

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
