import { Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import type { Response as ExpressResponse } from 'express';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, timeout } from 'rxjs';

import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
} from '@/errors';
import {
  FindManyOptionsExt,
  FindOneOptionsExt,
  MsvcMailInvoiceAwaitingConfirmation,
  MsvcMailInvoiceConfirmed,
  MsvcMailInvoicePayed,
  MsvcFormInvoice,
} from '@/interfaces';
import { formatToContentType } from '@/constants';
import {
  MICROSERVICE_MYSCREEN,
  MsvcFormService,
  MsvcMailService,
  UserRoleEnum,
  SpecificFormat,
  InvoiceStatus,
} from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { InvoiceEntity } from './invoice.entity';
import { UserEntity } from './user.entity';
import { WalletEntity } from './wallet.entity';
import { WsStatistics } from './ws.statistics';
import { WalletService } from './wallet.service';
import { FileService } from './file.service';
import { FolderService } from './folder.service';
import { FileEntity } from './file.entity';
import { UserExtView } from './user-ext.view';
import { I18nPath } from '@/i18n';

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
    @Inject(MICROSERVICE_MYSCREEN.MAIL)
    private readonly mailMsvc: ClientProxy,
    @Inject(MICROSERVICE_MYSCREEN.FORM)
    private readonly formService: ClientProxy,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(UserExtView)
    private readonly userExtRepository: Repository<UserExtView>,
    private readonly entityManager: EntityManager,
  ) {
    this.minInvoiceSum = parseInt(
      this.configService.getOrThrow('MIN_INVOICE_SUM'),
      10,
    );
  }

  async findAndCount(
    find: FindManyOptionsExt<InvoiceEntity>,
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
    find: FindOneOptionsExt<InvoiceEntity>,
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
      throw new BadRequestError<I18nPath>('error.invoice.minimum_sum', {
        args: { sum: this.minInvoiceSum },
      });
    }
    const { id: userId } = user;

    const invoice = await this.entityManager.transaction(
      'REPEATABLE READ',
      async (transact) => {
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
          relations: { user: true, file: true },
        });
        if (!invoice) {
          throw new NotFoundError<I18nPath>('error.invoice.not_found', {
            args: { id },
          });
        }

        return invoice;
      },
    );

    const invoiceChanged = await this.statusChange(
      invoice,
      InvoiceStatus.AWAITING_CONFIRMATION,
    );

    return invoiceChanged;
  }

  async upload(invoice: InvoiceEntity, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestError<I18nPath>('error.invoice.file');
    }
    const { id, user: invoiceUser, userId: invoiceUserId } = invoice;
    const { id: folderId } =
      await this.folderService.invoiceFolder(invoiceUserId);

    await this.entityManager.transaction(
      'REPEATABLE READ',
      async (transact) => {
        const [downloadFile] = await this.fileService.upload({
          userId: invoiceUserId,
          storageSpace: invoiceUser.storageSpace,
          files: file,
          folderId,
          transact,
        });
        await transact.update(InvoiceEntity, id, {
          file: downloadFile,
        });
      },
    );

    const invoiceFind = await this.invoiceRepository.findOne({
      where: { id },
      loadEagerRelations: false,
      relations: { file: true },
    });
    if (!invoiceFind) {
      throw new NotFoundError<I18nPath>('error.invoice.not_found', {
        args: { id },
      });
    }
    if (invoiceFind.file) {
      invoiceFind.file = await this.fileService.signedUrl(invoiceFind.file);
    }
    return invoiceFind;
  }

  async generateInvoiceFile(
    invoice: InvoiceEntity,
    format: SpecificFormat,
    transact?: EntityManager,
  ): Promise<FileEntity> {
    const { id, user: invoiceUser, userId: invoiceUserId, createdAt } = invoice;
    const _transact = transact ?? this.entityManager;

    const language =
      invoiceUser.preferredLanguage ??
      this.configService.getOrThrow('DEFAULT_LANGUAGE');
    const invoiceFileObservable = this.formService.send<
      Buffer,
      MsvcFormInvoice
    >(MsvcFormService.Invoice, {
      format,
      invoice,
      language,
    });
    const fileBuffer = Buffer.from(
      await lastValueFrom(invoiceFileObservable.pipe(timeout(3000))).catch(
        (error: any) => {
          throw new ServiceUnavailableError(
            `File unavailable: ${JSON.stringify(error)}`,
          );
        },
      ),
    );

    const specificFormat = formatToContentType[format]
      ? format
      : SpecificFormat.XLSX;
    const { id: invoiceFolderId } = await this.folderService.invoiceFolder(
      invoiceUserId,
      transact,
    );
    const [file] = await this.fileService.upload({
      userId: invoiceUserId,
      storageSpace: invoiceUser.storageSpace,
      files: fileBuffer,
      folderId: invoiceFolderId,
      originalname: `Счет_на_оплату_MyScreen_${createdAt}_на_сумму_${invoice.sum}₽.${specificFormat}`,
      mimetype: 'application/vnd.ms-excel',
      transact,
    });
    if (!file) {
      throw new InternalServerError();
    }

    await _transact.save(
      InvoiceEntity,
      _transact.create(InvoiceEntity, { id, file }),
    );

    return file;
  }

  async statusChange(
    invoice: InvoiceEntity,
    status: InvoiceStatus,
  ): Promise<InvoiceEntity> {
    const { id, user: invoiceUser, userId: invoiceUserId } = invoice;

    await this.entityManager.transaction(
      'REPEATABLE READ',
      async (transact) => {
        if (invoice.status !== status) {
          const update = await transact.update(InvoiceEntity, id, {
            status,
          });
          if (!update.affected) {
            throw new NotFoundError<I18nPath>('error.invoice.not_found', {
              args: { id },
            });
          }
        }

        switch (status) {
          // Если статус счета "Оплачен", то нужно записать в базу
          // сумму баланса и отправить письмо пользователю
          case InvoiceStatus.PAID: {
            const createdAtFormat = dayjs(invoice.createdAt)
              .locale('ru')
              .format('DD MMMM YYYY г.');
            const description = `Счет на оплату №${invoice.seqNo} от ${createdAtFormat}`;
            // здесь записывается в базу сумма баланса
            await transact.save(
              WalletEntity,
              this.walletService.create({
                userId: invoiceUserId,
                description,
                sum: invoice.sum,
                invoiceId: id,
              }),
            );

            const balance = await this.walletService.walletSum({
              userId: invoiceUserId,
              transact,
            });

            // и выводится письмо о том, что счет оплачен
            this.mailMsvc.emit<unknown, MsvcMailInvoicePayed>(
              MsvcMailService.InvoicePayed,
              {
                invoice,
                user: invoiceUser,
                balance,
              },
            );

            await this.walletService.acceptanceActCreate({
              user: invoiceUser,
              balance,
              transact,
            });

            break;
          }

          // Если статус счета "Ожидание подтверждения", то нужно отправить письма всем Бухгалтерам
          case InvoiceStatus.AWAITING_CONFIRMATION: {
            const accountantUsers = await transact.find(UserExtView, {
              where: {
                role: UserRoleEnum.Accountant,
                disabled: false,
                verified: true,
              },
            });

            accountantUsers.forEach(async (user) => {
              // Вызов сервиса отправки писем
              this.mailMsvc.emit<unknown, MsvcMailInvoiceAwaitingConfirmation>(
                MsvcMailService.InvoiceAwaitingConfirmation,
                {
                  user,
                  invoice,
                },
              );
            });

            break;
          }

          // Если статус счета "Подтвержден, ожидает оплаты", то нужно отправить письмо пользователю
          case InvoiceStatus.CONFIRMED_PENDING_PAYMENT: {
            let { file } = invoice;
            if (!file) {
              file = await this.generateInvoiceFile(
                invoice,
                SpecificFormat.XLSX,
                transact,
              );
            }

            const data = await this.fileService
              .getS3Object(file)
              .catch((error: unknown) => {
                throw new NotFoundError(
                  `File '${file.id}' is not exists: ${JSON.stringify(error)}`,
                );
              });
            if (data.Body instanceof Readable) {
              const invoiceFile = await buffer(data.Body);
              this.mailMsvc.emit<unknown, MsvcMailInvoiceConfirmed>(
                MsvcMailService.InvoiceConfirmed,
                {
                  user: invoiceUser,
                  invoice,
                  invoiceFile,
                },
              );
            }

            break;
          }

          default:
            break;
        }
      },
    );

    if (status === InvoiceStatus.PAID) {
      await this.wsStatistics.onWallet({ userId: invoiceUserId });
    }
    const invoiceChanged = await this.invoiceRepository.findOne({
      where: { id },
      loadEagerRelations: false,
      relations: { file: true },
    });
    if (!invoiceChanged) {
      throw new NotFoundError<I18nPath>('error.invoice.not_found', {
        args: { id },
      });
    }
    if (invoiceChanged.file) {
      invoiceChanged.file = await this.fileService.signedUrl(
        invoiceChanged.file,
      );
    }

    return invoiceChanged;
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

    let { file } = invoice;
    if (!file) {
      file = await this.generateInvoiceFile(invoice, format);
    }

    const data = await this.fileService
      .getS3Object(file)
      .catch((error: unknown) => {
        throw new NotFoundError(`File '${file.id}' is not exists: ${error}`);
      });
    if (data.Body instanceof Readable) {
      this.logger.debug(`The invoice file '${file.name}' has been downloaded`);

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
      res.set({
        'Content-Type': formatToContentType[format],
        'Content-Disposition': `attachment; filename="${invoiceFilename}"`,
      });
      data.Body.pipe(res);
    } else {
      throw new ServiceUnavailableError();
    }
  }
}
