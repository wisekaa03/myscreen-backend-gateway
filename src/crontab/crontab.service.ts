import { Injectable, Logger } from '@nestjs/common';
import { CronJob } from 'cron';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

import { WalletService } from '@/database/wallet.service';

const calculateBalanceName = 'calculateBalance';

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
  @Cron('0 0 0 * * *', { name: calculateBalanceName })
  calculateBalance() {
    this.walletService.calculateBalance();
  }

  /**
   * @description Добавляет задачу в планировщик
   * @description секунда, минута, час, день месяца, месяц, день недели
   * @param {string} crontab Cтрока в формате cron, по умолчанию запускается каждый день в 00:00:00
   * @param {string} cronName Наименование планировщика
   * @param {Function} cronCommand Ссылка чтобы запускать
   */
  add(
    crontab = '0 0 0 * * *',
    cronName = calculateBalanceName,
    cronCommand = this.calculateBalance,
  ) {
    const job = new CronJob(crontab, () => cronCommand());

    this.schedulerRegistry.addCronJob(cronName, job);

    this.logger.warn(`Job "${cronName}" added: "${crontab}" !`);

    return job;
  }

  /**
   * @description: Удаляет задачу из планировщика
   */
  delete(cronName = calculateBalanceName) {
    this.schedulerRegistry.deleteCronJob(cronName);
    this.logger.warn(`Job "${cronName}" deleted!`);
  }
}
