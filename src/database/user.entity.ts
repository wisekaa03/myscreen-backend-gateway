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
  IsDefined,
  IsNumber,
  IsDateString,
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

import { UserPlanEnum, UserRole, UserRoleEnum } from '@/enums';
import { MonitorEntity } from '@/database/monitor.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор пользователя',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @Column({ type: 'varchar', unique: true })
  @ApiProperty({
    description: 'EMail пользователя',
    type: 'string',
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

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    type: 'string',
    description: 'Фамилия',
    example: 'Steve',
    nullable: true,
    required: false,
  })
  @IsString()
  surname!: string | null;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    type: 'string',
    description: 'Имя',
    example: 'John',
    nullable: true,
    required: false,
  })
  @IsString()
  name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    type: 'string',
    description: 'Отчество',
    example: 'Doe',
    nullable: true,
    required: false,
  })
  @IsString()
  middleName!: string | null;

  @Column({ select: false })
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
    nullable: true,
    required: false,
  })
  @IsPhoneNumber()
  phoneNumber?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Город',
    example: 'Krasnodar',
    nullable: true,
    required: false,
  })
  @IsString()
  city?: string;

  @Column({
    default: 'RU',
    length: 2,
    comment: 'Страна',
  })
  @ApiProperty({
    description: 'Страна',
    example: 'RU',
    nullable: true,
    required: false,
  })
  @IsISO31661Alpha2()
  country?: string;

  @Column({
    type: 'bigint',
    default: 20000000000,
    comment: 'Дисковое пространство',
  })
  @ApiProperty({
    description: 'Дисковое пространство',
    example: 20000000,
    required: false,
  })
  @IsNumber()
  storageSpace?: number;

  @Column({
    type: 'enum',
    enum: UserRoleEnum,
    default: UserRoleEnum.Advertiser,
    comment: 'Роль пользователя',
  })
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRoleEnum,
    enumName: 'UserRoleResponse',
    example: UserRoleEnum.Advertiser,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRoleEnum;

  @Column({ type: 'varchar', nullable: true, select: false })
  forgotConfirmKey?: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  emailConfirmKey?: string | null;

  @Column({ type: 'boolean', default: false, select: false })
  @ApiProperty({
    description: 'EMail подтвержден',
    example: true,
    required: false,
  })
  verified!: boolean;

  @Column({
    type: 'enum',
    enum: UserPlanEnum,
    default: UserPlanEnum.Full,
    comment: 'План пользователя',
  })
  @ApiProperty({
    description: 'План пользователя',
    enum: UserPlanEnum,
    enumName: 'UserPlan',
    example: UserPlanEnum.Full,
    required: false,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserPlanEnum)
  plan?: UserPlanEnum;

  @OneToMany(() => MonitorEntity, (monitor) => monitor.user)
  monitors?: MonitorEntity[];

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Компания',
    example: 'ACME corporation',
    nullable: true,
    required: false,
  })
  @IsString()
  company?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Юридический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    required: false,
  })
  @IsString()
  companyLegalAddress?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Фактический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    required: false,
  })
  @IsString()
  companyActualAddress?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Идентификационный номер налогоплательщика (ИНН)',
    example: '012345678901',
    required: false,
  })
  @IsString()
  companyTIN?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Код Причины Постановки на учет (КПП)',
    example: '012345678901',
    required: false,
  })
  @IsString()
  companyRRC?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Основной Государственный Регистрационный Номер (ОГРН)',
    example: '012345678901',
    required: false,
  })
  @IsString()
  companyPSRN?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Телефон организации',
    example: '+78002000000',
    required: false,
  })
  @IsPhoneNumber()
  companyPhone?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Email организации',
    example: 'we@are.the.best',
    required: false,
  })
  @IsString()
  companyEmail?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Наименование банка',
    example: 'Банк',
    required: false,
  })
  @IsString()
  companyBank?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Банковский идентификационный код (БИК)',
    example: '012345678',
    required: false,
  })
  @IsString()
  companyBIC?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Корреспондентский счет',
    example: '30101810400000000000',
    required: false,
  })
  @IsString()
  companyCorrespondentAccount?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Расчетный счет',
    example: '40802810064580000000',
    required: false,
  })
  @IsString()
  companyPaymentAccount?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Факс организации',
    example: '+78002000000',
    required: false,
  })
  @IsString()
  companyFax?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Представитель организации',
    example: 'Тухбатуллина Юлия Евгеньевна',
    required: false,
  })
  @IsString()
  companyRepresentative?: string;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  createdAt?: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  updatedAt?: Date;
}
