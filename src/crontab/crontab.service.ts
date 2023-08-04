import { Injectable, Logger } from '@nestjs/common';
import { CronJob } from 'cron';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

import { WalletService } from '@/database/wallet.service';

@Injectable()
export class CrontabService {
  logger = new Logger(CrontabService.name);

  static nameBalance = 'CrontabBalance';

  constructor(
    private readonly walletService: WalletService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  @Cron('0 0 0 * * *', { name: CrontabService.nameBalance })
  handleAct() {
    this.logger.warn('Wallet service is calculating balance...');
    this.walletService.balance();
  }

  addCronJob() {
    const job = new CronJob('0 * * * * *', () => this.handleAct());

    this.schedulerRegistry.addCronJob(CrontabService.nameBalance, job);
    job.start();

    this.logger.warn(
      `job ${CrontabService.nameBalance} added for each minute!`,
    );
  }

  deleteCron() {
    this.schedulerRegistry.deleteCronJob(CrontabService.nameBalance);
    this.logger.warn(`job ${CrontabService.nameBalance} deleted!`);
  }
}
