import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
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
  MaxLength,
} from 'class-validator';

import {
  RequestApprove,
  MonitorStatus,
  PlaylistStatusEnum,
  UserPlanEnum,
  UserRole,
  UserRoleEnum,
} from '@/enums';
import { FileEntity } from './file.entity';
import { UserEntity } from './user.entity';
import { MonitorEntity } from './monitor.entity';
import { WalletEntity } from './wallet.entity';
import { PlaylistEntity } from './playlist.entity';
import { RequestEntity } from './request.entity';

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
            .select(
              '"playlistMonitorPlayed"."userId"',
              'playlistMonitorPlayedUserId',
            )
            .addSelect(
              'COUNT("playlistMonitorPlayed"."userId")',
              'playlistMonitorPlayed',
            )
            .groupBy(
              '"playlistMonitorPlayed"."userId", "playlist"."playlistPlayedUserId", "playlist"."playlistStatus"',
            )

            .leftJoinAndSelect(
              (qbb: SelectQueryBuilder<PlaylistEntity>) =>
                qbb
                  .select('"playlist"."status"', 'playlistStatus')
                  .addSelect('"playlist"."userId"', 'playlistPlayedUserId')
                  .from(PlaylistEntity, 'playlist'),
              'playlist',
              '"playlistPlayedUserId" = "playlistMonitorPlayed"."userId"',
            )

            .where('"playlistMonitorPlayed"."playlistPlayed" = true')
            .andWhere(`"playlistStatus" = '${PlaylistStatusEnum.Broadcast}'`)
            .from(MonitorEntity, 'playlistMonitorPlayed'),
        'playlistMonitorPlayed',
        '"playlistMonitorPlayedUserId" = "user"."id"',
      )

      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('"onlineMonitors"."userId"', 'onlineMonitorsUserId')
            .addSelect('COUNT("onlineMonitors"."id")', 'onlineMonitors')
            .groupBy(
              '"onlineMonitors"."userId", "requestMonitors"."requestOnlineMonitorId"',
            )
            .where(`"onlineMonitors"."status" = '${MonitorStatus.Online}'`)
            .from(MonitorEntity, 'onlineMonitors')

            .innerJoinAndSelect(
              (qbb: SelectQueryBuilder<RequestEntity>) =>
                qbb
                  .select(
                    '"requestMonitors"."monitorId"',
                    'requestOnlineMonitorId',
                  )
                  .groupBy('"requestMonitors"."monitorId"')
                  .where(
                    `"requestMonitors"."approved" = '${RequestApprove.ALLOWED}'`,
                  )
                  .andWhere(
                    '"requestMonitors"."dateWhen" <= \'now()\'::timestamptz',
                  )
                  .andWhere(
                    '"requestMonitors"."dateBefore" > \'now()\'::timestamptz',
                  )
                  .orWhere(
                    `"requestMonitors"."approved" = '${RequestApprove.ALLOWED}'`,
                  )
                  .andWhere(
                    '"requestMonitors"."dateWhen" <= \'now()\'::timestamptz',
                  )
                  .andWhere('"requestMonitors"."dateBefore" IS NULL')
                  .from(RequestEntity, 'requestMonitors'),
              'requestMonitors',
              '"requestOnlineMonitorId" = "onlineMonitors"."id"',
            ),

        'onlineMonitors',
        '"onlineMonitorsUserId" = "user"."id"',
      )

      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('"offlineMonitors"."userId"', 'offlineMonitorsUserId')
            .addSelect('COUNT("offlineMonitors"."userId")', 'offlineMonitors')
            .groupBy(
              '"offlineMonitors"."userId", "requestMonitors"."requestOfflineMonitorId"',
            )
            .where(`"offlineMonitors"."status" = '${MonitorStatus.Offline}'`)
            .from(MonitorEntity, 'offlineMonitors')

            .innerJoinAndSelect(
              (qbb: SelectQueryBuilder<RequestEntity>) =>
                qbb
                  .select(
                    '"requestMonitors"."monitorId"',
                    'requestOfflineMonitorId',
                  )
                  .groupBy('"requestMonitors"."monitorId"')
                  .where(
                    `"requestMonitors"."approved" = '${RequestApprove.ALLOWED}'`,
                  )
                  .andWhere(
                    '"requestMonitors"."dateWhen" <= \'now()\'::timestamptz',
                  )
                  .andWhere(
                    '"requestMonitors"."dateBefore" > \'now()\'::timestamptz',
                  )
                  .orWhere(
                    `"requestMonitors"."approved" = '${RequestApprove.ALLOWED}'`,
                  )
                  .andWhere(
                    '"requestMonitors"."dateWhen" <= \'now()\'::timestamptz',
                  )
                  .andWhere('"requestMonitors"."dateBefore" IS NULL')
                  .from(RequestEntity, 'requestMonitors'),
              'requestMonitors',
              '"requestOfflineMonitorId" = "offlineMonitors"."id"',
            ),

        'offlineMonitors',
        '"offlineMonitorsUserId" = "user"."id"',
      )

      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('COUNT(DISTINCT("emptyMonitors"."id"))', 'emptyMonitors')
            .addSelect('"emptyMonitors"."userId"', 'emptyMonitorsUserId')
            .groupBy(
              `
              "emptyMonitors"."userId",
              "requestMonitors"."requestEmptyMonitorId",
              "requestMonitors"."requestEmptyApproved",
              "requestMonitors"."requestEmptyDateBefore"
              `,
            )
            .from(MonitorEntity, 'emptyMonitors')

            .leftJoinAndSelect(
              (qbb: SelectQueryBuilder<RequestEntity>) =>
                qbb
                  .select(
                    '"requestMonitors"."monitorId"',
                    'requestEmptyMonitorId',
                  )
                  .addSelect(
                    '"requestMonitors"."approved"',
                    'requestEmptyApproved',
                  )
                  .addSelect(
                    '"requestMonitors"."dateBefore"',
                    'requestEmptyDateBefore',
                  )
                  .from(RequestEntity, 'requestMonitors'),
              'requestMonitors',
              '"requestEmptyMonitorId" = "emptyMonitors"."id"',
            )

            .where('"requestMonitors"."requestEmptyMonitorId" IS NULL')
            .orWhere(
              `"requestMonitors"."requestEmptyApproved" = '${RequestApprove.ALLOWED}'`,
            )
            .andWhere(
              '"requestMonitors"."requestEmptyDateBefore" < \'now()\'::timestamptz',
            ),

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
    minLength: 6,
    maxLength: 254,
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
    maxLength: 50,
    nullable: true,
    required: false,
  })
  @IsString()
  @MaxLength(50)
  surname!: string | null;

  @ViewColumn()
  @ApiProperty({
    type: 'string',
    description: 'Имя',
    example: 'John',
    maxLength: 50,
    nullable: true,
    required: false,
  })
  @IsString()
  @MaxLength(50)
  name!: string | null;

  @ViewColumn()
  @ApiProperty({
    type: 'string',
    description: 'Отчество',
    maxLength: 50,
    example: 'Doe',
    nullable: true,
    required: false,
  })
  @IsString()
  @MaxLength(50)
  middleName!: string | null;

  @ViewColumn()
  @ApiHideProperty()
  password?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Телефон пользователя',
    example: '+78002000000',
    maxLength: 14,
    nullable: true,
    required: false,
  })
  @IsPhoneNumber()
  phoneNumber?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Город',
    example: 'Krasnodar',
    maxLength: 100,
    nullable: true,
    required: false,
  })
  @IsString()
  @MaxLength(100)
  city?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Страна',
    example: 'RU',
    maxLength: 2,
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
    maxLength: 100,
    nullable: true,
    required: false,
  })
  @IsString()
  @MaxLength(100)
  company?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Юридический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    maxLength: 254,
    required: false,
  })
  @IsString()
  @MaxLength(254)
  companyLegalAddress?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Фактический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    maxLength: 254,
    required: false,
  })
  @IsString()
  @MaxLength(254)
  companyActualAddress?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Идентификационный номер налогоплательщика (ИНН)',
    example: '012345678901',
    maxLength: 12,
    required: false,
  })
  @IsString()
  @MaxLength(12)
  companyTIN?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Код Причины Постановки на учет (КПП)',
    example: '012345678901',
    maxLength: 9,
    required: false,
  })
  @IsString()
  @MaxLength(9)
  companyRRC?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Основной Государственный Регистрационный Номер (ОГРН)',
    example: '012345678901',
    maxLength: 15,
    required: false,
  })
  @IsString()
  @MaxLength(15)
  companyPSRN?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Телефон организации',
    example: '+78002000000',
    maxLength: 14,
    required: false,
  })
  @IsPhoneNumber()
  companyPhone?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Email организации',
    example: 'we@are.the.best',
    maxLength: 254,
    required: false,
  })
  @IsString()
  @MaxLength(254)
  companyEmail?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Наименование банка',
    example: 'Банк',
    maxLength: 254,
    required: false,
  })
  @IsString()
  @MaxLength(254)
  companyBank?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Банковский идентификационный код (БИК)',
    example: '012345678',
    maxLength: 9,
    required: false,
  })
  @IsString()
  @MaxLength(9)
  companyBIC?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Корреспондентский счет',
    example: '30101810400000000000',
    maxLength: 20,
    required: false,
  })
  @IsString()
  @MaxLength(20)
  companyCorrespondentAccount?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Расчетный счет',
    example: '40802810064580000000',
    maxLength: 20,
    required: false,
  })
  @IsString()
  @MaxLength(20)
  companyPaymentAccount?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Факс организации',
    example: '+78002000000',
    maxLength: 14,
    required: false,
  })
  @IsString()
  @MaxLength(14)
  companyFax?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Представитель организации',
    example: 'Тухбатуллина Юлия Евгеньевна',
    maxLength: 254,
    required: false,
  })
  @IsString()
  @MaxLength(254)
  companyRepresentative?: string;

  @ViewColumn()
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

  @ViewColumn()
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
  playlistMonitorPlayed?: number;

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
  planValidityPeriod!: number;

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
