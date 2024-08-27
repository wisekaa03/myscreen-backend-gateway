import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  DataSource,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { MonitorMultiple, MonitorStatus, PlaylistStatusEnum } from '@/enums';
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
  storage!: number | null;

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
      .select('"file"."countUsedSpace"', 'countUsedSpace')
      .addSelect('"wallet"."walletSum"', 'walletSum')
      .addSelect('"monitor"."countMonitors"', 'countMonitors')
      .addSelect('"onlineMonitors"."onlineMonitors"', 'onlineMonitors')
      .addSelect('"offlineMonitors"."offlineMonitors"', 'offlineMonitors')
      .addSelect('"emptyMonitors"."emptyMonitors"', 'emptyMonitors')
      .addSelect('"playlistAdded"."playlistAdded"', 'playlistAdded')
      .addSelect('"playlistBroadcast"."playlistBroadcast"', 'playlistBroadcast')
      .addSelect('"monthlyPayment"."monthlyPayment"', 'monthlyPayment')
      .addSelect('"lastLogin"."lastLoginUpdatedAt"', 'lastLoginUpdatedAt')
      .addSelect('"lastLogin"."lastLoginUserAgent"', 'lastLoginUserAgent')
      .addSelect('"user".*')
      .from(UserEntity, 'user')

      // количество мониторов
      .leftJoin(
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
      .leftJoin(
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
      .leftJoin(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('COUNT("offlineMonitors"."id")', 'offlineMonitors')
            .addSelect('"offlineMonitors"."userId"', 'offlineMonitorsUserId')
            .where(`"offlineMonitors"."status" = '${MonitorStatus.Offline}'`)
            .andWhere(
              `"offlineMonitors"."multiple" Not In ('${MonitorMultiple.MIRROR}', '${MonitorMultiple.SCALING}')`,
            )
            .groupBy('"offlineMonitors"."userId"')
            .from(MonitorEntity, 'offlineMonitors'),
        'offlineMonitors',
        '"offlineMonitors"."offlineMonitorsUserId" = "user"."id"',
      )

      .leftJoin(
        (qb: SelectQueryBuilder<MonitorEntity>) =>
          qb
            .select('COUNT("emptyMonitors"."id")', 'emptyMonitors')
            .addSelect('"emptyMonitors"."userId"', 'emptyMonitorsUserId')
            .groupBy('"emptyMonitors"."userId"')
            .from(MonitorEntity, 'emptyMonitors')

            .andWhere(
              `"emptyMonitors"."multiple" Not In ('${MonitorMultiple.MIRROR}', '${MonitorMultiple.SCALING}')`,
            )
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
      .leftJoin(
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
      .leftJoin(
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
      .leftJoin(
        (qb: SelectQueryBuilder<WalletEntity>) =>
          qb
            .select('"monthlyPayment"."userId"', 'monthlyPaymentUserId')
            .addSelect('"monthlyPayment"."createdAt"', 'monthlyPayment')
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
              '"monthlyPayment"."createdAt" >= now()::timestamptz - interval \'28 days\'',
            )
            .andWhere('"monthlyPayment"."actId" IS NOT NULL')
            .andWhere('"monthlyPayment"."invoiceId" IS NULL')
            .orderBy('"monthlyPayment"."createdAt"', 'DESC')
            .from(WalletEntity, 'monthlyPayment')
            .limit(1),
        'monthlyPayment',
        '"monthlyPaymentUserId" = "user"."id"',
      )

      // все плейлисты
      .leftJoin(
        (qb: SelectQueryBuilder<PlaylistEntity>) =>
          qb
            .select('"playlistAdded"."userId"', 'playlistUserId')
            .addSelect('COUNT(*)', 'playlistAdded')
            .groupBy('"playlistAdded"."userId"')
            .from(PlaylistEntity, 'playlistAdded'),
        'playlistAdded',
        '"playlistUserId" = "user"."id"',
      )

      // Плейлисты, условие что плейлисты.статус = Broadcast
      .leftJoin(
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
      .leftJoin(
        (qb: SelectQueryBuilder<RefreshTokenEntity>) =>
          qb
            .select('"lastLogin"."userId"', 'lastLoginUserId')
            .addSelect('"lastLogin"."updatedAt"', 'lastLoginUpdatedAt')
            .addSelect('"lastLogin"."userAgent"', 'lastLoginUserAgent')
            .groupBy('"lastLogin"."userId"')
            .addGroupBy('"lastLogin"."updatedAt"')
            .addGroupBy('"lastLogin"."userAgent"')
            .orderBy('"lastLogin"."updatedAt"', 'DESC')
            .where('"lastLogin"."expires" >= now()::timestamptz')
            .andWhere('"lastLogin"."isRevoked" = false')
            .limit(1)
            .from(RefreshTokenEntity, 'lastLogin'),
        'lastLogin',
        '"lastLoginUserId" = "user"."id"',
      ),
})
export class UserExtView extends UserEntity {
  // добавочные LEFT JOIN поля

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  countUsedSpace?: string | null;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  countMonitors?: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  onlineMonitors?: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  offlineMonitors?: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  emptyMonitors?: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  walletSum?: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  monthlyPayment?: Date;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  playlistAdded?: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  playlistBroadcast?: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  lastLoginUpdatedAt?: string;

  @ViewColumn()
  @ApiHideProperty()
  @Exclude()
  lastLoginUserAgent?: string;

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
}
