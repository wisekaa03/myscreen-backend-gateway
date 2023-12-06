import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  EntityManager,
  FindManyOptions,
  Repository,
  Between,
  IsNull,
  Not,
  FindOperator,
} from 'typeorm';
import subDays from 'date-fns/subDays';
import { ClientProxy } from '@nestjs/microservices';

import { MAIL_SERVICE } from '@/interfaces';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { ActService } from './act.service';
import { UserEntity } from './user.entity';
import { ActEntity } from './act.entity';
import { InvoiceEntity } from './invoice.entity';
import { WalletEntity } from './wallet.entity';
import { UserService } from './user.service';
import { UserPlanEnum } from '@/enums';
import { fullNameFunc } from '@/utils/full-name';

@Injectable()
export class WalletService {
  private logger = new Logger(WalletService.name);

  private acceptanceActSum: number;

  private acceptanceActDescription: string;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ActService))
    private readonly actService: ActService,
    @Inject(MAIL_SERVICE)
    private readonly mailService: ClientProxy,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
  ) {
    this.acceptanceActSum = parseInt(
      this.configService.get<string>('ACCEPTANCE_ACT_SUM', '250'),
      10,
    );
    this.acceptanceActDescription = this.configService.get<string>(
      'ACCEPTANCE_ACT_DESCRIPTION',
      'Оплата за услуги',
    );
  }

  async find(
    find: FindManyOptions<WalletEntity>,
  ): Promise<[Array<WalletEntity>, number]> {
    return this.walletRepository.findAndCount(TypeOrmFind.Nullable(find));
  }

  async findOne(
    find: FindManyOptions<WalletEntity>,
  ): Promise<WalletEntity | null> {
    return this.walletRepository.findOne(TypeOrmFind.Nullable(find));
  }

  create({
    user,
    invoice,
    act,
  }: {
    user: UserEntity;
    invoice?: InvoiceEntity;
    act?: ActEntity;
  }): WalletEntity {
    return this.walletRepository.create({
      sum: (invoice?.sum ?? 0) - (act?.sum ?? 0),
      invoice: invoice ?? null,
      act: act ?? null,
      user,
    });
  }

  async walletSum({
    userId,
    transact,
    dates,
    invoiceId,
    actId,
  }: {
    userId: string;
    transact?: EntityManager;
    dates?: [Date, Date];
    actId?: FindOperator<string> | string;
    invoiceId?: FindOperator<string> | string;
  }): Promise<number> {
    return transact
      ? transact
          .sum(WalletEntity, 'sum', {
            userId,
            invoiceId,
            actId,
            createdAt: dates && Between(dates[0], dates[1]),
          })
          .then((sum) => sum ?? 0)
      : this.walletRepository
          .sum('sum', {
            userId,
            invoiceId,
            actId,
            createdAt: dates && Between(dates[0], dates[1]),
          })
          .then((sum) => sum ?? 0);
  }

  async acceptanceActCreate({
    user,
    transact,
  }: {
    user: UserEntity;
    transact: EntityManager;
  }) {
    // сначала проверяем, что пользователь является владельцем монитора
    if (user.role !== UserRoleEnum.MonitorOwner) {
      return;
    }

    // теперь получаем баланс пользователя
    const { id: userId } = user;
    let balance = await this.walletSum({ userId, transact });

    // получаем количество актов за последний месяц
    const toDate = new Date();
    const fromDate = subDays(toDate, 28);
    const actsInPastMonth = -(await this.walletSum({
      userId,
      dates: [fromDate, toDate],
      invoiceId: IsNull(),
      actId: Not(IsNull()),
      transact,
    }));
    const fullName = fullNameFunc(user);

    this.logger.warn(
      `[✓] User "${fullName}" balance: ₽${balance}, acceptance act in past month: ₽${actsInPastMonth}`,
    );

    if (actsInPastMonth >= this.acceptanceActSum) {
      this.logger.warn(
        ` [ ] Skipping "${fullName}" because acceptance act was issued in the last month. Balance ₽${balance}`,
      );
    } else if (balance > this.acceptanceActSum) {
      // теперь списание средств с баланса и создание акта
      const sum = this.acceptanceActSum;
      this.logger.warn(
        ` [+] Issue an acceptance act to the user "${fullName}" to the sum of ₽${sum}`,
      );
      await this.actService.create({
        user,
        sum,
        description: this.acceptanceActDescription,
      });

      // проверяем план пользователя
      if (user.plan === UserPlanEnum.Demo) {
        // если у пользователя был демо-план и он оплатил акт, то переводим его на полный план
        await transact.update(UserEntity, user.id, {
          plan: UserPlanEnum.Full,
        });
      }

      // опять получаем баланс
      balance = await this.walletSum({
        userId: user.id,
        transact,
      });
      this.logger.warn(` [✓] Balance of user "${fullName}": ₽${balance}`);

      // и вывод информации на email
      this.mailService.emit('balanceChanged', { user, sum, balance });
    } else {
      this.logger.warn(
        ` [!] User "${fullName}" balance ₽${balance} is less than ₽${this.acceptanceActSum}`,
      );

      // проверяем план пользователя
      if (user.plan !== UserPlanEnum.Demo) {
        // если у пользователя был полный план и он не оплатил акт, то переводим его на демо-план
        await transact.update(UserEntity, user.id, {
          plan: UserPlanEnum.Demo,
        });
      }

      // и вывод информации на email
      this.mailService.emit('balanceNotChanged', {
        user,
        sum: this.acceptanceActSum,
        balance,
      });
    }
  }

  async calculateBalance(): Promise<void> {
    this.logger.warn('Wallet service is calculating balance:');

    this.walletRepository.manager.transaction(async (transact) => {
      const users = await transact.find(UserEntity, {
        where: [
          { verified: true, disabled: false, role: UserRoleEnum.MonitorOwner },
        ],
      });

      const promiseUsers = users.map(async (user) =>
        this.acceptanceActCreate({ user, transact }),
      );

      await Promise.allSettled(promiseUsers);
    });
  }
}
