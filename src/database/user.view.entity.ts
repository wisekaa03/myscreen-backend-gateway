import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  DataSource,
  OneToMany,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
} from 'typeorm';
import {
  IsDateString,
  IsDefined,
  IsEmail,
  IsEnum,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';

import { UserRole, UserRoleEnum } from '@/enums';
import { FileEntity } from './file.entity';
import { UserEntity } from './user.entity';
import { MonitorEntity } from './monitor.entity';
import { WalletEntity } from './wallet.entity';

export class Wallet {
  @ApiProperty({
    description: 'Баланс',
    example: 0,
    required: false,
  })
  total?: number;
}

@ViewEntity({
  materialized: false,
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('"user".*')
      .from(UserEntity, 'user')
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('"monitor"."userId"', 'monitorUserId')
            .addSelect('COUNT(*)', 'countMonitors')
            .groupBy('"monitor"."userId"')
            .from(MonitorEntity, 'monitor'),
        'monitor',
        '"monitorUserId" = "user"."id"',
      )
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<FileEntity>) =>
          qb
            .select('"file"."userId"', 'fileUserId')
            .addSelect('SUM("file"."filesize")', 'countUsedSpace')
            .groupBy('"file"."userId"')
            .from(FileEntity, 'file'),
        'file',
        '"fileUserId" = "user"."id"',
      )
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<WalletEntity>) =>
          qb
            .select('"wallet"."userId"', 'walletUserId')
            .addSelect('SUM("wallet"."sum")', 'walletSum')
            .groupBy('"wallet"."userId"')
            .from(WalletEntity, 'wallet'),
        'wallet',
        '"walletUserId" = "user"."id"',
      ),
})
export class UserExtEntity implements UserEntity {
  @ViewColumn()
  @ApiProperty({
    description: 'Идентификатор пользователя',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @ViewColumn()
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

  @ViewColumn()
  @ApiHideProperty()
  disabled!: boolean;

  @ViewColumn()
  @ApiProperty({
    type: 'string',
    description: 'Фамилия',
    example: 'Steve',
    nullable: true,
    required: false,
  })
  @IsString()
  surname!: string | null;

  @ViewColumn()
  @ApiProperty({
    type: 'string',
    description: 'Имя',
    example: 'John',
    nullable: true,
    required: false,
  })
  @IsString()
  name!: string | null;

  @ViewColumn()
  @ApiProperty({
    type: 'string',
    description: 'Отчество',
    example: 'Doe',
    nullable: true,
    required: false,
  })
  @IsString()
  middleName!: string | null;

  @ViewColumn()
  @ApiHideProperty()
  password?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Телефон пользователя',
    example: '+78002000000',
    nullable: true,
    required: false,
  })
  @IsPhoneNumber()
  phoneNumber?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Город',
    example: 'Krasnodar',
    nullable: true,
    required: false,
  })
  @IsString()
  city?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Страна',
    example: 'RU',
    nullable: true,
    required: false,
  })
  @IsISO31661Alpha2()
  country?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Дисковое пространство',
    example: 20000000,
    required: false,
  })
  @IsNumber()
  storageSpace?: number;

  @ViewColumn()
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

  @ViewColumn()
  forgotConfirmKey?: string | null;

  @ViewColumn()
  emailConfirmKey?: string | null;

  @ViewColumn()
  @ApiProperty({
    description: 'EMail подтвержден',
    example: true,
    required: false,
  })
  verified!: boolean;

  @ViewColumn()
  @ApiProperty({
    description: 'Демо пользователь (дата когда включится подписка)',
    example: false,
    required: false,
  })
  isDemoUser?: boolean;

  @OneToMany(() => MonitorEntity, (monitor) => monitor.user)
  monitors?: MonitorEntity[];

  @ViewColumn()
  @ApiProperty({
    description: 'Компания',
    example: 'ACME corporation',
    nullable: true,
    required: false,
  })
  @IsString()
  company?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Юридический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    required: false,
  })
  @IsString()
  companyLegalAddress?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Фактический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    required: false,
  })
  @IsString()
  companyActualAddress?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Идентификационный номер налогоплательщика (ИНН)',
    example: '012345678901',
    required: false,
  })
  @IsString()
  companyTIN?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Код Причины Постановки на учет (КПП)',
    example: '012345678901',
    required: false,
  })
  @IsString()
  companyRRC?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Основной Государственный Регистрационный Номер (ОГРН)',
    example: '012345678901',
    required: false,
  })
  @IsString()
  companyPSRN?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Телефон организации',
    example: '+78002000000',
    required: false,
  })
  @IsPhoneNumber()
  companyPhone?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Email организации',
    example: 'we@are.the.best',
    required: false,
  })
  @IsString()
  companyEmail?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Наименование банка',
    example: 'Банк',
    required: false,
  })
  @IsString()
  companyBank?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Банковский идентификационный код (БИК)',
    example: '012345678',
    required: false,
  })
  @IsString()
  companyBIC?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Корреспондентский счет',
    example: '30101810400000000000',
    required: false,
  })
  @IsString()
  companyCorrespondentAccount?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Расчетный счет',
    example: '40802810064580000000',
    required: false,
  })
  @IsString()
  companyPaymentAccount?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Факс организации',
    example: '+78002000000',
    required: false,
  })
  @IsString()
  companyFax?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Представитель организации',
    example: 'Тухбатуллина Юлия Евгеньевна',
    required: false,
  })
  @IsString()
  companyRepresentative?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Время создания',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  createdAt?: Date;

  @ViewColumn()
  @ApiProperty({
    description: 'Время изменения',
    example: '2021-01-01T10:00:00.147Z',
    required: true,
  })
  @IsDateString({ strict: false })
  updatedAt?: Date;

  @ViewColumn()
  @ApiProperty({
    description: 'Использованное место',
    example: 0,
    required: false,
  })
  countUsedSpace?: number;

  @ViewColumn()
  @ApiProperty({
    description: 'Использованные мониторы',
    example: 0,
    required: false,
  })
  countMonitors?: number;

  @ViewColumn()
  walletSum?: string;

  @ApiProperty({
    description: 'Баланс',
    required: false,
  })
  wallet?: Wallet;
}
