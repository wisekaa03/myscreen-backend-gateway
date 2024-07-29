import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  DataSource,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
  AfterLoad,
  AfterInsert,
  AfterUpdate,
} from 'typeorm';
import dayjs from 'dayjs';

import {
  MonitorMultiple,
  MonitorStatus,
  PlaylistStatusEnum,
  UserPlanEnum,
} from '@/enums';
import { FileEntity } from './file.entity';
import { UserEntity } from './user.entity';
import { MonitorEntity } from './monitor.entity';
import { WalletEntity } from './wallet.entity';
import { PlaylistEntity } from './playlist.entity';
import { BidEntity } from './bid.entity';
import { ActEntity } from './act.entity';
import { RefreshTokenEntity } from './refreshtoken.entity';
import { Exclude } from 'class-transformer';

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

export class UserLastEntry {
  @ApiProperty({
    description: 'С какого устройства был выполнен последний вход',
    example:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    required: false,
  })
  userAgent?: string;

  @ApiProperty({
    description: 'Когда был выполнен последний вход',
    example: '2020-01-01T00:00:00',
    required: false,
  })
  at?: string;
}

@ViewEntity({
  name: 'user_ext',
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
            .where(`"monitor"."multiple" = '${MonitorMultiple.SINGLE}'`)
            .orWhere(`"monitor"."multiple" = '${MonitorMultiple.SUBORDINATE}'`)
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
            .from(MonitorEntity, 'onlineMonitors'),
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
            .from(MonitorEntity, 'offlineMonitors'),
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
              '"wallet"."createdAt" >= now()::timestamptz - interval \'28 days\'',
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
      )

      // Refresh Token Last Login (lastEntry)
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<RefreshTokenEntity>) =>
          qb
            .select(
              '"refreshTokenLastLogin"."userId"',
              'refreshTokenLastLoginUserId',
            )
            .addSelect(
              '"refreshTokenLastLogin"."updatedAt"',
              'refreshTokenLastLoginUpdatedAt',
            )
            .addSelect(
              '"refreshTokenLastLogin"."userAgent"',
              'refreshTokenLastLoginUserAgent',
            )
            .groupBy('"refreshTokenLastLogin"."userId"')
            .addGroupBy('"refreshTokenLastLogin"."updatedAt"')
            .addGroupBy('"refreshTokenLastLogin"."userAgent"')
            .orderBy('"refreshTokenLastLogin"."updatedAt"', 'DESC')
            .where('"refreshTokenLastLogin"."expires" >= now()::timestamptz')
            .andWhere('"refreshTokenLastLogin"."isRevoked" = false')
            .limit(1)
            .from(RefreshTokenEntity, 'refreshTokenLastLogin'),
        'refreshTokenLastLogin',
        '"refreshTokenLastLoginUserId" = "user"."id"',
      ),
})
export class UserExtView extends UserEntity {
  // добавочные LEFT JOIN поля

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  countUsedSpace!: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  countMonitors!: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  onlineMonitors!: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  offlineMonitors!: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  emptyMonitors!: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  walletSum!: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  monthlyPayment!: Date;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  playlistAdded!: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  playlistBroadcast!: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  refreshTokenLastLoginUpdatedAt!: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  refreshTokenLastLoginUserAgent!: string;

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

  @ApiProperty({
    description: 'Последний вход',
    required: false,
  })
  lastEntry!: UserLastEntry;

  @AfterLoad()
  @AfterInsert()
  @AfterUpdate()
  generate() {
    const {
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
      refreshTokenLastLoginUpdatedAt,
      refreshTokenLastLoginUserAgent,
      createdAt = Date.now(),
    } = this;

    this.fullName = [surname, name, middleName].filter((x) => x).join(' ');
    this.fullNameEmail = `${this.fullName} <${this.email}>`;

    this.lastEntry = {
      userAgent: refreshTokenLastLoginUserAgent,
      at: refreshTokenLastLoginUpdatedAt,
    };

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

    if (this.plan === UserPlanEnum.Demo) {
      const end = dayjs(Date.now()).subtract(14, 'days');
      const duration = dayjs(createdAt).diff(end, 'days');
      this.planValidityPeriod = duration > 0 ? duration : 0;
    } else if (monthlyPayment) {
      const end = dayjs(Date.now()).subtract(28, 'days');
      const duration = dayjs(monthlyPayment).diff(end, 'days');
      this.planValidityPeriod = duration > 0 ? duration : 0;
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
  refreshTokenLastLoginUpdatedAt,
  refreshTokenLastLoginUserAgent,
  ...user
}: UserExtView): UserExtView => user as UserExtView;
