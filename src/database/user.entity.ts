import {
  IsEmail,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
  IsNotEmpty,
  IsISO31661Alpha2,
  IsPhoneNumber,
  IsDefined,
  IsNumber,
  IsDateString,
  IsOptional,
  IsInt,
} from 'class-validator';
import locale from 'country-locale-map';
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
import { i18nValidationMessage } from 'nestjs-i18n';

import { UserPlanEnum, UserRole, UserRoleEnum } from '@/enums';
import { MonitorEntity } from '@/database/monitor.entity';

export const defaultLocation = locale.getCountryByName('Russia');
export const defaultCountry = defaultLocation?.alpha2;
export const defaultLanguage = defaultLocation?.languages[0];
export const defaultLocale = defaultLocation?.default_locale;

@Entity('user', { comment: 'Пользователи' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Идентификатор пользователя',
    format: 'uuid',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  id!: string;

  @Column({ type: 'varchar', unique: true })
  @ApiProperty({
    description: 'EMail пользователя',
    type: 'string',
    format: 'email',
    minLength: 6,
    maxLength: 254,
    example: 'foo@bar.baz',
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email!: string;

  @Index('userDisabledIndex')
  @Column({ type: 'boolean', default: false })
  @ApiHideProperty()
  disabled!: boolean;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    type: 'string',
    description: 'Фамилия',
    example: 'Steve',
    maxLength: 50,
    nullable: true,
    required: false,
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(50, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  surname!: string | null;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    type: 'string',
    description: 'Имя',
    maxLength: 50,
    example: 'John',
    nullable: true,
    required: false,
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(50, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    type: 'string',
    description: 'Отчество',
    maxLength: 50,
    example: 'Doe',
    nullable: true,
    required: false,
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(50, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  middleName!: string | null;

  @Column({ select: false })
  @ApiHideProperty()
  password!: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Телефон пользователя',
    example: '+78002000000',
    maxLength: 14,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: i18nValidationMessage('validation.IS_PHONE_NUMBER'),
  })
  phoneNumber?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Город',
    example: 'Krasnodar',
    maxLength: 100,
    required: false,
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MaxLength(100, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  city!: string;

  @Column({
    length: 2,
    comment: 'Страна',
    default: defaultCountry,
  })
  @ApiProperty({
    description: 'Страна',
    example: defaultCountry,
    maxLength: 2,
    required: false,
  })
  @IsISO31661Alpha2()
  country!: string;

  @Column({
    length: 6,
    comment: 'Предпочитаемый язык',
    default: defaultLanguage,
  })
  @ApiProperty({
    description: 'Предпочитаемый язык',
    example: defaultLanguage,
    maxLength: 6,
    required: false,
  })
  @IsString()
  preferredLanguage!: string;

  @Column({
    length: 6,
    comment: 'Настройки даты',
    default: defaultLocale,
  })
  @ApiProperty({
    description: 'Настройки даты',
    example: defaultLocale,
    maxLength: 6,
    required: false,
  })
  @IsString()
  locale!: string;

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
    enumName: 'UserRole',
    example: UserRoleEnum.Advertiser,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.IS_ENUM') })
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
  @IsEnum(UserPlanEnum, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  plan?: UserPlanEnum;

  @OneToMany(() => MonitorEntity, (monitor) => monitor.user)
  monitors?: MonitorEntity[];

  @Column({ type: 'smallint', default: 0 })
  @ApiProperty({
    description: 'Сколько раз отправлялось напоминание о неуплате',
    example: 0,
  })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  nonPayment!: number;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Компания',
    example: 'ACME corporation',
    maxLength: 100,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Юридический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    maxLength: 254,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  companyLegalAddress?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Фактический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    maxLength: 254,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  companyActualAddress?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Идентификационный номер налогоплательщика (ИНН)',
    example: '012345678901',
    maxLength: 12,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  companyTIN?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Код Причины Постановки на учет (КПП)',
    example: '012345678',
    maxLength: 9,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  companyRRC?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Основной Государственный Регистрационный Номер (ОГРН)',
    example: '012345678901234',
    maxLength: 15,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  companyPSRN?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Телефон организации',
    example: '+78002000000',
    maxLength: 14,
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: i18nValidationMessage('validation.IS_PHONE_NUMBER'),
  })
  companyPhone?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Email организации',
    example: 'we@are.the.best',
    maxLength: 254,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  companyEmail?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Наименование банка',
    example: 'Банк',
    maxLength: 254,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  companyBank?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Банковский идентификационный код (БИК)',
    example: '012345678',
    maxLength: 9,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  companyBIC?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Корреспондентский счет',
    example: '30101810400000000000',
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  companyCorrespondentAccount?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Расчетный счет',
    example: '40802810064580000000',
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  companyPaymentAccount?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Факс организации',
    example: '+78002000000',
    maxLength: 14,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  companyFax?: string;

  @Column({ default: '' })
  @ApiProperty({
    description: 'Представитель организации',
    example: 'Тухбатуллина Юлия Евгеньевна',
    maxLength: 254,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  companyRepresentative?: string;

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
