import internal from 'node:stream';
import { buffer } from 'node:stream/consumers';
import type { Response as ExpressResponse } from 'express';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
} from '@/errors';
import { MailInvoiceConfirmed, PrintInvoice } from '@/interfaces';
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

  async findAndCount(
    find: FindManyOptions<InvoiceEntity>,
  ): Promise<[InvoiceEntity[], number]> {
    let invoices: InvoiceEntity[];
    let count = 0;
    [invoices, count] = await this.invoiceRepository.findAndCount(
      TypeOrmFind.findParams(InvoiceEntity, find),
    );

    const invoicePromise = invoices.map(async (value) => {
      const invoice = value;
      if (invoice.file) {
        invoice.file = await this.fileService.signedUrl(invoice.file);
      }
      return invoice;
    });
    invoices = await Promise.all(invoicePromise);

    return [invoices, count];
  }

  async findOne(
    find: FindManyOptions<InvoiceEntity>,
  ): Promise<InvoiceEntity | null> {
    const invoice = await this.invoiceRepository.findOne(
      TypeOrmFind.findParams(InvoiceEntity, find),
    );
    if (invoice?.file) {
      invoice.file = await this.fileService.signedUrl(invoice.file);
    }
    return invoice;
  }

  async create(
    user: UserEntity,
    sum: number,
    description: string,
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

      const invoiceData: DeepPartial<InvoiceEntity> = {
        sum,
        description,
        userId,
        status: InvoiceStatus.AWAITING_CONFIRMATION,
      };

      const { id } = await transact.save(
        InvoiceEntity,
        transact.create(InvoiceEntity, invoiceData),
      );

      const invoice = await transact.findOne(InvoiceEntity, {
        where: { id },
        loadEagerRelations: true,
        relations: { file: true },
      });

      await this.wsStatistics.onWallet(userId);

      return invoice;
    });
  }

  async upload(invoice: InvoiceEntity, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestError('INVOICE_FILE');
    }
    const { id, user: invoiceUser, userId: invoiceUserId } = invoice;
    const { id: folderId } =
      await this.folderService.invoiceFolder(invoiceUserId);

    return this.invoiceRepository.manager.transaction(async (transact) => {
      const [downloadFile] = await this.fileService.upload(
        invoiceUser,
        file,
        folderId,
      );
      await transact.update(InvoiceEntity, id, {
        file: downloadFile,
      });

      const invoiceFind = await transact.findOne(InvoiceEntity, {
        where: { id },
        loadEagerRelations: false,
        relations: { file: true },
      });
      if (!invoiceFind) {
        throw new NotFoundError('INVOICE_NOT_FOUND', { args: { id } });
      }
      invoiceFind.file = invoiceFind.file
        ? await this.fileService.signedUrl(invoiceFind.file)
        : null;
      return invoiceFind;
    });
  }

  async statusChange(
    invoice: InvoiceEntity,
    status: InvoiceStatus,
  ): Promise<InvoiceEntity> {
    const { id } = invoice;

    return this.invoiceRepository.manager.transaction(async (transact) => {
      const { affected } = await transact.update(InvoiceEntity, id, {
        status,
      });
      if (!affected) {
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
              description: `Счет на оплату №${invoice.seqNo} от ${dayjs(invoice.createdAt).locale('ru').format('DD[ ]MMMM[ ]YYYY[ г.]')}`,
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
          let { file } = invoice;
          if (!file) {
            const language =
              invoiceUser.preferredLanguage ??
              this.configService.getOrThrow('DEFAULT_LANGUAGE');
            const invoiceFile = this.mailService.send<Buffer, PrintInvoice>(
              'invoice',
              {
                format: SpecificFormat.XLSX,
                invoice: invoiceFind,
                language,
              },
            );
            const { id: invoiceFolderId } =
              await this.folderService.invoiceFolder(invoiceUserId);
            const fileBuffer = await lastValueFrom(invoiceFile);

            [file] = await this.fileService.upload(
              invoiceUser,
              fileBuffer,
              invoiceFolderId,
              'file.xlsx',
              'application/vnd.ms-excel',
            );
            if (!file) {
              throw new BadRequestError();
            }

            await transact.save(
              InvoiceEntity,
              transact.create(InvoiceEntity, { id, file }),
            );
          }

          const data = await this.fileService
            .getS3Object(file)
            .catch((error: unknown) => {
              throw new NotFoundError(
                `File '${file.id}' is not exists: ${error}`,
              );
            });
          if (data.Body instanceof internal.Readable) {
            const invoiceFile = await buffer(data.Body);
            this.mailService.emit<any, MailInvoiceConfirmed>(
              'invoiceConfirmed',
              {
                user: invoiceUser,
                invoice,
                invoiceFile,
              },
            );
          } else {
            throw new NotFoundError();
          }

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
      invoiceFind.file = invoiceFind.file
        ? await this.fileService.signedUrl(invoiceFind.file)
        : null;
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
    if (file) {
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

        this.logger.debug(
          `The invoice file '${file.name}' has been downloaded`,
        );

        data.Body.pipe(res);
      } else {
        throw new ServiceUnavailableError();
      }
    } else {
      throw new ServiceUnavailableError();
    }
  }
}
