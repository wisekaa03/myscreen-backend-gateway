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
} from 'typeorm';
import subDays from 'date-fns/subDays';

import { UserRoleEnum } from '@/enums/user-role.enum';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MailService } from '@/mail/mail.service';
// eslint-disable-next-line import/no-cycle
import { ActService } from './act.service';
import { UserEntity } from './user.entity';
import { ActEntity } from './act.entity';
import { InvoiceEntity } from './invoice.entity';
import { WalletEntity } from './wallet.entity';
import { UserService } from './user.service';
import { UserPlanEnum } from '@/enums';

@Injectable()
export class WalletService {
  private logger = new Logger(WalletService.name);

  private acceptanceActSum: number;

  private acceptanceActDescription: string;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => ActService))
    private readonly actService: ActService,
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
    actId?: string;
    invoiceId?: string;
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
            createdAt: dates && Between(dates[0], dates[1]),
          })
          .then((sum) => sum ?? 0);
  }

  async walletAcceptanceActFromDate(
    user: UserEntity,
    dates: [Date, Date],
  ): Promise<boolean> {
    const wallets = await this.walletRepository.find({
      where: {
        userId: user.id,
        invoice: IsNull(),
        act: Not(IsNull()),
        createdAt: Between(dates[0], dates[1]),
      },
    });
    return wallets.length > 0;
  }

  async calculateBalance(): Promise<void> {
    this.logger.warn('Wallet service is calculating balance:');

    const toDate = new Date();
    const fromDate = subDays(toDate, 28);
    this.walletRepository.manager.transaction(async (transact) => {
      const users = await transact.find(UserEntity, {
        where: [
          { verified: true, disabled: false, role: UserRoleEnum.MonitorOwner },
        ],
      });

      const promiseUsers = users.map(async (user) => {
        const fullName = `${UserService.fullName(user)} <${user.email}> ${
          user.role
        } / ${user.plan}`;
        const isActInPastMonth = await this.walletAcceptanceActFromDate(user, [
          fromDate,
          toDate,
        ]);
        let balance = await this.walletSum({ userId: user.id, transact });
        this.logger.warn(`[✓] User "${fullName}" balance: ${balance} rub.`);
        if (isActInPastMonth) {
          this.logger.warn(
            ` [ ] Skipping "${fullName}" because acceptance act was issued in the last month. Balance ${balance} rub.`,
          );
        } else if (balance >= this.acceptanceActSum) {
          this.logger.warn(
            ` [+] Issue an acceptance act to the user "${fullName}"`,
          );
          await this.actService.create({
            user,
            sum: this.acceptanceActSum,
            description: this.acceptanceActDescription,
          });
          if (user.plan === UserPlanEnum.Demo) {
            await this.userService.update(user.id, {
              plan: UserPlanEnum.Full,
            });
          }
          balance = await this.walletSum({ userId: user.id, transact });
          this.logger.warn(
            ` [✓] Balance of user "${fullName}: ${balance} rub."`,
          );
          await this.mailService.balanceChanged(
            user,
            this.acceptanceActSum,
            balance,
          );
        } else {
          this.logger.warn(
            ` [!] User "${fullName}" balance is less than ${this.acceptanceActSum} rub.`,
          );
          if (user.plan !== UserPlanEnum.Demo) {
            await this.userService.update(user.id, {
              plan: UserPlanEnum.Demo,
            });
          }
          await this.mailService.balanceNotChanged(
            user,
            this.acceptanceActSum,
            balance,
          );
        }
      });

      await Promise.allSettled(promiseUsers);
    });
  }
}
