import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  EntityManager,
  Repository,
  Between,
  IsNull,
  Not,
  FindOperator,
} from 'typeorm';
import dayjs from 'dayjs';

import { FindManyOptionsExt, FindOneOptionsExt } from '@/interfaces';
import {
  UserRoleEnum,
  MsvcMailService,
  UserPlanEnum,
  UserStoreSpaceEnum,
  WalletTransactionType,
  MSVC_EXCHANGE,
} from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { getFullName } from '@/utils/full-name';
import { ActService } from './act.service';
import { UserEntity } from './user.entity';
import { WalletEntity } from './wallet.entity';
import { UserExtView } from './user-ext.view';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class WalletService {
  private logger = new Logger(WalletService.name);

  public subscriptionFee: number;

  public subscriptionDescription: string;

  public maxNonPayment: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ActService))
    private readonly actService: ActService,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly ampqConnection: AmqpConnection,
  ) {
    this.subscriptionFee = parseInt(
      this.configService.getOrThrow('SUBSCRIPTION_FEE'),
      10,
    );
    this.subscriptionDescription = this.configService.getOrThrow(
      'SUBSCRIPTION_DESCRIPTION',
    );
    this.maxNonPayment = this.configService.getOrThrow('MAX_NON_PAYMENT', 1);
  }

  async find(
    find: FindManyOptionsExt<WalletEntity>,
  ): Promise<[WalletEntity[], number]> {
    return this.walletRepository.findAndCount(
      TypeOrmFind.findParams(WalletEntity, find),
    );
  }

  async findOne(
    find: FindOneOptionsExt<WalletEntity>,
  ): Promise<WalletEntity | null> {
    return this.walletRepository.findOne(
      TypeOrmFind.findParams(WalletEntity, find),
    );
  }

  create({
    userId,
    description,
    sum,
    invoiceId,
    actId,
    transact,
  }: {
    userId: string;
    description: string;
    sum: number;
    invoiceId?: string;
    actId?: string;
    transact?: EntityManager;
  }): WalletEntity {
    const transactWallet = transact
      ? transact.withRepository(this.walletRepository)
      : this.walletRepository;

    let type: WalletTransactionType;
    if (sum > 0) {
      type = WalletTransactionType.DEBIT;
    } else {
      type = WalletTransactionType.CREDIT;
    }

    return transactWallet.create({
      sum,
      invoiceId,
      type,
      actId,
      userId,
      description,
    });
  }

  async walletSum({
    userId,
    transact: _transact,
    dates,
    invoiceId,
    actId,
    isSubscription = null,
  }: {
    userId: string;
    transact?: EntityManager;
    dates?: [Date, Date];
    actId?: FindOperator<string> | string;
    invoiceId?: FindOperator<string> | string;
    isSubscription?: boolean | null;
  }): Promise<number> {
    const transact = _transact ?? this.entityManager;

    if (isSubscription !== null) {
      const qb = transact
        .createQueryBuilder(WalletEntity, 'wallet')
        .select('SUM("wallet"."sum")', 'SUM')
        .leftJoin('act', 'act', '"act"."id" = "wallet"."actId"')
        .where(`"wallet"."userId" = :userId`, { userId })
        .andWhere('"act"."isSubscription" = :isSubscription', {
          isSubscription,
        })
        .andWhere(`"wallet"."invoiceId" IS NULL`)
        .andWhere(`"wallet"."actId" IS NOT NULL`);
      if (dates) {
        qb.andWhere(`"wallet"."createdAt" BETWEEN :dateStart AND :dateEnd`, {
          dateStart: dates[0],
          dateEnd: dates[1],
        });
      }
      const sum = await qb.getRawOne();
      return sum['SUM'] ?? 0;
    }

    return transact
      .sum(WalletEntity, 'sum', {
        userId,
        invoiceId,
        actId,
        createdAt: dates && Between(dates[0], dates[1]),
      })
      .then((sum) => sum ?? 0);
  }

  /**
   * Создание акта на оплату абонентской платы
   * TODO: Переписать с использованием ActEntity isSubscription
   *
   * @param {UserEntity | UserResponse} user UserEntity | UserResponse
   * @param {EntityManager} transact EntityManager
   */
  async acceptanceActCreate({
    user,
    transact,
    balance,
  }: {
    user: UserExtView | UserEntity;
    transact: EntityManager;
    balance?: number;
  }) {
    // сначала проверяем, что пользователь является владельцем монитора
    if (user.role !== UserRoleEnum.MonitorOwner) {
      return;
    }

    // теперь получаем баланс пользователя
    const { id: userId } = user;
    if (balance === undefined) {
      balance = await this.walletSum({ userId, transact });
    }

    // получаем количество актов за последний месяц
    const toDate = new Date();
    const fromDate = dayjs(toDate).subtract(28, 'days').toDate();
    const actsInPastMonth = Math.abs(
      await this.walletSum({
        userId,
        dates: [fromDate, toDate],
        invoiceId: IsNull(),
        actId: Not(IsNull()),
        isSubscription: true,
        transact,
      }),
    );
    const fullName = getFullName(user);

    this.logger.warn(
      `[✓] User "${fullName}" balance: ₽${balance}, acceptance act in past month: ₽${actsInPastMonth}`,
    );

    if (actsInPastMonth >= this.subscriptionFee) {
      this.logger.warn(
        ` [ ] Skipping "${fullName}" because acceptance act was issued in the last month. Balance ₽${balance}`,
      );
    } else {
      if (balance >= this.subscriptionFee) {
        // теперь списание средств с баланса и создание акта
        const sum = this.subscriptionFee;
        this.logger.warn(
          ` [+] Issue an acceptance act to the user "${fullName}" to the sum of ₽${sum}`,
        );

        await this.actService.create({
          userId,
          sum,
          isSubscription: true,
          description: this.subscriptionDescription,
        });

        // проверяем план пользователя
        if (user.plan === UserPlanEnum.Demo) {
          // если у пользователя был демо-план и он оплатил акт, то переводим его на полный план
          await transact.update(UserEntity, user.id, {
            plan: UserPlanEnum.Full,
            storageSpace: String(UserStoreSpaceEnum.FULL),
            nonPayment: 0,
          });
        }

        balance -= sum;
        this.logger.warn(` [✓] Balance of user "${fullName}": ₽${balance}`);

        // и вывод информации на email
        await this.ampqConnection.publish(
          MSVC_EXCHANGE.MAIL,
          MsvcMailService.BalanceChanged,
          {
            user,
            sum,
            balance,
          },
        );
      } else {
        this.logger.warn(
          ` [!] User "${fullName}" balance ₽${balance} is less than ₽${this.subscriptionFee}`,
        );

        if (user.nonPayment > this.maxNonPayment) {
          // проверяем план пользователя
          if (user.plan !== UserPlanEnum.Demo) {
            // если у пользователя был полный план и он не оплатил акт, то переводим его на демо-план
            await transact.update(UserEntity, user.id, {
              plan: UserPlanEnum.Demo,
              storageSpace: String(UserStoreSpaceEnum.DEMO),
            });
            await transact.increment(WalletEntity, '', 'nonPayment', 1);
          }

          // и вывод информации на email
          await this.ampqConnection.publish(
            MSVC_EXCHANGE.MAIL,
            MsvcMailService.BalanceNotChanged,
            {
              user,
              sum: this.subscriptionFee,
              balance,
            },
          );
        }
      }
    }
  }

  async calculateBalance(): Promise<void> {
    this.logger.warn('Wallet service is calculating balance:');

    this.entityManager.transaction('REPEATABLE READ', async (transact) => {
      const users = await transact.find(UserEntity, {
        where: {
          verified: true,
          disabled: false,
          role: UserRoleEnum.MonitorOwner,
        },
        loadEagerRelations: false,
        relations: {},
      });

      const promiseUsers = users.map(async (user) =>
        this.acceptanceActCreate({
          user,
          transact,
        }),
      );

      await Promise.all(promiseUsers);
    });
  }
}
