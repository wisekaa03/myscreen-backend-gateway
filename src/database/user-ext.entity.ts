import { OmitType, ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  DataSource,
  OneToMany,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
  FindOptionsSelect,
} from 'typeorm';
import {
  IsDateString,
  IsDefined,
  IsEmail,
  IsEnum,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { formatDistanceStrict, subDays } from 'date-fns';
import locale from 'date-fns/locale/ru';

import {
  ApplicationApproved,
  MonitorStatus,
  UserPlanEnum,
  UserRole,
  UserRoleEnum,
} from '@/enums';
import { FileEntity } from './file.entity';
import { UserEntity } from './user.entity';
import { MonitorEntity } from './monitor.entity';
import { WalletEntity } from './wallet.entity';
import { PlaylistEntity } from './playlist.entity';
import { ApplicationEntity } from './application.entity';

export class UserMetricsMonitors {
  @ApiProperty({
    description: 'Кол-во устройств с заявками на трансляции',
    type: 'number',
  })
  online!: number;

  @ApiProperty({
    description: 'Кол-во устройств с заявками, но выключенные',
    type: 'number',
  })
  offline!: number;

  @ApiProperty({
    description: 'Кол-во устройств без заявок',
    type: 'number',
  })
  empty!: number;

  @ApiProperty({
    description: 'Кол-во моих мониторов',
    type: 'number',
  })
  user?: number;
}

export class UserMetricsStorage {
  @ApiProperty({
    description: 'Занятое место',
    type: 'number',
  })
  storage!: number;

  @ApiProperty({
    description: 'Максимальное место',
    type: 'number',
  })
  total!: number;
}

export class UserMetricsPlaylists {
  @ApiProperty({
    description: 'Добавленные',
    type: 'number',
  })
  added!: number;

  @ApiProperty({
    description: 'Запущенные',
    type: 'number',
  })
  played!: number;
}

export class UserMetrics {
  @ApiProperty({
    description: 'Статистика мониторов',
    type: () => UserMetricsMonitors,
  })
  monitors!: UserMetricsMonitors;

  @ApiProperty({
    description: 'Дисковое пространство',
    type: () => UserMetricsStorage,
  })
  storageSpace!: UserMetricsStorage;

  @ApiProperty({
    description: 'Плейлисты',
    type: () => UserMetricsPlaylists,
  })
  playlists!: UserMetricsPlaylists;
}

export class UserWallet {
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
      )
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<WalletEntity>) =>
          qb
            .select('"wallet"."userId"', 'monthlyPaymentUserId')
            .addSelect('"wallet"."createdAt"', 'monthlyPayment')
            .groupBy('"wallet"."userId", "monthlyPayment"')
            .where(
              "\"wallet\".\"createdAt\" BETWEEN 'now()'::timestamptz - interval '28 days' AND 'now()'::timestamptz",
            )
            .andWhere('"wallet"."actId" IS NOT NULL')
            .andWhere('"wallet"."invoiceId" IS NULL')
            .orderBy('"wallet"."createdAt"', 'DESC')
            .from(WalletEntity, 'wallet')
            .limit(1),
        'monthlyPayment',
        '"monthlyPaymentUserId" = "user"."id"',
      )
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<PlaylistEntity>) =>
          qb
            .select('"playlist"."userId"', 'playlistUserId')
            .addSelect('COUNT(id)', 'playlistAdded')
            .groupBy('"playlist"."userId"')
            .from(PlaylistEntity, 'playlist'),
        'playlistAdded',
        '"playlistUserId" = "user"."id"',
      )
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('"monitorPlayed"."userId"', 'monitorPlayedUserId')
            .addSelect('COUNT("monitorPlayed"."userId")', 'monitorPlayed')
            .groupBy('"monitorPlayed"."userId"')
            .where('"monitorPlayed"."playlistPlayed" = true')
            .from(MonitorEntity, 'monitorPlayed'),
        'monitorPlayed',
        '"monitorPlayedUserId" = "user"."id"',
      )
      // TODO: Переделать на count
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('"onlineMonitors"."userId"', 'onlineMonitorsUserId')
            .addSelect('COUNT("onlineMonitors"."userId")', 'onlineMonitors')
            .groupBy('"onlineMonitors"."userId"')
            .where(`"onlineMonitors"."status" = '${MonitorStatus.Online}'`)
            .from(MonitorEntity, 'onlineMonitors'),
        'onlineMonitors',
        '"onlineMonitorsUserId" = "user"."id"',
      )
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('"offlineMonitors"."userId"', 'offlineMonitorsUserId')
            .addSelect('COUNT("offlineMonitors"."userId")', 'offlineMonitors')
            .groupBy('"offlineMonitors"."userId"')
            .where(`"offlineMonitors"."status" = '${MonitorStatus.Offline}'`)
            .from(MonitorEntity, 'offlineMonitors'),
        'offlineMonitors',
        '"offlineMonitorsUserId" = "user"."id"',
      )
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('"emptyMonitors"."userId"', 'emptyMonitorsUserId')
            .addSelect('COUNT("emptyMonitors"."userId")', 'emptyMonitors')
            .groupBy('"emptyMonitors"."userId"')
            .where(`"emptyMonitors"."status" = '${MonitorStatus.Online}'`)
            .from(MonitorEntity, 'emptyMonitors'),
        'emptyMonitors',
        '"emptyMonitorsUserId" = "user"."id"',
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
    description: 'План пользователя',
    enum: UserPlanEnum,
    enumName: 'UserPlan',
    example: UserPlanEnum.Full,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserPlanEnum)
  plan?: UserPlanEnum;

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
  countUsedSpace?: number;

  @ViewColumn()
  countMonitors?: number;

  @ViewColumn()
  walletSum?: string;

  @ViewColumn()
  monthlyPayment?: Date;

  @ViewColumn()
  playlistAdded?: number;

  @ViewColumn()
  monitorPlayed?: number;

  @ViewColumn()
  onlineMonitors?: number;

  @ViewColumn()
  offlineMonitors?: number;

  @ViewColumn()
  emptyMonitors?: number;

  @ApiProperty({
    description: 'Оставшийся срок оплаты',
    required: false,
  })
  planValidityPeriod!: string;

  @ApiProperty({
    description: 'Баланс',
    required: false,
  })
  wallet!: UserWallet;

  @ApiProperty({
    description: 'Метрика',
    required: false,
  })
  metrics!: UserMetrics;
}

