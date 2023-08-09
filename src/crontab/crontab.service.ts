import { Injectable, Logger } from '@nestjs/common';
import { CronJob } from 'cron';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

import { WalletService } from '@/database/wallet.service';

@Injectable()
export class CrontabService {
  logger = new Logger(CrontabService.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * @description: Запускается каждый день в 00:00:00
   */
  @Cron('0 0 0 * * *', { name: CrontabService.name })
  handleAct() {
    this.walletService.calculateBalance();
  }

  /**
   * @description: Добавляет задачу в планировщик
   */
  addCronJob(crontab = '0 0 0 * * *') {
    const job = new CronJob(crontab, () => this.handleAct());

    this.schedulerRegistry.addCronJob(CrontabService.name, job);
    job.start();

    this.logger.warn(`Job "${CrontabService.name}" added: "${crontab}" !`);
  }

  /**
   * @description: Удаляет задачу из планировщика
   */
  deleteCron() {
    this.schedulerRegistry.deleteCronJob(CrontabService.name);
    this.logger.warn(`Job "${CrontabService.name}" deleted!`);
  }
}
