import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  DataSource,
  OneToMany,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
  AfterLoad,
  AfterInsert,
  AfterUpdate,
} from 'typeorm';
import { intervalToDuration, subDays } from 'date-fns';

import {
  BidApprove,
  MonitorStatus,
  PlaylistStatusEnum,
  UserPlanEnum,
  UserRoleEnum,
} from '@/enums';
import { FileEntity } from './file.entity';
import {
  UserEntity,
  defaultCountry,
  defaultLanguage,
  defaultLocale,
} from './user.entity';
import { MonitorEntity } from './monitor.entity';
import { WalletEntity } from './wallet.entity';
import { PlaylistEntity } from './playlist.entity';
import { BidEntity } from './bid.entity';
import { ActEntity } from './act.entity';

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
  name: 'user_response',
  materialized: false,
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('"user".*')
      .from(UserEntity, 'user')

      // количество мониторов
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('"monitor"."userId"', 'monitorUserId')
            .addSelect('COUNT("monitor"."userId")', 'countMonitors')
            .groupBy('"monitor"."userId"')
            .from(MonitorEntity, 'monitor'),
        'monitor',
        '"monitorUserId" = "user"."id"',
      )

      // все включенные мониторы
      // сначала отбираем все мониторы, а потом идем в заявки и отбираем еще раз по параметрам
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('COUNT("onlineMonitors"."id")', 'onlineMonitors')
            .addSelect('"onlineMonitors"."userId"', 'onlineMonitorsUserId')
            .where(`"onlineMonitors"."status" = '${MonitorStatus.Online}'`)
            .groupBy('"onlineMonitors"."userId"')
            .from(MonitorEntity, 'onlineMonitors')
            .andWhere((qbb: SelectQueryBuilder<BidEntity>) => {
              const query = qbb
                .subQuery()
                .select('"bidOnlineMonitors"."monitorId"')
                .where(
                  '"bidOnlineMonitors"."monitorId" = "onlineMonitors"."id"',
                )
                .andWhere(
                  `"bidOnlineMonitors"."approved" = '${BidApprove.ALLOWED}'`,
                )
                .andWhere(
                  '"bidOnlineMonitors"."dateWhen" <= \'now()\'::timestamptz',
                )
                .andWhere(
                  '"bidOnlineMonitors"."dateBefore" > \'now()\'::timestamptz',
                )
                .orWhere(
                  '"bidOnlineMonitors"."monitorId" = "onlineMonitors"."id"',
                )
                .andWhere(
                  `"bidOnlineMonitors"."approved" = '${BidApprove.ALLOWED}'`,
                )
                .andWhere(
                  '"bidOnlineMonitors"."dateWhen" <= \'now()\'::timestamptz',
                )
                .andWhere('"bidOnlineMonitors"."dateBefore" IS NULL')
                .from(BidEntity, 'bidOnlineMonitors')
                .getQuery();

              return `EXISTS (${query})`;
            }),
        'onlineMonitors',
        '"onlineMonitors"."onlineMonitorsUserId" = "user"."id"',
      )

      // все мониторы, которые сейчас выключены
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('COUNT("offlineMonitors"."id")', 'offlineMonitors')
            .addSelect('"offlineMonitors"."userId"', 'offlineMonitorsUserId')
            .where(`"offlineMonitors"."status" = '${MonitorStatus.Offline}'`)
            .groupBy('"offlineMonitors"."userId"')
            .from(MonitorEntity, 'offlineMonitors')
            .andWhere((qbb: SelectQueryBuilder<BidEntity>) => {
              const query = qbb
                .subQuery()
                .select('"bidOfflineMonitors"."monitorId"')
                .where(
                  '"bidOfflineMonitors"."monitorId" = "offlineMonitors"."id"',
                )
                .andWhere(
                  `"bidOfflineMonitors"."approved" = '${BidApprove.ALLOWED}'`,
                )
                .andWhere(
                  '"bidOfflineMonitors"."dateWhen" <= \'now()\'::timestamptz',
                )
                .andWhere(
                  '"bidOfflineMonitors"."dateBefore" > \'now()\'::timestamptz',
                )
                .orWhere(
                  '"bidOfflineMonitors"."monitorId" = "offlineMonitors"."id"',
                )
                .andWhere(
                  `"bidOfflineMonitors"."approved" = '${BidApprove.ALLOWED}'`,
                )
                .andWhere(
                  '"bidOfflineMonitors"."dateWhen" <= \'now()\'::timestamptz',
                )
                .andWhere('"bidOfflineMonitors"."dateBefore" IS NULL')
                .from(BidEntity, 'bidOfflineMonitors')
                .getQuery();

              return `EXISTS (${query})`;
            }),
        'offlineMonitors',
        '"offlineMonitors"."offlineMonitorsUserId" = "user"."id"',
      )

      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('COUNT("emptyMonitors"."id")', 'emptyMonitors')
            .addSelect('"emptyMonitors"."userId"', 'emptyMonitorsUserId')
            .groupBy('"emptyMonitors"."userId"')
            .from(MonitorEntity, 'emptyMonitors')

            .andWhere((qbb: SelectQueryBuilder<BidEntity>) => {
              const query = qbb
                .subQuery()
                .select('"bidEmptyMonitors"."monitorId"')
                .where('"bidEmptyMonitors"."monitorId" = "emptyMonitors"."id"')
                .from(BidEntity, 'bidEmptyMonitors')
                .getQuery();

              return `NOT EXISTS (${query})`;
            }),

        'emptyMonitors',
        '"emptyMonitors"."emptyMonitorsUserId" = "user"."id"',
      )

      // файлы
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

      // кошелек
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

      // оставшееся время plan=Demo до подключения plan=Full
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<WalletEntity>) =>
          qb
            .select('"wallet"."userId"', 'monthlyPaymentUserId')
            .addSelect('"wallet"."createdAt"', 'monthlyPayment')
            .groupBy('"monthlyPaymentUserId", "monthlyPayment"')
            .where((qbb: SelectQueryBuilder<ActEntity>) => {
              const query = qbb
                .subQuery()
                .select('"act"."userId"', 'monthlyPaymentActUserId')
                .from(ActEntity, 'act')
                .where('"act"."isSubscription" = true')
                .orderBy('"act"."createdAt"', 'DESC')
                .getQuery();
              return `EXISTS (${query})`;
            })
            .andWhere(
              "\"wallet\".\"createdAt\" >= now()::timestamptz - interval '28 days'",
            )
            .andWhere('"wallet"."actId" IS NOT NULL')
            .andWhere('"wallet"."invoiceId" IS NULL')
            .orderBy('"wallet"."createdAt"', 'DESC')
            .from(WalletEntity, 'wallet')
            .limit(1),
        'monthlyPayment',
        '"monthlyPaymentUserId" = "user"."id"',
      )

      // все плейлисты
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<PlaylistEntity>) =>
          qb
            .select('"playlist"."userId"', 'playlistUserId')
            .addSelect('COUNT(*)', 'playlistAdded')
            .groupBy('"playlist"."userId"')
            .from(PlaylistEntity, 'playlist'),
        'playlistAdded',
        '"playlistUserId" = "user"."id"',
      )

      // Плейлисты, условие что плейлисты.статус = Broadcast
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<PlaylistEntity>) =>
          qb
            .select('"playlistBroadcast"."userId"', 'playlistBroadcastUserId')
            .addSelect('COUNT(*)', 'playlistBroadcast')
            .groupBy('"playlistBroadcast"."userId"')

            .where(
              `"playlistBroadcast"."status" = '${PlaylistStatusEnum.Broadcast}'`,
            )
            .from(PlaylistEntity, 'playlistBroadcast'),
        'playlistBroadcast',
        '"playlistBroadcastUserId" = "user"."id"',
      ),
})
export class UserResponse implements UserEntity {
  @ViewColumn()
  @ApiProperty({
    description: 'Идентификатор пользователя',
    format: 'uuid',
  })
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
  phoneNumber?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Город',
    example: 'Krasnodar',
    maxLength: 100,
    nullable: true,
    required: false,
  })
  city!: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Страна',
    example: defaultCountry,
    maxLength: 2,
    required: false,
  })
  country!: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Предпочитаемый язык',
    example: defaultLanguage,
    maxLength: 6,
    required: false,
  })
  preferredLanguage!: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Настройки даты',
    example: defaultLocale,
    maxLength: 6,
    required: false,
  })
  locale!: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Дисковое пространство',
    example: 20000000,
    required: false,
  })
  storageSpace?: number;

  @ViewColumn()
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRoleEnum,
    enumName: 'UserRoleResponse',
    example: UserRoleEnum.Advertiser,
    required: true,
  })
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
  company?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Юридический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    maxLength: 254,
    required: false,
  })
  companyLegalAddress?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Фактический адрес',
    example: 'г. Краснодар, ул. Красная, д. 1',
    maxLength: 254,
    required: false,
  })
  companyActualAddress?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Идентификационный номер налогоплательщика (ИНН)',
    example: '012345678901',
    maxLength: 12,
    required: false,
  })
  companyTIN?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Код Причины Постановки на учет (КПП)',
    example: '012345678901',
    maxLength: 9,
    required: false,
  })
  companyRRC?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Основной Государственный Регистрационный Номер (ОГРН)',
    example: '012345678901',
    maxLength: 15,
    required: false,
  })
  companyPSRN?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Телефон организации',
    example: '+78002000000',
    maxLength: 14,
    required: false,
  })
  companyPhone?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Email организации',
    example: 'we@are.the.best',
    maxLength: 254,
    required: false,
  })
  companyEmail?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Наименование банка',
    example: 'Банк',
    maxLength: 254,
    required: false,
  })
  companyBank?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Банковский идентификационный код (БИК)',
    example: '012345678',
    maxLength: 9,
    required: false,
  })
  companyBIC?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Корреспондентский счет',
    example: '30101810400000000000',
    maxLength: 20,
    required: false,
  })
  companyCorrespondentAccount?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Расчетный счет',
    example: '40802810064580000000',
    maxLength: 20,
    required: false,
  })
  companyPaymentAccount?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Факс организации',
    example: '+78002000000',
    maxLength: 14,
    required: false,
  })
  companyFax?: string;

  @ViewColumn()
  @ApiProperty({
    description: 'Представитель организации',
    example: 'Тухбатуллина Юлия Евгеньевна',
    maxLength: 254,
    required: false,
  })
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
  updatedAt?: Date;

  // добавочные LEFT JOIN поля

  @ViewColumn()
  @ApiHideProperty()
  countUsedSpace!: string;

  @ViewColumn()
  @ApiHideProperty()
  countMonitors!: string;

  @ViewColumn()
  @ApiHideProperty()
  onlineMonitors!: string;

  @ViewColumn()
  @ApiHideProperty()
  offlineMonitors!: string;

  @ViewColumn()
  @ApiHideProperty()
  emptyMonitors!: string;

  @ViewColumn()
  @ApiHideProperty()
  walletSum!: string;

  @ViewColumn()
  @ApiHideProperty()
  monthlyPayment!: Date;

  @ViewColumn()
  @ApiHideProperty()
  playlistAdded!: string;

  @ViewColumn()
  @ApiHideProperty()
  playlistBroadcast!: string;

  // Вычисляемые поля

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

  @ApiProperty({
    description: 'Полное имя',
    required: false,
  })
  fullName!: string;

  @ApiProperty({
    description: 'Полное имя и email',
    required: false,
  })
  fullNameEmail!: string;

  @AfterLoad()
  @AfterInsert()
  @AfterUpdate()
  generate() {
    const {
      role,
      surname,
      name,
      middleName,
      onlineMonitors,
      offlineMonitors,
      emptyMonitors,
      countMonitors,
      playlistAdded,
      playlistBroadcast,
      countUsedSpace,
      storageSpace,
      monthlyPayment,
      walletSum,
    } = this;

    this.fullName = [surname, name, middleName].filter((x) => x).join(' ');
    this.fullNameEmail = `${this.fullName} <${this.email}>`;

    this.metrics = {
      monitors: {
        online: parseInt(onlineMonitors ?? '0', 10),
        offline: parseInt(offlineMonitors ?? '0', 10),
        empty: parseInt(emptyMonitors ?? '0', 10),
        user: parseInt(countMonitors ?? '0', 10),
      },
      playlists: {
        added: parseInt(playlistAdded ?? '0', 10),
        played: parseInt(playlistBroadcast ?? '0', 10),
      },
      storageSpace: {
        storage: parseFloat(countUsedSpace ?? '0'),
        total: parseFloat(`${storageSpace}`),
      },
    };

    if (role === UserRoleEnum.MonitorOwner && monthlyPayment) {
      const planValidityPeriod = Number(intervalToDuration({
        start: monthlyPayment,
        end: subDays(Date.now(), 28),
      }).days);
      this.planValidityPeriod = planValidityPeriod >= 0 ? planValidityPeriod : 0;
    } else {
      this.planValidityPeriod = 0;
    }

    this.wallet = {
      total: parseFloat(walletSum ?? '0'),
    };
  }
}

export const UserResponseToExternal = ({
  password,
  emailConfirmKey,
  forgotConfirmKey,
  countUsedSpace,
  countMonitors,
  onlineMonitors,
  offlineMonitors,
  emptyMonitors,
  walletSum,
  monthlyPayment,
  playlistAdded,
  playlistBroadcast,
  ...user
}: UserResponse): UserResponse => user as UserResponse;