export const selectUserOptions: FindOptionsSelect<UserExtEntity> = {
  id: true,
  email: true,
  disabled: true,
  surname: true,
  name: true,
  middleName: true,
  phoneNumber: true,
  city: true,
  country: true,
  storageSpace: true,
  plan: true,
  company: true,
  companyEmail: true,
  companyLegalAddress: true,
  companyPhone: true,
  companyPSRN: true,
  companyRRC: true,
  companyTIN: true,
  companyActualAddress: true,
  companyBank: true,
  companyBIC: true,
  companyCorrespondentAccount: true,
  companyPaymentAccount: true,
  role: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
  countUsedSpace: true,
  countMonitors: true,
  monthlyPayment: true,
  walletSum: true,
};

export class UserResponse extends OmitType(UserExtEntity, [
  'forgotConfirmKey',
  'emailConfirmKey',
  'password',
  'monitors',
]) {}

export const userEntityToUser = ({
  forgotConfirmKey,
  emailConfirmKey,
  password,
  monitors,
  monthlyPayment,
  walletSum,
  storageSpace,
  countUsedSpace,
  countMonitors,
  playlistAdded,
  monitorPlayed,
  onlineMonitors,
  offlineMonitors,
  emptyMonitors,
  wallet,
  ...data
}: UserExtEntity): UserExtEntity => ({
  ...data,
  metrics: {
    monitors: {
      online: parseInt(`${onlineMonitors ?? 0}`, 10),
      offline: parseInt(`${offlineMonitors ?? 0}`, 10),
      empty: parseInt(`${emptyMonitors ?? 0}`, 10),
      user: parseInt(`${countMonitors ?? 0}`, 10),
    },
    playlists: {
      added: parseInt(`${playlistAdded ?? 0}`, 10),
      played: parseInt(`${monitorPlayed ?? 0}`, 10),
    },
    storageSpace: {
      storage: parseInt(`${countUsedSpace ?? 0}`, 10),
      total: parseFloat(`${storageSpace ?? 0}`),
    },
  },
  planValidityPeriod: monthlyPayment
    ? formatDistanceStrict(monthlyPayment, subDays(Date.now(), 28), {
        unit: 'day',
        addSuffix: false,
        roundingMethod: 'floor',
        locale,
      })
    : 'now',
  wallet: {
    total: wallet ? wallet.total : parseFloat(walletSum ?? '0'),
  },
});
