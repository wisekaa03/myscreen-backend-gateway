import internal from 'node:stream';
import type { Response as ExpressResponse } from 'express';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from '@/errors';
import { PrintInvoice } from '@/interfaces';
import { MAIL_SERVICE, formatToContentType } from '@/constants';
import { UserRoleEnum } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { SpecificFormat } from '@/enums/specific-format.enum';
import { InvoiceStatus } from '@/enums/invoice-status.enum';
import { InvoiceEntity } from './invoice.entity';
import { UserEntity } from './user.entity';
import { WalletEntity } from './wallet.entity';
import { WsStatistics } from './ws.statistics';
import { WalletService } from './wallet.service';
import { FileService } from './file.service';
import { FolderService } from './folder.service';

@Injectable()
export class InvoiceService {
  private logger = new Logger(InvoiceService.name);

  public minInvoiceSum: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly folderService: FolderService,
    private readonly fileService: FileService,
    @Inject(forwardRef(() => WsStatistics))
    private readonly wsStatistics: WsStatistics,
    @Inject(MAIL_SERVICE)
    private readonly mailService: ClientProxy,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    this.minInvoiceSum = parseInt(
      this.configService.getOrThrow('MIN_INVOICE_SUM'),
      10,
    );
  }

  async find(
    find: FindManyOptions<InvoiceEntity>,
  ): Promise<[InvoiceEntity[], number]> {
    return this.invoiceRepository.findAndCount(
      TypeOrmFind.findParams(InvoiceEntity, find),
    );
  }

  async findOne(
    find: FindManyOptions<InvoiceEntity>,
  ): Promise<InvoiceEntity | null> {
    return this.invoiceRepository.findOne(
      TypeOrmFind.findParams(InvoiceEntity, find),
    );
  }

  async create(
    user: UserEntity,
    sum: number,
    description?: string,
  ): Promise<InvoiceEntity | null> {
    if (sum < this.minInvoiceSum) {
      throw new BadRequestError('INVOICE_MINIMUM_SUM');
    }
    const { id: userId } = user;
    return this.invoiceRepository.manager.transaction(async (transact) => {
      // Если у пользователя есть счет со статусом "Ожидает подтверждения",
      // "Подтвержден, ожидает оплаты", то нужно присвоить ему статус "Аннулирован".
      const invoices = await transact.find(InvoiceEntity, {
        where: [
          { userId, status: InvoiceStatus.AWAITING_CONFIRMATION },
          { userId, status: InvoiceStatus.CONFIRMED_PENDING_PAYMENT },
        ],
        loadEagerRelations: false,
        relations: {},
      });
      if (invoices.length > 0) {
        const invoicesPromise = Object.values(invoices)?.map((invoice) =>
          transact.save(InvoiceEntity, {
            ...invoice,
            status: InvoiceStatus.CANCELLED,
          }),
        );
        await Promise.all(invoicesPromise);
      }

      const invoiceChanged: DeepPartial<InvoiceEntity> = {
        sum,
        description,
        userId,
        status: InvoiceStatus.AWAITING_CONFIRMATION,
      };

      const { id } = await transact.save(
        InvoiceEntity,
        transact.create(InvoiceEntity, invoiceChanged),
      );

      const invoiceUpdated = await transact.findOne(InvoiceEntity, {
        where: { id },
        loadEagerRelations: true,
        relations: { file: true },
      });

      await this.wsStatistics.onWallet(userId);

      return invoiceUpdated;
    });
  }

  async upload(invoice: InvoiceEntity, file: Express.Multer.File) {
    const { id, user: invoiceUser } = invoice;

    return this.invoiceRepository.manager.transaction(async (transact) => {
      if (!file) {
        throw new BadRequestError('INVOICE_FILE');
      }
      const { id: folderId } =
        await this.folderService.invoiceFolder(invoiceUser);
      const downloadFile = await this.fileService.upload(
        invoiceUser,
        { folderId },
        [file],
      );
      await transact.update(InvoiceEntity, id, {
        file: downloadFile[0],
      });

      const invoiceFind = await transact.findOne(InvoiceEntity, {
        where: { id },
        loadEagerRelations: false,
        relations: { file: true },
      });
      if (!invoiceFind) {
        throw new NotFoundError('INVOICE_NOT_FOUND', { args: { id } });
      }
      return invoiceFind;
    });
  }

  async statusChange(
    invoice: InvoiceEntity,
    status: InvoiceStatus,
  ): Promise<InvoiceEntity> {
    const { id } = invoice;

    return this.invoiceRepository.manager.transaction(async (transact) => {
      const invoiceUpdated = await transact.update(InvoiceEntity, id, {
        status,
      });
      if (!invoiceUpdated.affected) {
        throw new NotFoundError('INVOICE_NOT_FOUND', { args: { id } });
      }
      let invoiceFind = await transact.findOne(InvoiceEntity, {
        where: { id },
        loadEagerRelations: true,
        relations: { user: true, file: true },
      });
      if (!invoiceFind) {
        throw new NotFoundError('INVOICE_NOT_FOUND', { args: { id } });
      }
      const { user: invoiceUser, userId: invoiceUserId } = invoiceFind;

      switch (status) {
        // Если статус счета "Оплачен", то нужно записать в базу
        // сумму баланса и отправить письмо пользователю
        case InvoiceStatus.PAID: {
          // здесь записывается в базу сумма баланса
          await transact.save(
            WalletEntity,
            this.walletService.create({
              userId: invoiceUserId,
              invoice: invoiceFind,
            }),
          );

          const balance = await this.walletService.walletSum({
            userId: invoiceUserId,
            transact,
          });

          // и выводится письмо о том, что счет оплачен
          this.mailService.emit('invoicePayed', {
            invoice: invoiceFind,
            user: invoiceUser,
            balance,
          });

          await this.walletService.acceptanceActCreate({
            user: invoiceUser,
            transact,
            balance,
          });

          await this.wsStatistics.onWallet(invoiceUserId);

          break;
        }

        // Если статус счета "Ожидание подтверждения", то нужно отправить письма всем Бухгалтерам
        case InvoiceStatus.AWAITING_CONFIRMATION: {
          const accountantUsers = await this.userRepository.find({
            where: {
              role: UserRoleEnum.Accountant,
              disabled: false,
              verified: true,
            },
          });

          // Вызов сервиса отправки писем
          this.mailService.emit('invoiceAwaitingConfirmation', {
            accountantUsers,
            invoice: invoiceFind,
          });

          break;
        }

        // Если статус счета "Подтвержден, ожидает оплаты", то нужно отправить письмо пользователю
        case InvoiceStatus.CONFIRMED_PENDING_PAYMENT: {
          this.mailService.emit('invoiceConfirmed', {
            user: invoiceUser,
            invoice: invoiceFind,
          });

          break;
        }

        default:
          break;
      }

      invoiceFind = await transact.findOne(InvoiceEntity, {
        where: { id },
        loadEagerRelations: false,
        relations: { file: true },
      });
      if (!invoiceFind) {
        throw new NotFoundError('INVOICE_NOT_FOUND', { args: { id } });
      }
      return invoiceFind;
    });
  }

  /**
   * Скачивание счета
   *
   * @param {ExpressResponse} res Ответ сервера
   * @param {SpecificFormat} format Формат вывода
   * @param {InvoiceEntity} invoice Счет
   * @return {*}  {Promise<void>}
   * @memberof InvoiceService
   */
  async download(
    res: ExpressResponse,
    format: SpecificFormat,
    invoice: InvoiceEntity,
  ): Promise<void> {
    if (!invoice.user) {
      throw new NotFoundError('Invoice: user not found');
    }

    const { file } = invoice;
    const data = await this.fileService
      .getS3Object(file)
      .catch((error: unknown) => {
        throw new NotFoundError(`File '${file.id}' is not exists: ${error}`);
      });
    if (data.Body instanceof internal.Readable) {
      const specificFormat = formatToContentType[format]
        ? format
        : SpecificFormat.XLSX;

      const createdAt = dayjs(invoice.createdAt || new Date())
        .locale('ru')
        .format('DD[_]MMMM[_]YYYY[_г._в_]hh[_]mm');
      const invoiceFilename = encodeURI(
        `Счет_на_оплату_MyScreen_${createdAt}_на_сумму_${invoice.sum}₽.${specificFormat}`,
      );
      res.statusCode = 200;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${invoiceFilename}"`,
      );
      res.setHeader('Content-Type', formatToContentType[format]);

      this.logger.debug(`The invoice file '${file.name}' has been downloaded`);

      data.Body.pipe(res);
    } else {
      throw new ServiceUnavailableError();
    }
  }
}
